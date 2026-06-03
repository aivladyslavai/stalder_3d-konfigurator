import { create } from 'zustand'
import {
  SHAPES,
  STAIRS,
  EQUIPMENT,
  STEPS,
  findPPColor,
  findSteelFinish,
} from '../data/config'

export { WALL_THICKNESS } from '../data/config'

/**
 * Berechnet den Richtpreis-Bereich (min/max) anhand der aktuellen Konfiguration.
 * Realistische Schweizer Poolpreise; Ausgabe gerundet auf 1'000 CHF.
 */
export function calcPriceRange(state) {
  const { type, length, width, depth, shape, stair, options, steelFinish } = state
  const area = length * width

  const baseType = type === 'Edelstahl' ? 24000 : 12000
  const perSqm = type === 'Edelstahl' ? 900 : 500
  let p = baseType + area * perSqm + (depth - 1.2) * area * 800

  // Form-Aufpreis
  p += SHAPES.find((s) => s.id === shape)?.surcharge || 0
  // Treppen-Aufpreis
  p += STAIRS.find((s) => s.id === stair)?.surcharge || 0
  // Edelstahl-Ausführung
  if (type === 'Edelstahl') p += findSteelFinish(steelFinish).surcharge || 0
  // Ausstattung
  for (const item of EQUIPMENT) {
    if (options[item.id]) p += item.price
  }

  const round1k = (v) => Math.round(v / 1000) * 1000
  return { min: round1k(p * 0.95), max: round1k(p * 1.15) }
}

// Schweizer Formatierung: "CHF XX'XXX"
export function formatCHF(value) {
  const formatted = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return `CHF ${formatted}`
}

/**
 * Liefert die Material-Eigenschaften für das Becken abhängig von Typ & Auswahl.
 */
export function getPoolMaterial(state) {
  if (state.type === 'Edelstahl') {
    const f = findSteelFinish(state.steelFinish)
    return { color: f.color, metalness: f.metalness, roughness: f.roughness }
  }
  const c = findPPColor(state.ppColor)
  return { color: c.color, metalness: 0.0, roughness: 0.55 }
}

export const usePoolConfig = create((set, get) => ({
  // Navigation
  step: 0, // Index in STEPS
  showLeadForm: false,

  // Konfiguration
  type: 'Edelstahl',
  shape: 'Rechteck',
  length: 8,
  width: 4,
  depth: 1.5,
  unit: 'm', // 'm' | 'cm'
  stair: 'Ecktreppe',
  options: {
    led: false,
    countercurrent: false,
    heatpump: false,
    saltwater: false,
    cover: false,
    jets: false,
  },
  ppColor: 'Weiss',
  steelFinish: 'Gebuerstet',

  // Szene / Vorschau
  scene: 'outdoor', // 'outdoor' | 'indoor'
  timeOfDay: 'day', // 'day' | 'dusk'
  deck: 'stone-light',

  // Lead-Formular
  lead: { firstName: '', lastName: '', phone: '', email: '', zip: '', message: '' },

  // Preis
  priceMin: 0,
  priceMax: 0,

  // --- Aktionen ---
  setStep: (step) => set({ step, showLeadForm: false }),
  next: () => set((s) => ({ step: Math.min(s.step + 1, STEPS.length - 1) })),
  prev: () =>
    set((s) =>
      s.showLeadForm
        ? { showLeadForm: false }
        : { step: Math.max(s.step - 1, 0) },
    ),
  openLeadForm: () => set({ showLeadForm: true }),

  setType: (type) => {
    set({ type })
    get().recompute()
  },
  setShape: (shape) => {
    set({ shape })
    get().recompute()
  },
  setDimensions: (dims) => {
    set((s) => ({
      length: dims.length ?? s.length,
      width: dims.width ?? s.width,
      depth: dims.depth ?? s.depth,
    }))
    get().recompute()
  },
  setUnit: (unit) => set({ unit }),
  setStair: (stair) => {
    set({ stair })
    get().recompute()
  },
  toggleOption: (key) => {
    set((s) => ({ options: { ...s.options, [key]: !s.options[key] } }))
    get().recompute()
  },
  setPPColor: (ppColor) => {
    set({ ppColor })
    get().recompute()
  },
  setSteelFinish: (steelFinish) => {
    set({ steelFinish })
    get().recompute()
  },
  setLead: (patch) => set((s) => ({ lead: { ...s.lead, ...patch } })),
  setScene: (scene) => set({ scene }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setDeck: (deck) => set({ deck }),

  recompute: () => {
    const { min, max } = calcPriceRange(get())
    set({ priceMin: min, priceMax: max })
  },
}))

// Initialen Preis berechnen
usePoolConfig.getState().recompute()
