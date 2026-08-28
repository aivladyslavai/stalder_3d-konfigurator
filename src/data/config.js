// Zentrale Definitionen für den Konfigurator (Labels in Deutsch, Preise in CHF).
// Preisdaten aus Konfigurator_Becken_PP Chromstahl.xlsx (Mycah von Mentlen / STALDER).

export const BRAND_NAVY = '#002B6F'
export const BRAND_NAVY_DARK = '#00224f'
export const BRAND_SKY = '#32B4E6'
export const BRAND_SKY_DARK = '#1f9fd1'

export const WALL_THICKNESS = 0.15

// --- Schritt 1: Material ---
export const POOL_TYPES = [
  {
    id: 'Chromstahl',
    label: 'Chromstahlbecken',
    desc: 'Hochwertige Chromstahlbecken für höchste Ansprüche an Design, Langlebigkeit und Wertbeständigkeit.',
  },
  {
    id: 'PP',
    label: 'PP Becken',
    desc: 'Pflegeleichte Polypropylen-Becken mit glatter Oberfläche und hoher Beständigkeit.',
  },
]

// --- Schritt 2: Poolart (Skimmer / Überlauf) ---
export const POOL_SYSTEMS = [
  {
    id: 'Skimmer',
    label: 'Skimmer',
    desc: 'Klassische Skimmer-Technik mit Düsen, Skimmer und Bodenablauf.',
  },
  {
    id: 'Ueberlauf',
    label: 'Überlauf (Infinity)',
    desc: 'Infinity-Pool mit Schwallbehälter für eine ebene Wasseroberfläche.',
  },
]

// --- Schritt 3: Beckengrössen ---
// Die Katalogmasse bleiben die Preis-Stützstellen; zwischen ihnen wird frei
// über die Wasserfläche interpoliert (Schieberegler).
export const SIZE_RANGE = {
  length: { min: 4, max: 12, step: 0.1, label: 'Länge' },
  width: { min: 2, max: 4.5, step: 0.1, label: 'Breite' },
  depth: { min: 1.2, max: 2.0, step: 0.05, label: 'Tiefe' },
}

export const POOL_SIZES = [
  { id: 'S', label: 'S', length: 4, width: 2, depth: 1.5, dimsLabel: '4000 × 2000 × 1500 mm' },
  { id: 'M', label: 'M', length: 5, width: 2.5, depth: 1.5, dimsLabel: '5000 × 2500 × 1500 mm' },
  { id: 'L', label: 'L', length: 6, width: 3, depth: 1.5, dimsLabel: '6000 × 3000 × 1500 mm' },
  { id: 'XL', label: 'XL', length: 7, width: 3, depth: 1.5, dimsLabel: '7000 × 3000 × 1500 mm' },
  { id: 'XXL', label: 'XXL', length: 8, width: 3.5, depth: 1.5, dimsLabel: '8000 × 3500 × 1500 mm' },
  { id: 'Family', label: 'Family', length: 10, width: 3.5, depth: 1.5, dimsLabel: '10000 × 3500 × 1500 mm' },
]

// Basispreise Becken (VP, inkl. Düsen + Skimmer/Bodenablauf bzw. Schwallbehälter)
const BASE_PRICES = {
  Chromstahl: {
    Skimmer: { S: 43000, M: 55900, L: 67600, XL: 74100, XXL: 88400, Family: 102700 },
    Ueberlauf: { S: 55900, M: 74100, L: 89700, XL: 97500, XXL: 105300, Family: 120900 },
  },
  PP: {
    Skimmer: { S: 17096, M: 18596, L: 19396, XL: 20596, XXL: 22796, Family: 25796 },
    Ueberlauf: { S: 18956, M: 19469, L: 22636, XL: 24196, XXL: 26936, Family: 30656 },
  },
}

// --- Schritt 4: Treppen (materialabhängig) ---
export const STAIRS_BY_TYPE = {
  Chromstahl: [
    { id: 'Ecktreppe', label: 'Ecktreppe', price: 3575, visual: 'Ecktreppe' },
    { id: 'Schwebend4', label: 'Schwebende Treppenstufen 4 Stufen', price: 4160, visual: 'Schwebetreppe', steps: 4 },
    { id: 'Schwebend5', label: 'Schwebende Treppenstufen 5 Stufen', price: 5070, visual: 'Schwebetreppe', steps: 5 },
    { id: 'VolleBreite', label: 'Treppe über gesamte Beckenbreite', price: 5791.5, visual: 'Breitstufentreppe' },
  ],
  PP: [
    { id: 'Ecktreppe', label: 'Ecktreppe', price: 1598, visual: 'Ecktreppe' },
    { id: 'VolleBreite', label: 'Treppe über gesamte Beckenbreite', price: 2798, visual: 'Breitstufentreppe' },
  ],
}

