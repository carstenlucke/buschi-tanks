# Buschi Tanks (Hex Strategy Game)

Ein browserbasiertes, rundenbasiertes Hex-Strategiespiel im Stil von Battle Isle / History Line, entwickelt mit "Vibe Coding" und Phaser 3.

![Game Startup](https://github.com/carstenlucke/buschi-tanks/blob/main/.github/screenshot.png?raw=true) 
*(Hinweis: Screenshot Platzhalter)*

## 🎮 Spielkonzept

*   **Genre:** Rundenbasierte Strategie (Turn-Based Strategy)
*   **Setting:** Fiktives WWI-Szenario
*   **Grid:** Hexagonales Spielfeld (Flat-Top)
*   **Gegner:** Singleplayer gegen eine KI (Red Faction)

## ✨ Features

*   **Einheiten:**
    *   **Infantry:** Solide Standard-Einheit.
    *   **MG:** Höhere Verteidigung, Reichweite 2.
    *   **Artillery:** Hohe Reichweite (3), aber schwache Verteidigung.
    *   **Engineer:** Kann Schützengräben (Trenches) bauen.
*   **Terrain:**
    *   **Plain:** Standard (Kosten 1)
    *   **Forest:** Deckung & langsam (Kosten 2)
    *   **Hill:** Langsam (Kosten 2)
    *   **Trench:** Bietet Schutz (Bonus Defense)
*   **KI:** Die Rote Fraktion agiert eigenständig, sucht Deckung und greift strategische Ziele an.
*   **Siegbedingungen:**
    *   Eroberung des gegnerischen HQs.
    *   ODER 10 Siegpunkte durch Eliminierung von Feinden.

## 🚀 Starten (How to Run)

Da dieses Spiel moderne ES6-Module verwendet, **kann es nicht direkt per Doppelklick** auf die `index.html` gestartet werden (CORS-Policy der Browser). Es wird ein lokaler Webserver benötigt.

### Option A: Start-Skript (Empfohlen)
Doppelklicke auf `start_game.sh` oder führe im Terminal aus:
```bash
./start_game.sh
```

### Option B: Python (Manuell)
Öffne ein Terminal im Projektordner und führe aus:
```bash
python3 -m http.server 8000
```
Öffne dann im Browser: [http://localhost:8000](http://localhost:8000)

### Option C: VS Code
Installiere die Extension "Live Server" und klicke unten rechts auf "Go Live".

## 🛠 Tech Stack

*   **Engine:** [Phaser 3](https://phaser.io/) (via CDN)
*   **Sprache:** Modernes JavaScript (ES6 Modules)
*   **Build:** *Kein* Build-Step notwendig (Pure JS/HTML/CSS)

## 📝 Entwicklung

Entstanden aus einer "Vibe Coding" Session. Alle Prompts und Entscheidungen sind dokumentiert in `Prompts/hexgame_vibecoding_prompts.md`.
