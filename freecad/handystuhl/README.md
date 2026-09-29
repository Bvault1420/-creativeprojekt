# Handystuhl — FreeCAD Teile

Zwei flache Platten für den Handystuhl (später 3D-drucken):

| Teil | Name | Länge | Breite | Höhe |
|------|------|-------|--------|------|
| 1 | Sitzfläche | 90 mm | 40 mm | 5 mm |
| 2 | Rückenlehne | 65 mm | 40 mm | 5 mm |

## Variante A — Skript (schnell)

1. FreeCAD öffnen
2. Menü **Macro → Macros…** → Macro auswählen: `handystuhl_teile.py`
3. **Execute**
4. Im Model-Baum erscheinen `Sitzflaeche` und `Rueckenlehne`
5. Zum Drucken: Rechtsklick auf ein Teil → **Export** → Format **STL**

Optional in der Datei `EXPORT_STL = True` setzen — dann entstehen automatisch:
- `sitzflaeche_90x40x5.stl`
- `rueckenlehne_65x40x5.stl`

## Variante B — per Hand in FreeCAD

1. Neues Dokument → Arbeitsbereich **Part**
2. Menü **Part → Primitives → Cube** (oder Box)
3. Im Property-Panel:
   - Sitzfläche: Length = 90, Width = 40, Height = 5 → umbenennen in `Sitzflaeche`
4. Nochmal Cube:
   - Rückenlehne: Length = 65, Width = 40, Height = 5 → umbenennen in `Rueckenlehne`
5. Jede Platte als STL exportieren und drucken

## Hinweis

Das sind erstmal nur die zwei flachen Bretter. Später können wir noch
Löcher, Schlitze oder eine Schräge für die Lehne ergänzen, damit der
Stuhl wirklich steht und das Handy hält.