export const NO_STAIR = { id: 'Keine', label: 'Keine Treppe', price: 0, visual: null }

// --- Schritt 5: Ausstattung (Preise teils grössen-/materialabhängig) ---
export const CHLOR_SYSTEM = {
  id: 'chlor',
  label: 'Chlor-Desinfektion',
  desc: 'Automatische Chlor-Desinfektion mit Redox-Steuerung.',
  price: 5898,
}

export const SALT_BY_SIZE = {
  S: { label: 'Salz-Elektrolyse', price: 4400 },
  M: { label: 'Salz-Elektrolyse', price: 5032 },
  L: { label: 'Salz-Elektrolyse', price: 5832 },
  XL: { label: 'Salz-Elektrolyse', price: 5832 },
  XXL: { label: 'Salz-Elektrolyse', price: 7192 },
  Family: { label: 'Salz-Elektrolyse', price: 7192 },
}

export const FILTER_BY_SIZE = {
  S: { label: 'PureS 510 + iWash + InverMaster 20', price: 3152.4 },
  M: { label: 'PureS 510 + iWash + InverMaster 25', price: 3331.2 },
  L: { label: 'PureS 620 + iWash + InverMaster 25', price: 3405.6 },
  XL: { label: 'PureS 620 + iWash + InverMaster 30', price: 3573.6 },
  XXL: { label: 'PureS 620 + iWash + InverMaster 30', price: 3573.6 },
  Family: { label: 'PureS 620 + iWash + InverMaster 30', price: 3573.6 },
}

export const HEATPUMP_BY_SIZE = {
  S: { label: 'MSRC120', price: 5018 },
  M: { label: 'MSRC150', price: 5708 },
  L: { label: 'MSRC180', price: 6264 },
  XL: { label: 'MSRC210', price: 6934 },
  XXL: { label: 'MSRC230', price: 7478 },
  Family: { label: 'MSRC350', price: 10074 },
}

export const ROLLADEN_BY_SIZE = {
  S: 14488,
  M: 15418,
  L: 16648,
  XL: 17260,
  XXL: 18796,
  Family: 20224,
}

export const LED_BY_TYPE = {
  Chromstahl: { label: 'Lampe RGBW', price: 3402 },
  PP: { label: 'Lampe RGBW', price: 1000 },
}

export const OPTIONAL_EQUIPMENT = [
  {
    id: 'countercurrent',
    label: 'Gegenstromanlage',
    desc: 'iGarden InverJet Gegenstromanlage 240 m³.',
    price: 8500,
  },
  {
    id: 'robotX60',
    label: 'Poolroboter',
    desc: 'Automatischer Bodenreiniger.',
    price: 820,
    group: 'robot',
  },
  {
    id: 'robotX80',
    label: 'Poolroboter',
    desc: 'Leistungsstärkerer automatischer Bodenreiniger.',
    price: 938,
    group: 'robot',
  },
]

// Wellness / platzierbare Elemente (Berndorf-Logik, Richtpreise)
export const PLACEABLES = {
  massageduese: {
    id: 'massageduese',
    kind: 'jet',
    label: 'Massagedüse',
    price: 980,
    place: 'wall',
    exclusive: false,
  },
  schwall: {
    id: 'schwall',
    kind: 'schwall',
    label: 'Schwalldusche',
    price: 2450,
    place: 'wall',
    exclusive: false,
  },
  liege: {
    id: 'liege',
    kind: 'liege',
    label: 'Liege 2 m',
    price: 1890,
    place: 'wall',
    exclusive: false,
  },
  bank: {
    id: 'bank',
    kind: 'bank',
    label: 'Rohrsitzbank 2 m',
    price: 1490,
    place: 'wall',
    exclusive: false,
  },
  countercurrent: {
    id: 'countercurrent',
    kind: 'countercurrent',
    label: 'Gegenstromanlage',
    price: 8500,
    place: 'wall',
    exclusive: true,
  },
  robotX60: {
    id: 'robotX60',
    kind: 'robot',
    variant: 'X60',
    label: 'Poolroboter',
    price: 820,
    place: 'floor',
    exclusive: 'robot',
  },
  robotX80: {
    id: 'robotX80',
    kind: 'robot',
    variant: 'X80',
    label: 'Poolroboter',
    price: 938,
    place: 'floor',
    exclusive: 'robot',
  },
  heatpump: {
    id: 'heatpump',
    kind: 'heatpump',
    label: 'Wärmepumpe',
    price: 0,
    place: 'deck',
    exclusive: true,
  },
}

