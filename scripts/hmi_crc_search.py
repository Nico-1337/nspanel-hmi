"""Cherche l'algorithme du CRC de page d'un HMI Nextion (variantes CRC32 × plages de données)."""
import codecs, struct, sys

codecs.register(lambda n: codecs.lookup("latin-1") if n == "ansi" else None)
sys.path.insert(0, sys.argv[2])
import Nextion2Text as N  # noqa: E402


def make_table(poly, reflected):
    t = []
    for i in range(256):
        if reflected:
            c = i
            for _ in range(8):
                c = (c >> 1) ^ poly if c & 1 else c >> 1
        else:
            c = i << 24
            for _ in range(8):
                c = ((c << 1) ^ poly) & 0xFFFFFFFF if c & 0x80000000 else (c << 1) & 0xFFFFFFFF
        t.append(c)
    return t


def crc(data, poly, reflected, init, xorout):
    t = make_table(poly, reflected)
    c = init
    if reflected:
        for b in data:
            c = (c >> 8) ^ t[(c ^ b) & 0xFF]
    else:
        for b in data:
            c = ((c << 8) & 0xFFFFFFFF) ^ t[((c >> 24) ^ b) & 0xFF]
    return c ^ xorout


def word_swap(data):
    """STM32 : mots de 32 bits little-endian traités comme big-endian."""
    pad = (-len(data)) % 4
    d = data + b"\x00" * pad
    return b"".join(d[i:i + 4][::-1] for i in range(0, len(d), 4))


VARIANTS = {
    "crc32": (0xEDB88320, True, 0xFFFFFFFF, 0xFFFFFFFF),
    "jamcrc": (0xEDB88320, True, 0xFFFFFFFF, 0),
    "mpeg2": (0x04C11DB7, False, 0xFFFFFFFF, 0),
    "bzip2": (0x04C11DB7, False, 0xFFFFFFFF, 0xFFFFFFFF),
    "posix": (0x04C11DB7, False, 0, 0xFFFFFFFF),
    "crc32c": (0x82F63B78, True, 0xFFFFFFFF, 0xFFFFFFFF),
    "refl0": (0xEDB88320, True, 0, 0),
    "norm0": (0x04C11DB7, False, 0, 0),
}

hmi = N.HMI(sys.argv[1])
raw = hmi.raw
for obj in hmi.header.content:
    if not obj.isPage():
        continue
    ph = N.PageHeader(raw, obj.start)
    if ph.name != "boot":
        continue
    s, n, hs = obj.start, obj.size, ph.headerSize
    zeroed = bytearray(raw[s:s + n]); zeroed[0:4] = b"\x00\x00\x00\x00"
    ranges = {
        "s+4..s+n": raw[s + 4:s + n],
        "s+hs..s+n": raw[s + hs:s + n],
        "s..s+n crc0": bytes(zeroed),
        "s+8..s+n": raw[s + 8:s + n],
        "s+4..s+hs": raw[s + 4:s + hs],
    }
    print("cible", hex(ph.crc))
    for rn, data in ranges.items():
        for vn, (p, r, i, x) in VARIANTS.items():
            for sw in (False, True):
                d = word_swap(data) if sw else data
                v = crc(d, p, r, i, x)
                tag = "MATCH" if v == ph.crc else ("MATCH~" if v ^ 0xFFFFFFFF == ph.crc else "")
                if tag:
                    print(tag, rn, vn, "swap" if sw else "")
print("fin")
