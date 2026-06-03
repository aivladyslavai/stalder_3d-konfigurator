// Zentrale Definitionen für den Konfigurator (Labels in Deutsch, Preise in CHF).

// Markenfarben STALDER (von stalderag.ch)
export const BRAND_NAVY = '#002B6F' // Kopfzeile, Logo, Struktur
export const BRAND_NAVY_DARK = '#00224f'
export const BRAND_SKY = '#32B4E6' // Akzent / Call-to-Action (Pillen-Buttons)
export const BRAND_SKY_DARK = '#1f9fd1'

// Wandstärke des Beckens (m) – für Innen-/Wasserabmessungen
export const WALL_THICKNESS = 0.15

// --- Schritt 1: Pooltyp ---
export const POOL_TYPES = [
  {
    id: 'Edelstahl',
    label: 'Edelstahlbecken',
    desc: 'Hochwertige Edelstahlbecken für höchste Ansprüche an Design, Langlebigkeit und Wertbeständigkeit.',
  },
  {
    id: 'PP',
    label: 'PP Becken',
    desc: 'Pflegeleichte Polypropylen-Becken mit glatter Oberfläche und hoher Beständigkeit.',
  },
]

// --- Schritt 2: Form ---
export const SHAPES = [
  { id: 'Rechteck', label: 'Rechteckpool', surcharge: 0 },
  { id: 'Infinity', label: 'Infinity Pool', surcharge: 9000 },
  { id: 'Skimmer', label: 'Skimmer Pool', surcharge: 0 },
  { id: 'Individuell', label: 'Individuelle Form', surcharge: 6000 },
]

// --- Schritt 4: Treppe ---
export const STAIRS = [
  { id: 'Ecktreppe', label: 'Ecktreppe', surcharge: 0 },
  { id: 'Breitstufentreppe', label: 'Breitstufentreppe', surcharge: 1800 },
  { id: 'Schwebetreppe', label: 'Schwebetreppe', surcharge: 3500 },
]

// --- Schritt 5: Ausstattung ---
export const EQUIPMENT = [
  { id: 'led', label: 'LED Beleuchtung', desc: 'Stimmungsvolle LED-Beleuchtung in mehreren Farben.', price: 1200 },
  { id: 'countercurrent', label: 'Gegenstromanlage', desc: 'Für sportliches Schwimmen auf kleinem Raum.', price: 3200 },
  { id: 'heatpump', label: 'Wärmepumpe', desc: 'Effiziente Erwärmung für längere Badesaison.', price: 3800 },
  { id: 'saltwater', label: 'Salzwasseranlage', desc: 'Kristallklares Wasser durch natürliche Elektrolyse.', price: 2400 },
  { id: 'cover', label: 'Poolabdeckung', desc: 'Schützt, spart Energie und hält Ihr Wasser sauber.', price: 4200 },
  { id: 'jets', label: 'Massagejets', desc: 'Entspannung pur durch gezielte Wasser-Massagen.', price: 980 },
]

// --- Schritt 6: Material & Farbe ---
// PP-Farben (matte Oberfläche)
export const PP_COLORS = [
  { id: 'Weiss', label: 'Weiss', color: '#EAF1F5' },
  { id: 'Hellgrau', label: 'Hellgrau', color: '#B9C2C8' },
  { id: 'Anthrazit', label: 'Anthrazit', color: '#2E3338' },
  { id: 'Sand', label: 'Sand', color: '#CDBE9E' },
]
// Edelstahl-Ausführungen
export const STEEL_FINISHES = [
  { id: 'Gebuerstet', label: 'Gebürsteter Edelstahl', color: '#c4c9cc', metalness: 0.75, roughness: 0.35, surcharge: 0 },
  { id: 'Poliert', label: 'Polierter Edelstahl', color: '#e6e9eb', metalness: 1.0, roughness: 0.05, surcharge: 2500 },
]

// --- Schritt-Reihenfolge (Stepper links) ---
export const STEPS = [
  { key: 'type', label: 'Pooltyp' },
  { key: 'shape', label: 'Form wählen' },
  { key: 'size', label: 'Grösse definieren' },
  { key: 'stairs', label: 'Treppe auswählen' },
  { key: 'equipment', label: 'Ausstattung' },
  { key: 'material', label: 'Material und Farbe' },
  { key: 'summary', label: 'Ihre Konfiguration' },
]

// --- Szene / Vorschau ---
export const SCENE_OPTIONS = [
  { id: 'outdoor', label: 'Terrasse' },
  { id: 'indoor', label: 'Innenraum' },
]
export const TIME_OPTIONS = [
  { id: 'day', label: 'Tag' },
  { id: 'dusk', label: 'Abend' },
]

// Bodenbelag der Terrasse / des Raums
export const DECK_MATERIALS = [
  { id: 'stone-light', label: 'Naturstein hell', kind: 'paver', color: '#d8d2c4', roughness: 0.92 },
  { id: 'stone-dark', label: 'Naturstein dunkel', kind: 'paver', color: '#5d5953', roughness: 0.88 },
  { id: 'travertin', label: 'Travertin', kind: 'paver', color: '#e7ddc6', roughness: 0.85 },
  { id: 'wood', label: 'Holzdeck', kind: 'wood', color: '#ffffff', roughness: 0.65 },
  { id: 'concrete', label: 'Sichtbeton', kind: 'concrete', color: '#bdbbb5', roughness: 0.8 },
]
export const findDeckMaterial = (id) => DECK_MATERIALS.find((d) => d.id === id) || DECK_MATERIALS[0]

export const PHONE = '+41 41 930 43 43'

// Hilfsfunktion: liefert das gewählte PP-Farbobjekt
export const findPPColor = (id) => PP_COLORS.find((c) => c.id === id) || PP_COLORS[0]
// Hilfsfunktion: liefert die gewählte Edelstahl-Ausführung
export const findSteelFinish = (id) => STEEL_FINISHES.find((c) => c.id === id) || STEEL_FINISHES[0]
