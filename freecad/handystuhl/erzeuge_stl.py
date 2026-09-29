# -*- coding: utf-8 -*-
"""Erzeugt die beiden Handystuhl-Platten als STL (Millimeter)."""

import os
import struct

OUT = os.path.dirname(os.path.abspath(__file__))


def box_triangles(lx, ly, lz):
    """Quader von (0,0,0) bis (lx, ly, lz). 12 Dreiecke, Normale nach außen."""
    v = [
        (0.0, 0.0, 0.0),
        (lx, 0.0, 0.0),
        (lx, ly, 0.0),
        (0.0, ly, 0.0),
        (0.0, 0.0, lz),
        (lx, 0.0, lz),
        (lx, ly, lz),
        (0.0, ly, lz),
    ]
    # (i, j, k) im Uhrzeigersinn von außen gesehen → rechte Hand nach außen
    faces = [
        (0, 2, 1), (0, 3, 2),  # unten  -Z
        (4, 5, 6), (4, 6, 7),  # oben   +Z
        (0, 1, 5), (0, 5, 4),  # vorne  -Y
        (3, 6, 2), (3, 7, 6),  # hinten +Y
        (0, 4, 7), (0, 7, 3),  # links  -X
        (1, 2, 6), (1, 6, 5),  # rechts +X
    ]
    tris = []
    for a, b, c in faces:
        p, q, r = v[a], v[b], v[c]
        nx = (q[1] - p[1]) * (r[2] - p[2]) - (q[2] - p[2]) * (r[1] - p[1])
        ny = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2])
        nz = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
        tris.append((nx, ny, nz, p, q, r))
    return tris


def write_binary_stl(path, name, triangles):
    with open(path, "wb") as f:
        header = name.encode("ascii", "replace")[:80].ljust(80, b"\0")
        f.write(header)
        f.write(struct.pack("<I", len(triangles)))
        for nx, ny, nz, p, q, r in triangles:
            f.write(struct.pack("<12fH", nx, ny, nz, *p, *q, *r, 0))


def main():
    teile = [
        ("sitzflaeche_90x40x5.stl", "Sitzflaeche", 90.0, 40.0, 5.0),
        ("rueckenlehne_65x40x5.stl", "Rueckenlehne", 65.0, 40.0, 5.0),
    ]
    for datei, name, lx, ly, lz in teile:
        pfad = os.path.join(OUT, datei)
        write_binary_stl(pfad, name, box_triangles(lx, ly, lz))
        print(pfad, os.path.getsize(pfad), "bytes")


if __name__ == "__main__":
    main()
