"""hmi_patch.py — réécrit des attributs entiers (x, y, w, h, font, pco…) d'objets d'un HMI Nextion, EN PLACE.

Format (cf. Nextion2Text) : chaque page liste ses composants ; un composant est une suite de
propriétés [longueur u32][données], groupées (« att-29 » puis 29 entrées) ; une entrée d'attribut =
nom sur 16 octets (complété de \\x00) + valeur entière little-endian de largeur fixe. On ne change
QUE la valeur, sur sa largeur d'origine : aucune taille ni aucun décalage ne bouge.

Usage : python3 hmi_patch.py <in.hmi> <out.hmi> <Nextion2Text_dir> <patch.json>
patch.json : [{"page": "home", "component": "time", "attr": "x", "value": 240}, …]
"""
import codecs
import json
import struct
import sys

codecs.register(lambda n: codecs.lookup("latin-1") if n == "ansi" else None)
sys.path.insert(0, sys.argv[3])
import Nextion2Text as N  # noqa: E402


def attribute_offsets(raw: bytes, start: int, end: int) -> dict:
    """{nom: (offset absolu de la valeur, largeur)} pour les attributs d'un composant."""
    props = []
    i = start
    while i < end:
        length = struct.unpack_from("<I", raw, i)[0]
        props.append((i + 4, length))
        i += 4 + length
    out = {}
    k = 0
    while k < len(props):
        off, length = props[k]
        if b"-" not in raw[off:off + length]:  # entrée vide de fin de composant
            k += 1
            continue
        name, count = raw[off:off + length].rsplit(b"-", 1)
        count = int(count)
        if name == b"att":
            for off2, len2 in props[k + 1:k + 1 + count]:
                att = raw[off2:off2 + 16].rstrip(b"\x00").decode("latin-1")
                out[att] = (off2 + 16, len2 - 16)
        k += 1 + count
    return out


def main() -> None:
    src, dst, _, patch_file = sys.argv[1:5]
    patches = json.load(open(patch_file, encoding="utf-8"))
    hmi = N.HMI(src)
    raw = bytearray(hmi.raw)
    index = {}
    for obj in hmi.header.content:
        if not obj.isPage():
            continue
        ph = N.PageHeader(hmi.raw, obj.start)
        for comp in ph.components:
            cs = obj.start + ph.headerSize + comp.startOffset
            offs = attribute_offsets(hmi.raw, cs, cs + comp.size)
            # Nom de l'objet : attribut « objname » (chaîne)
            if "objname" in offs:
                o, w = offs["objname"]
                name = hmi.raw[o:o + w].rstrip(b"\x00").decode("latin-1")
                index[(ph.name, name)] = offs
    for p in patches:
        key = (p["page"], p["component"])
        if key not in index:
            raise SystemExit(f"objet introuvable : {key}")
        if p["attr"] not in index[key]:
            raise SystemExit(f"attribut introuvable : {key} {p['attr']} (dispo : {sorted(index[key])})")
        off, width = index[key][p["attr"]]
        old = int.from_bytes(raw[off:off + width], "little")
        raw[off:off + width] = int(p["value"]).to_bytes(width, "little")
        print(f"{p['page']}.{p['component']}.{p['attr']}: {old} -> {p['value']} ({width} o @ {off})")
    open(dst, "wb").write(raw)


main()
