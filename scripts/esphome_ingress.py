"""Client minimal du builder ESPHome via l'ingress HA (cookie ingress_session).

Usage :
  python esphome_ingress.py get /devices
  python esphome_ingress.py run <fichier.yaml>      # compile + upload OTA (websocket /run)
"""
import asyncio, json, os, subprocess, sys, urllib.request

import websockets

# Reglages locaux par variables d'environnement : aucune adresse de maison en dur.
HA = os.environ.get("HA_HOST", "homeassistant.local:8123")
SLUG = os.environ.get("ESPHOME_SLUG", "5c53de3b_esphome-dev")


def token():
    t = os.environ.get("HA_TOKEN")
    if not t:
        t = subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             '[Environment]::GetEnvironmentVariable("HA_TOKEN","User")'],
            capture_output=True, text=True).stdout.strip()
    return t


async def ha_ws_session():
    async with websockets.connect(f"ws://{HA}/api/websocket", max_size=None) as ws:
        await ws.recv()
        await ws.send(json.dumps({"type": "auth", "access_token": token()}))
        if json.loads(await ws.recv())["type"] != "auth_ok":
            raise SystemExit("auth HA refusée")

        async def sup(i, endpoint, method):
            await ws.send(json.dumps({"id": i, "type": "supervisor/api",
                                      "endpoint": endpoint, "method": method}))
            r = json.loads(await ws.recv())
            if not r.get("success"):
                raise SystemExit(f"{endpoint}: {r}")
            return r["result"]

        info = await sup(1, f"/addons/{SLUG}/info", "get")
        sess = await sup(2, "/ingress/session", "post")
        return info["ingress_entry"].rstrip("/"), sess["session"]


async def main():
    entry, session = await ha_ws_session()
    cookie = f"ingress_session={session}"
    cmd = sys.argv[1]
    if cmd == "get":
        req = urllib.request.Request(f"http://{HA}{entry}{sys.argv[2]}", headers={"Cookie": cookie})
        with urllib.request.urlopen(req, timeout=30) as r:
            print(r.read().decode())
    elif cmd == "run":
        conf = sys.argv[2]
        async with websockets.connect(f"ws://{HA}{entry}/run", max_size=None,
                                      additional_headers={"Cookie": cookie},
                                      ping_interval=20, ping_timeout=120) as ws:
            await ws.send(json.dumps({"type": "spawn", "configuration": conf, "port": "OTA"}))
            async for msg in ws:
                m = json.loads(msg)
                if m.get("event") == "line":
                    print(m["data"], end="", flush=True)
                elif m.get("event") == "exit":
                    print(f"\n=== EXIT code {m.get('code')}")
                    break
                else:
                    print(m)
            print(f"\n=== WS fermé : code={ws.close_code} raison={ws.close_reason!r}")
    elif cmd in ("install", "ws"):
        # Device Builder 2026.11 : websocket unique /ws, {command, message_id, args}
        async with websockets.connect(f"ws://{HA}{entry}/ws", max_size=None,
                                      additional_headers={"Cookie": cookie},
                                      ping_interval=20, ping_timeout=120) as ws:
            hello = json.loads(await ws.recv())
            print("server:", {k: hello.get(k) for k in ("server_version", "requires_auth")}, flush=True)
            if cmd == "ws":  # commande brute : ws <command> '<args json>'
                args = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
                await ws.send(json.dumps({"command": sys.argv[2], "message_id": "1", "args": args}))
                print(json.dumps(json.loads(await ws.recv()), ensure_ascii=False)[:4000])
                return
            await ws.send(json.dumps({"command": "firmware/install", "message_id": "1",
                                      "args": {"configuration": sys.argv[2], "port": "OTA",
                                               "force_local": False, "bootloader": False}}))
            r = json.loads(await ws.recv())
            print("install:", json.dumps(r, ensure_ascii=False)[:1000], flush=True)
            job = (r.get("result") or {}).get("job_id") or r.get("job_id")
            if not job:
                return
            await ws.send(json.dumps({"command": "firmware/follow_job", "message_id": "2",
                                      "args": {"job_id": job}}))
            async for msg in ws:
                m = json.loads(msg)
                ev = m.get("event") if isinstance(m.get("event"), dict) else m
                line = ev.get("line") or ev.get("data")
                if isinstance(line, str):
                    print(line, end="" if line.endswith("\n") else "\n", flush=True)
                else:
                    print("MSG:", json.dumps(m, ensure_ascii=False)[:600], flush=True)
                state = str(ev.get("status") or ev.get("state") or "")
                if state in ("completed", "succeeded", "success", "failed", "error", "cancelled", "canceled"):
                    break


if __name__ == "__main__":
    asyncio.run(main())
