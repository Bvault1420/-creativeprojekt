# Kompletter Prompt: Website „Le coin Internet“

## Aufgabe

Erstelle eine vollständige, responsive One-Page-Website auf Basis des französischen Schulbuch-Artikels **„Le coin Internet“**. Die Seite soll wie ein modernes, digitales Schulbuch-Kapitel wirken – farbenfroh, übersichtlich und für Schüler:innen (ca. 12–14 Jahre) geeignet.

---

## Thema & Zielgruppe

- **Sprache der Website:** Französisch (Hauptinhalt), optional deutsche Navigation/Hilfen
- **Zielgruppe:** Französisch-Lernende in der 7.–8. Klasse (Niveau A1/A2)
- **Zweck:** Schüler:innen zeigen, wie Jugendliche das Internet nutzen; Vokabeln und Redewendungen vermitteln

---

## Design-Vorgaben

### Farbschema (angelehnt ans Schulbuch)
- **Hintergrund:** Warmes Hellgelb (`#FFF8E1` bis `#FFF3C4`)
- **Header-Leiste:** Kräftiges Rot (`#C62828` bis `#D32F2F`)
- **Akzentfarben:** Orange (`#FF8F00`), Türkis (`#00897B`), Violett (`#5E35B1`)
- **Text:** Dunkelgrau (`#2D2D2D`), Überschriften in Rot oder Dunkelblau

### Stil
- Modern, freundlich, leicht verspielt (Schulbuch-Ästhetik)
- **Profil-Karten** im Stil von „zerrissenen“ Papier-Sprechblasen oder Notizzetteln
- Sanfte Schatten, abgerundete Ecken
- Kleine Icons: Wi-Fi, @, Laptop, Chat
- Illustration links: Cartoon-Figur, die am Computer „fischt“ (symbolisch für Surfen/Suchen im Netz)
- Responsive: Mobile-first, funktioniert auf Handy, Tablet und Desktop

### Typografie
- Überschriften: `Fredoka` oder `Nunito` (rund, freundlich)
- Fließtext: `Source Sans 3` oder `Inter` (gut lesbar)

---

## Seitenstruktur

### 1. Header / Hero
- **Titel:** `Le coin Internet`
- **Untertitel:** `Internet : Un peu, beaucoup, toujours… ?`
- Kurzer Intro-Text von **Enzo:**
  > « Nous avons demandé à des élèves de notre école comment ils utilisent le Net. Voici leurs réponses. »

### 2. Profil: Camille
- **Foto-Platzhalter:** Mädchen (13 Jahre) mit Laptop
- **Alter/Klasse:** 13 ans, en 4e
- **Inhalt (Originaltext-Stil):**
  - Sie surft gern im Internet und chattet mit Freund:innen
  - Hat einen eigenen **Blog**, in dem sie über ihr Leben schreibt
  - Liest die Seiten von Freund:innen, schaut Fotos/Videos, hört Musik
  - Ihre Eltern finden, sie verbringt zu viel Zeit am Handy
  - Ab **21 h** (9 PM) darf sie nicht mehr online sein

### 3. Profil: Arthur
- **Foto-Platzhalter:** Junge (12 Jahre) mit Laptop
- **Alter:** 12 ans
- **Inhalt:**
  - Nutzt das Internet für E-Mails an Freunde und zum Recherchieren
  - Bekommt Chat-Einladungen, beteiligt sich aber wenig – er trifft Freunde lieber persönlich
  - Manche Freunde chatten die ganze Nacht und sind morgens müde; er schläft lieber
  - Er geht jetzt Sport machen

### 4. Fazit von Enzo
> « Pour Camille et Arthur, Internet sert surtout à rester en contact avec les copains par e-mail ou par chat. Mais ça prend aussi beaucoup de temps ! »

### 5. Sidebar / Zusatzboxen

#### Vokabelbox – « Vocabulaire »
| Französisch | Deutsch |
|-------------|---------|
| dormir | schlafen |
| sites Internet | Internetseiten |
| sortir | ausgehen |
| copains / copines | Freunde |
| surfer | surfen |
| important | wichtig |

#### « ON DIT » – Nützliche Fragen
- Comment est-ce que tu utilises Internet ?
- Combien de temps est-ce que tu passes sur le Net ?
- Est-ce que tu as un blog ?
- À quelle heure est-ce que tu te couches ?

### 6. Footer
- Hinweis: Französisch-Projekt / Schulbuch-Artikel
- Optional: Link zurück zur Startseite

---

## Technische Anforderungen

- **Format:** Eine HTML-Datei (`index.html`) mit eingebettetem CSS (und optional minimalem JavaScript)
- **Kein Build-Step nötig** – direkt im Browser öffnen
- **Bilder:** Platzhalter mit CSS/Emoji oder Unsplash-Links für Teenager mit Laptop
- **Barrierefreiheit:** Semantisches HTML (`header`, `main`, `section`, `article`, `aside`, `footer`), `alt`-Texte, ausreichender Kontrast
- **Animationen (optional):** Leichtes Einblenden der Karten beim Scrollen

---

## Beispiel-Prompt (Copy & Paste)

```
Baue eine responsive One-Page-Website zum französischen Schulbuch-Artikel „Le coin Internet“.

Inhalt:
- Titel: Le coin Internet
- Untertitel: Internet : Un peu, beaucoup, toujours… ?
- Intro von Enzo über eine Umfrage an Schüler:innen
- Zwei Profil-Karten: Camille (13, 4e, Blog, chattet, ab 21h kein Handy) und Arthur (12, E-Mails, wenig Chat, schläft lieber)
- Fazit: Internet = Kontakt zu Freunden, aber zeitintensiv
- Sidebar: Vokabelbox (dormir, surfer, copains…) und „ON DIT“-Fragen

Design: Gelber Schulbuch-Hintergrund, roter Header, Papier-Sprechblasen für Profile, moderne Typografie (Fredoka + Source Sans 3), Icons für Wi-Fi/Chat. Mobile-first, eine index.html mit inline CSS.

Sprache: Französisch. Zielgruppe: 12–14 Jahre, Französisch-Anfänger.
```

---

## Erfolgskriterien

- [ ] Alle Texte aus dem Artikel sind enthalten
- [ ] Layout erinnert an das Schulbuch (Farben, Sprechblasen)
- [ ] Seite ist auf dem Handy gut lesbar
- [ ] Vokabel- und „ON DIT“-Boxen sind klar erkennbar
- [ ] Keine externen Abhängigkeiten außer Google Fonts (optional)
