# -*- coding: utf-8 -*-
"""Schreibt Rueckenlehne/Rueckenlehne.step — nur die Rückenlehne, 65×40×5 mm."""

import os
import cadquery as cq

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "Rueckenlehne", "Rueckenlehne.step")


def bauen():
    lehne = cq.Workplane("XY").box(65, 40, 5, centered=(False, False, False))
    assy = cq.Assembly()
    assy.add(lehne, name="Rueckenlehne")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    assy.save(OUT, exportType="STEP")
    return OUT


if __name__ == "__main__":
    print(bauen())
