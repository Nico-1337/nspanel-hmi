"""Statut des jobs du Device Builder (via esphome_ingress.ha_ws_session). Usage : builder_jobs.py [job_id]"""
import asyncio, json, sys
import websockets
sys.path.insert(0, __file__.rsplit("\\", 1)[0].rsplit("/", 1)[0])
from esphome_ingress import ha_ws_session, HA


async def main():
    entry, session = await ha_ws_session()
    async with websockets.connect(f"ws://{HA}{entry}/ws", max_size=None,
                                  additional_headers={"Cookie": f"ingress_session={session}"}) as ws:
        await ws.recv()
        await ws.send(json.dumps({"command": "firmware/get_jobs", "message_id": "1", "args": {}}))
        jobs = json.loads(await ws.recv())["result"]
        for j in jobs[:4]:
            print(j["job_id"], j["configuration"], j["job_type"], j["status"], j["progress"],
                  j["exit_code"], j["failure_reason"], j["created_at"], j["completed_at"])
            if len(sys.argv) > 1 and j["job_id"] == sys.argv[1]:
                print("\n".join(str(x) for x in j.get("output", [])[-40:]))

asyncio.run(main())
