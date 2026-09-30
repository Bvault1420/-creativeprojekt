# -*- coding: utf-8 -*-
"""Schreibt Handystuhl/Handystuhl.step mit Sitzfläche und Rückenlehne."""

import os
import cadquery as cq

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "Handystuhl", "Handystuhl.step")


def bauen():
    sitz = cq.Workplane("XY").box(90, 40, 5, centered=(False, False, False))
    lehne = (
        cq.Workplane("XY")
        .box(65, 40, 5, centered=(False, False, False))
        .translate((110, 0, 0))
    )
    assy = cq.Assembly(name="Handystuhl")
    assy.add(sitz, name="Sitzflaeche")
    assy.add(lehne, name="Rueckenlehne")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    assy.save(OUT, exportType="STEP")
    return OUT


if __name__ == "__main__":
    print(bauen())
