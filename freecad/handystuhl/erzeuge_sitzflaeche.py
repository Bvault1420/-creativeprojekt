# -*- coding: utf-8 -*-
"""Schreibt Sitzflaeche/Sitzflaeche.step — nur die Sitzfläche, vorne mit rechteckigem Rand."""

import os
import cadquery as cq

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "Sitzflaeche", "Sitzflaeche.step")


def bauen():
    # Platte: 90 mm lang, 40 mm breit, 5 mm hoch
    platte = cq.Workplane("XY").box(90, 40, 5, centered=(False, False, False))
    # Vorne (x = 0): rechteckiger Rand, 5 mm lang, 40 mm breit, 5 mm hoch.
    # Liegt auf der Platte, also 5 mm über der Sitzfläche.
    rand = (
        cq.Workplane("XY")
        .box(5, 40, 5, centered=(False, False, False))
        .translate((0, 0, 5))
    )
    teil = platte.val().fuse(rand.val())
    assy = cq.Assembly()
    assy.add(cq.Workplane(obj=teil), name="Sitzflaeche")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    assy.save(OUT, exportType="STEP")
    return OUT


if __name__ == "__main__":
    print(bauen())