export function findPlaceable(id) {
  return PLACEABLES[id] || null
}

// --- Schritt 6: Material & Farbe ---
export const PP_COLORS = [
  { id: 'Weiss', label: 'Weiss', color: '#EAF1F5' },
  { id: 'Hellgrau', label: 'Hellgrau', color: '#B9C2C8' },
  { id: 'Anthrazit', label: 'Anthrazit', color: '#2E3338' },
  { id: 'Sand', label: 'Sand', color: '#CDBE9E' },
]

export const STEEL_FINISHES = [
  { id: 'Gebuerstet', label: 'Gebürsteter Chromstahl', color: '#e8eef2', metalness: 0.92, roughness: 0.18 },
  { id: 'Poliert', label: 'Polierter Chromstahl', color: '#f4f7f9', metalness: 0.98, roughness: 0.06 },
]

// --- Schritt-Reihenfolge ---
export const STEPS = [
  { key: 'type', label: 'Material' },
  { key: 'system', label: 'Poolart' },
  { key: 'size', label: 'Grösse' },
  { key: 'stairs', label: 'Treppe' },
  { key: 'equipment', label: 'Ausstattung' },
  { key: 'material', label: 'Farbe' },
  { key: 'summary', label: 'Zusammenfassung' },
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

export const DECK_MATERIALS = [
  { id: 'stone-light', label: 'Naturstein hell', kind: 'paver', color: '#d8d2c4', roughness: 0.92 },
  { id: 'stone-dark', label: 'Naturstein dunkel', kind: 'paver', color: '#5d5953', roughness: 0.88 },
  { id: 'travertin', label: 'Travertin', kind: 'paver', color: '#e7ddc6', roughness: 0.85 },
  { id: 'wood', label: 'Holzdeck', kind: 'wood', color: '#ffffff', roughness: 0.65 },
  { id: 'concrete', label: 'Sichtbeton', kind: 'concrete', color: '#bdbbb5', roughness: 0.8 },
]

export const PHONE = '+41 41 930 43 43'

// --- Hilfsfunktionen ---

export const findPoolSize = (id) => POOL_SIZES.find((s) => s.id === id) || POOL_SIZES[1]
export const findDeckMaterial = (id) => DECK_MATERIALS.find((d) => d.id === id) || DECK_MATERIALS[0]
export const findPPColor = (id) => PP_COLORS.find((c) => c.id === id) || PP_COLORS[0]
export const findSteelFinish = (id) => STEEL_FINISHES.find((c) => c.id === id) || STEEL_FINISHES[0]

// Preis-Stützstellen nach Wasserfläche sortiert
const AREA_ANCHORS = POOL_SIZES.map((s) => ({ id: s.id, area: s.length * s.width })).sort(
  (a, b) => a.area - b.area,
)

/** Grössenklasse für Technik (Filter, Salz, Wärmepumpe, Rollladen): nächstgrössere Klasse. */
export function sizeClassFor(length, width) {
  const area = length * width
  const hit = AREA_ANCHORS.find((a) => area <= a.area + 1e-6)
  return (hit || AREA_ANCHORS[AREA_ANCHORS.length - 1]).id
}

export function clampDimension(key, value) {
  const r = SIZE_RANGE[key]
  if (!r) return value
  const snapped = Math.round(value / r.step) * r.step
  return Math.round(Math.min(r.max, Math.max(r.min, snapped)) * 1000) / 1000
}

export function formatDims(length, width, depth) {
  const mm = (v) => Math.round(v * 1000)
  return `${mm(length)} × ${mm(width)} × ${mm(depth)} mm`
}

export function formatDimsShort(length, width, depth) {
  const m = (v) => v.toFixed(1).replace('.', ',')
  return `${m(length)} × ${m(width)} × ${m(depth)} m`
}

/**
 * Beckenpreis für beliebige Masse: lineare Interpolation der Katalogpreise über
 * die Wasserfläche, ausserhalb des Katalogs mit der Steigung des Randsegments
 * fortgeschrieben.
 */
export function getBasePrice(type, system, length, width) {
  const table = BASE_PRICES[type]?.[system]
  if (!table) return 0
  const pts = AREA_ANCHORS.map((a) => ({ area: a.area, price: table[a.id] }))
  const area = length * width

  if (area <= pts[0].area) {
    const slope = (pts[1].price - pts[0].price) / (pts[1].area - pts[0].area)
    return Math.max(pts[0].price * 0.6, pts[0].price - (pts[0].area - area) * slope)
  }
  for (let i = 1; i < pts.length; i++) {
    if (area <= pts[i].area) {
      const t = (area - pts[i - 1].area) / (pts[i].area - pts[i - 1].area)
      return pts[i - 1].price + t * (pts[i].price - pts[i - 1].price)
    }
  }
  const a = pts[pts.length - 2]
  const b = pts[pts.length - 1]
  const slope = (b.price - a.price) / (b.area - a.area)
  return b.price + (area - b.area) * slope
}

export function getStairsForType(type) {
  return STAIRS_BY_TYPE[type] || STAIRS_BY_TYPE.Chromstahl
}

export function findStair(type, stairId) {
  if (stairId === 'Keine') return NO_STAIR
  return getStairsForType(type).find((s) => s.id === stairId) || getStairsForType(type)[0]
}

/** Klickpunkte im Platzierungsdialog: Ecken, alle Wände, oder nur die Stirnseiten. */
export function stairPlacementSpots(visual) {
  if (visual === 'Ecktreppe') {
    return [
      { id: 'nw', kind: 'corner', corner: 'nw', wall: 'west', label: 'Nordwest' },
      { id: 'ne', kind: 'corner', corner: 'ne', wall: 'east', label: 'Nordost' },
      { id: 'se', kind: 'corner', corner: 'se', wall: 'east', label: 'Südost' },
      { id: 'sw', kind: 'corner', corner: 'sw', wall: 'west', label: 'Südwest' },
    ]
  }
  if (visual === 'Breitstufentreppe') {
    return [
      { id: 'west', kind: 'wall', wall: 'west', corner: 'nw', label: 'Westseite' },
      { id: 'east', kind: 'wall', wall: 'east', corner: 'ne', label: 'Ostseite' },
    ]
  }
  return [
    { id: 'west', kind: 'wall', wall: 'west', corner: 'nw', label: 'Westseite' },
    { id: 'north', kind: 'wall', wall: 'north', corner: 'nw', label: 'Nordseite' },
    { id: 'east', kind: 'wall', wall: 'east', corner: 'ne', label: 'Ostseite' },
    { id: 'south', kind: 'wall', wall: 'south', corner: 'se', label: 'Südseite' },
  ]
}

/** Stirnseiten für Gegenstromanlage und volle Beckenbreite. */
export function shortWallPlacementSpots() {
  return [
    { id: 'west', kind: 'wall', wall: 'west', label: 'Westseite' },
    { id: 'east', kind: 'wall', wall: 'east', label: 'Ostseite' },
  ]
}

export function getFilterInfo(sizeId) {
  return FILTER_BY_SIZE[sizeId] || FILTER_BY_SIZE.M
}

export function getSaltInfo(sizeId) {
  return SALT_BY_SIZE[sizeId] || SALT_BY_SIZE.M
}

export function getHeatPumpInfo(sizeId) {
  return HEATPUMP_BY_SIZE[sizeId] || HEATPUMP_BY_SIZE.M
}

export function getRolladenPrice(sizeId) {
  return ROLLADEN_BY_SIZE[sizeId] ?? 0
}

export function getLedInfo(type) {
  return LED_BY_TYPE[type] || LED_BY_TYPE.Chromstahl
}

/** 3D-Darstellung: Skimmer = Rechteck mit Skimmerdeckel, Überlauf = Infinity */
export function visualShapeForSystem(poolSystem) {
  return poolSystem === 'Ueberlauf' ? 'Infinity' : 'Skimmer'
}
