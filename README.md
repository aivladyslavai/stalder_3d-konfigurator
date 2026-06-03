# STALDER Pool Konfigurator

Ein produktionsreifer, mehrstufiger 3D-Schwimmbad-Konfigurator im Stil eines
geführten Verkaufs-Assistenten – gebaut mit React, React Three Fiber und @react-three/drei.

## Aufbau

Brandartiges Layout mit Kopfzeile, vertikalem **Schritt-Navigator** (links),
**Schritt-Panel** (Mitte) und **Live-3D-Vorschau** (rechts). Auf Mobilgeräten
wird die 3D-Ansicht gestapelt.

### Die 7 Schritte
1. **Pooltyp** – Edelstahlbecken oder PP Becken
2. **Form wählen** – Rechteck, Infinity, Skimmer, Individuell
3. **Grösse definieren** – Länge / Breite / Tiefe per Schieberegler, Einheit m/cm, Standardgrössen
4. **Treppe auswählen** – Ecktreppe, Breitstufentreppe, Schwebetreppe (live im 3D dargestellt)
5. **Ausstattung** – LED, Gegenstromanlage, Wärmepumpe, Salzwasseranlage, Poolabdeckung, Massagejets
6. **Material und Farbe** – PP-Farben bzw. Edelstahl-Ausführungen
7. **Ihre Konfiguration** – Zusammenfassung, Richtpreis-Bereich, „Angebot anfordern“ → Lead-Formular

Der Richtpreis wird live als Bereich (`CHF XX'XXX – XX'XXX`) berechnet und in
Schweizer Formatierung dargestellt.

## Tech Stack
- React 18 + Vite
- @react-three/fiber & @react-three/drei (OrbitControls, Environment, Sky, ContactShadows, MeshReflectorMaterial)
- zustand (State Management)
- tailwindcss (gesamte UI ausserhalb des Canvas)

## Installation
```bash
npm install
```

## Entwicklung
```bash
npm run dev
```
Erreichbar unter der von Vite angezeigten URL (Standard: `http://localhost:5173`).

## Build
```bash
npm run build
npm run preview
```

## Projektstruktur
```
src/
  components/            ← 3D-Szene
    Scene.jsx            ← Canvas + Licht + Umgebung + Schatten
    Pool.jsx             ← Becken inkl. Edelstahl-Randeinfassung (prozedural)
    Water.jsx            ← reflektierende, animierte Wasserfläche
    Deck.jsx             ← umlaufende Steinterrasse
    Accessories/
      Stairs.jsx         ← 3 Treppenvarianten
      LedStrip.jsx, Cover.jsx, Jets.jsx, HeatPump.jsx, CounterCurrent.jsx
  ui/                    ← Konfigurator-Oberfläche (Tailwind)
    Header.jsx           ← Kopfzeile (Logo, Telefon)
    Stepper.jsx          ← Schritt-Navigator
    WizardPanel.jsx      ← rendert den aktiven Schritt + Navigation
    steps/               ← die 7 Schritt-Inhalte + Lead-Formular
    components/Cards.jsx ← wiederverwendbare Auswahl-Karten
  hooks/
    usePoolConfig.js     ← zustand-Store + Preislogik + Materialableitung
  data/
    config.js            ← zentrale Definitionen (Labels, Preise, Optionen)
  App.jsx, main.jsx
```

## Hinweis: .glb-Modelle
Das Becken und die Treppen sind prozedural aus `BoxGeometry`/`CylinderGeometry`
aufgebaut. Sobald `.glb`-Modelle vorliegen, lassen sie sich mittels `useGLTF`
aus `@react-three/drei` einbinden.
