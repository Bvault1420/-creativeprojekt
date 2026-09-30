# -*- coding: utf-8 -*-
"""
Handystuhl — Freecad-Skript
===========================
Erzeugt zwei flache Platten zum 3D-Drucken:

  1) Sitzfläche   : 90 mm lang × 40 mm breit × 5 mm hoch
  2) Rückenlehne  : 65 mm lang × 40 mm breit × 5 mm hoch

So benutzt du das Skript in FreeCAD:
  1. FreeCAD öffnen
  2. Menü: Macro → Macros… → Create (oder ein neues Dokument öffnen)
  3. Dieses Skript in die FreeCAD-Python-Konsole einfügen und Enter,
     ODER: Macro → Execute macro… und diese Datei auswählen
  4. Danach kannst du jede Platte einzeln als STL exportieren:
       Rechtsklick auf das Teil → Export → STL

Optional: unten EXPORT_STL = True setzen, dann werden automatisch
zwei STL-Dateien neben dieses Skript geschrieben (wenn der Pfad
schreibbar ist).
"""

import FreeCAD as App
import Part
import os

# --- Maße (mm) ---------------------------------------------------------------
SITZ_LAENGE = 90.0
SITZ_BREITE = 40.0
SITZ_HOEHE = 5.0

LEHNE_LAENGE = 65.0
LEHNE_BREITE = 40.0
LEHNE_HOEHE = 5.0

# Abstand zwischen den beiden Teilen in der Ansicht (nur Darstellung)
ABSTAND = 20.0

# Automatisch STL exportieren? (True / False)
EXPORT_STL = False
EXPORT_ORDNER = os.path.dirname(os.path.abspath(__file__)) if "__file__" in dir() else os.getcwd()

# -----------------------------------------------------------------------------


def box(name, laenge, breite, hoehe, x=0.0, y=0.0, z=0.0):
    """Erzeugt einen Quader mit Ursprung in der unteren linken Ecke."""
    solid = Part.makeBox(laenge, breite, hoehe)
    solid.translate(App.Vector(x, y, z))
    obj = App.ActiveDocument.addObject("Part::Feature", name)
    obj.Shape = solid
    obj.Label = name
    return obj


def main():
    doc = App.ActiveDocument
    if doc is None:
        doc = App.newDocument("Handystuhl")

    # Sitzfläche bei X=0
    sitz = box("Sitzflaeche", SITZ_LAENGE, SITZ_BREITE, SITZ_HOEHE, x=0.0)

    # Rückenlehne daneben, damit man beide gut sieht
    lehne = box(
        "Rueckenlehne",
        LEHNE_LAENGE,
        LEHNE_BREITE,
        LEHNE_HOEHE,
        x=SITZ_LAENGE + ABSTAND,
    )

    doc.recompute()

    # Ansicht zentrieren (nur wenn GUI da ist)
    try:
        import FreeCADGui as Gui

        Gui.SendMsgToActiveView("ViewFit")
        Gui.activeDocument().activeView().viewAxonometric()
    except Exception:
        pass

    if EXPORT_STL:
        try:
            import Mesh

            for obj, dateiname in (
                (sitz, "sitzflaeche_90x40x5.stl"),
                (lehne, "rueckenlehne_65x40x5.stl"),
            ):
                mesh = Mesh.Mesh()
                mesh.addFacets(obj.Shape.tessellate(0.1))
                pfad = os.path.join(EXPORT_ORDNER, dateiname)
                mesh.write(pfad)
                print("STL geschrieben:", pfad)
        except Exception as e:
            print("STL-Export fehlgeschlagen:", e)

    print("Fertig:")
    print("  Sitzfläche : {:.0f} × {:.0f} × {:.0f} mm".format(SITZ_LAENGE, SITZ_BREITE, SITZ_HOEHE))
    print("  Rückenlehne: {:.0f} × {:.0f} × {:.0f} mm".format(LEHNE_LAENGE, LEHNE_BREITE, LEHNE_HOEHE))
    return sitz, lehne


main()
