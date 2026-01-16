# Browserbasiertes 2D-Hex-Strategiespiel (HTML + JavaScript + Phaser 3)

Dieses Dokument enthält **alle Entscheidungen, Annahmen und Vibecoding-Prompts**
für ein **rundenbasiertes Hex-Strategiespiel**, lauffähig **direkt im Browser**,
ohne Backend oder Infrastruktur.

Ziel: Ein **spielbares MVP**, das später erweitert werden kann.

---

## Technische Entscheidung (festgelegt)

- **2D-Spiel**
- **Browserfähig**
- **HTML + JavaScript**
- **Framework:** Phaser 3 (via CDN)
- **Kein Server / kein Backend**
- **Singleplayer gegen KI**
- **Touch-optimiert (iPhone-Browser)**

---

## Spielkonzept (Kurzfassung)

- Rundenbasiertes Hex-Strategiespiel
- Setting: **Erster Weltkrieg – fiktional inspiriert**
- Karte: **9 × 11 Hexfelder**
- Zwei Fraktionen: **Blue (Spieler)** vs **Red (KI)**
- Sieg:
  - Gegnerisches HQ erobern **oder**
  - 10 Siegpunkte (2 pro eliminierter Einheit)

---

## Einheitentypen (MVP)

| Einheit     | HP | Move | Range | Attack | Defense | Besonderheit |
|------------|----|------|-------|--------|---------|--------------|
| Infantry   | 5  | 2    | 1     | 2      | 1       | – |
| MG         | 4  | 1    | 2     | 2      | 2       | – |
| Artillery  | 3  | 1    | 3     | 3      | 0       | – |
| Engineer   | 4  | 2    | 1     | 1      | 1       | Kann Trench bauen |

---

## Terrain

| Terrain | Kosten |
|-------|--------|
| Plain | 1 |
| Forest | 2 |
| Hill | 2 |
| Trench | 1 |

---

## Prompt-Paket für Vibecoding
**Die folgenden Prompts sind in dieser Reihenfolge auszuführen.**  
Jeder Prompt darf vollständig in dein Vibecoding-Tool kopiert werden.

---

### Prompt 1 — Projektgerüst (läuft sofort)

```text
Erstelle ein minimales Browser-Spiel mit Phaser 3 (CDN), ohne Build-Tool.
Dateien: index.html, style.css, src/main.js

Anforderungen:
- Startet sofort im Browser
- Responsive Canvas, optimiert für iPhone Touch
- Szenen: BootScene, MenuScene, GameScene
- Menu: Button "Start"
- GameScene: zeigt "Hello Hex" und FPS/Debug-Text oben links
```

---

### Prompt 2 — Hex-Grid Mathematik

```text
Implementiere Hexgrid mit axialen Koordinaten (q,r), flat-top.
Hex-Radius ca. 28px.

Erstelle src/hex.js mit:
- hexToPixel(q,r)
- pixelToHex(x,y) mit Rundung
- neighbors(q,r)
- distance(a,b)
- inBounds(q,r,width,height)

Dokumentiere im Code die Hex-Orientierung.
```

---

### Prompt 3 — Board Rendering + Tap

```text
Erstelle src/board.js:
- 9x11 Hexgrid
- Zeichne jedes Hex als Polygon (Graphics)
- Tap/Click erkennt (q,r)
- Markiere selektiertes Hex
- Zeige Koordinaten im UI

Board in GameScene initialisieren.
```

---

### Prompt 4 — Terrain-Generator

```text
Terrain: Plain, Forest, Hill, Trench.
Terrain-Kosten laut Tabelle.

Erzeuge Karte deterministisch per Seed (z.B. Mulberry32).
Zeichne Terrain mit einfachen Farben.
Zeige eine kleine Terrain-Legende im UI.
```

---

### Prompt 5 — Game State

```text
Erstelle src/state.js:
- GameState: turnNumber, activeSide, units[], score, hqPositions, rngSeed
- Unit: id, side, type, q,r, hp, actedThisTurn

HQ:
- Blue HQ: (1,5)
- Red HQ: (7,5)

Initialisiere je 4 Einheiten nahe HQ.
```

---

### Prompt 6 — Bewegung

```text
Erstelle src/rules.js:
- getReachableHexes(state, unit): BFS + Terrainkosten
- canMove(unit, toHex)
- applyMove(state, unitId, toHex)

UI:
- Eigene Einheit antippen → Move-Highlights anzeigen
- Tap auf Highlight → Einheit bewegen
```

---

### Prompt 7 — Angriff

```text
Erweitere rules.js:
- getAttackableTargets(state, unit)
- Schaden = max(0, atk - def) + RNG(0..1)
- applyAttack: hp reduzieren, bei Tod Einheit entfernen, +2 Siegpunkte
- actedThisTurn = true nach Angriff

UI:
- Attack-Highlights für Gegner
```

---

### Prompt 8 — Rundenwechsel

```text
Implementiere Turn-System:
- End Turn Button
- Automatischer Wechsel, wenn alle BLUE units acted haben
- Reset actedThisTurn beim Seitenwechsel

UI zeigt: Turn X – BLUE/RED
```

---

### Prompt 9 — Siegbedingung

```text
Sieg:
- Einheit steht auf gegnerischem HQ
- oder 10 Siegpunkte erreicht

Bei Sieg:
- Ergebnis-Screen anzeigen
- Gewinner + Button "Neustart"
```

---

### Prompt 10 — KI (Red)

```text
Erstelle src/ai.js:
KI für RED:
1) Wenn Angriff möglich: wertvollstes Ziel angreifen
   Wertung: Artillery 4, MG 3, Infantry 2, Engineer 1
2) Sonst: Bewegung Richtung Blue HQ (minimale Distanz)
3) Safety: vermeide Felder in Reichweite von >=2 Gegnern (wenn möglich)

KI deterministisch (Seed aus GameState).
```

---

### Prompt 11 — Mobile UX

```text
UX:
- Info-Panel unten (Einheitentyp, HP, Move, Range)
- Große Buttons (End Turn, Restart)
- Klare Highlights (Selected, Move, Attack)
- Keine Hover-Abhängigkeiten
```

---

### Prompt 12 — Engineer Spezialaktion

```text
Engineer-Spezial:
- Aktion "Build Trench" auf eigenem Feld
- Feld wird Trench (nicht auf Hill)
- Kostet Aktion (actedThisTurn=true)

UI: Button anzeigen, wenn Aktion möglich.
```

---

## Definition of Done (MVP)

- Spielbar im Browser (auch mobil)
- Runden funktionieren korrekt
- KI führt gültige Züge aus
- Siegbedingungen greifen
- Kein Backend notwendig

---

## Nächste optionale Erweiterungen

- Animationen + Sound
- Nebel des Krieges
- Kampagnenkarten
- Karten-Editor (Seed-Eingabe)
- Online-Multiplayer (später)

---

Viel Erfolg beim Vibecoding 🚀
