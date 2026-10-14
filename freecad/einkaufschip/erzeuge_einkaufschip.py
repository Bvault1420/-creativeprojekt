# -*- coding: utf-8 -*-
"""Einkaufschip als STEP-Datei für FreeCAD.

1. Kreis Ø 23,25 mm auf der XY-Ebene, Extrusion 2,33 mm
2. Kreis auf der Oberfläche, 2,5 mm von der Außenkante, 0,5 mm tief eingeschnitten
3. Griff aus Rechteck und Kreis, bis zur Oberseite des Chips
4. Schlüsselring-Loch durch alles, Kante mit Radius 1 mm gerundet
5. Schrift „FUNKTION TEST“ auf der Vertiefung, 0,5 mm tief eingeschnitten
"""

import os
import cadquery as cq

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "Einkaufschip", "Einkaufschip.step")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

DURCHMESSER = 23.25
HOEHE = 2.33
RAND = 2.5
TIEFE = 0.5
RECHTECK_HOEHE = 8.0
OESE_RADIUS = 5.0
OESE_ABSTAND = 20.0
LOCH_RADIUS = 3.0
KANTE = 1.0


class Lochkanten(cq.Selector):
    def filter(self, objectList):
        kept = []
        for edge in objectList:
            try:
                radius = edge.radius()
            except Exception:
                continue
            center = edge.Center()
            oben_oder_unten = abs(center.z) < 0.08 or abs(center.z - HOEHE) < 0.08
            if abs(radius - LOCH_RADIUS) < 0.05 and oben_oder_unten:
                kept.append(edge)
        return kept


def bauen():
    radius = DURCHMESSER / 2.0
    muenze = cq.Workplane("XY").circle(radius).extrude(HOEHE)

    # Rechteck ragt in die Münze und in die Öse hinein.
    steg = cq.Workplane("XY").center(14, 0).rect(8, RECHTECK_HOEHE).extrude(HOEHE)
    oese = cq.Workplane("XY").center(OESE_ABSTAND, 0).circle(OESE_RADIUS).extrude(HOEHE)
    koerper = muenze.val().fuse(steg.val()).fuse(oese.val())

    vertiefung = (
        cq.Workplane("XY")
        .circle(radius - RAND)
        .extrude(TIEFE)
        .translate((0, 0, HOEHE - TIEFE))
        .val()
    )
    koerper = koerper.cut(vertiefung)

    loch = (
        cq.Workplane("XY")
        .center(OESE_ABSTAND, 0)
        .circle(LOCH_RADIUS)
        .extrude(HOEHE + 2)
        .translate((0, 0, -1))
        .val()
    )
    koerper = koerper.cut(loch)
    koerper = cq.Workplane(obj=koerper).edges(Lochkanten()).fillet(KANTE).val()

    schrift_z = HOEHE - TIEFE - TIEFE
    for zeile, y in (("FUNKTION", 1.35), ("TEST", -1.5)):
        buchstaben = (
            cq.Workplane("XY")
            .workplane(offset=schrift_z)
            .center(0, y)
            .text(zeile, 2.4, TIEFE, fontPath=FONT, halign="center", valign="center")
            .val()
        )
        koerper = koerper.cut(buchstaben)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    baugruppe = cq.Assembly()
    baugruppe.add(cq.Workplane(obj=koerper), name="Einkaufschip")
    baugruppe.save(OUT, exportType="STEP")
    return OUT


if __name__ == "__main__":
    print(bauen())
