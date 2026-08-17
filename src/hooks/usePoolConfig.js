import { create } from 'zustand'
import {
  CHLOR_SYSTEM,
  findPoolSize,
  findStair,
  findPPColor,
  findSteelFinish,
  findPlaceable,
  getBasePrice,
  getFilterInfo,
  getSaltInfo,
  getHeatPumpInfo,
  getRolladenPrice,
  getLedInfo,
  getStairsForType,
} from '../data/config'
import { clampInPool, snapToDeck } from '../three/placement'

export { WALL_THICKNESS, visualShapeForSystem } from '../data/config'

const DEFAULT_SIZE = findPoolSize('M')

function uid() {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function ensureValidStair(type, stair) {
  const available = getStairsForType(type)
  if (stair === 'Keine') return stair
  return available.some((s) => s.id === stair) ? stair : available[0].id
}

export function calcPrice(state) {
  const { type, poolSystem, sizeId, stair, disinfection, options, placements } = state

  let total = getBasePrice(type, poolSystem, sizeId)
  total += getFilterInfo(sizeId).price
  total += findStair(type, stair).price

  if (disinfection === 'chlor') total += CHLOR_SYSTEM.price
  if (disinfection === 'salt') total += getSaltInfo(sizeId).price
  if (options.led) total += getLedInfo(type).price
  if (options.rolladen) total += getRolladenPrice(sizeId)
  if (placements.some((p) => p.catalogId === 'heatpump')) total += getHeatPumpInfo(sizeId).price

  for (const p of placements) {
    const item = findPlaceable(p.catalogId)
    if (item && item.kind !== 'heatpump') total += item.price
  }

  return Math.round(total * 100) / 100
}

export function formatCHF(value) {
  const formatted = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return `CHF ${formatted}`
}

export function getPoolMaterial(state) {
  if (state.type === 'PP') {
    const c = findPPColor(state.ppColor)
    return { color: c.color, metalness: 0.0, roughness: 0.55 }
  }
  const f = findSteelFinish(state.steelFinish)
  return { color: f.color, metalness: f.metalness, roughness: f.roughness }
}

export function listSelectedLines(state) {
  const lines = []
  const size = findPoolSize(state.sizeId)
  lines.push({
    id: 'base',
    label: `${state.type === 'PP' ? 'PP' : 'Chromstahl'} ${state.poolSystem === 'Ueberlauf' ? 'Überlauf' : 'Skimmer'} ${size.label}`,
    price: getBasePrice(state.type, state.poolSystem, state.sizeId),
  })
  lines.push({ id: 'filter', label: getFilterInfo(state.sizeId).label, price: getFilterInfo(state.sizeId).price })

  const stair = findStair(state.type, state.stair)
  if (stair.price > 0) lines.push({ id: 'stair', label: stair.label, price: stair.price })

  if (state.disinfection === 'chlor') lines.push({ id: 'chlor', label: CHLOR_SYSTEM.label, price: CHLOR_SYSTEM.price })
  if (state.disinfection === 'salt') {
    const salt = getSaltInfo(state.sizeId)
    lines.push({ id: 'salt', label: salt.label, price: salt.price })
  }
  if (state.options.led) {
    const led = getLedInfo(state.type)
    lines.push({ id: 'led', label: led.label, price: led.price })
  }
  if (state.options.rolladen) {
    lines.push({ id: 'rolladen', label: 'Rollladen Polycarbonat', price: getRolladenPrice(state.sizeId) })
  }
  if (state.placements.some((p) => p.catalogId === 'heatpump')) {
    const hp = getHeatPumpInfo(state.sizeId)
    lines.push({ id: 'heatpump', label: `Wärmepumpe ${hp.label}`, price: hp.price })
  }

  const counts = {}
  for (const p of state.placements) {
    if (p.catalogId === 'heatpump') continue
    const item = findPlaceable(p.catalogId)
    if (!item) continue
    counts[item.id] = counts[item.id] || { item, n: 0 }
    counts[item.id].n += 1
  }
  for (const { item, n } of Object.values(counts)) {
    lines.push({
      id: item.id,
      label: n > 1 ? `${n}× ${item.label}` : item.label,
      price: item.price * n,
    })
  }
  return lines
}

export const usePoolConfig = create((set, get) => ({
  showLeadForm: false,
  topView: false,

  type: 'Chromstahl',
  poolSystem: 'Skimmer',
  sizeId: 'M',
  length: DEFAULT_SIZE.length,
  width: DEFAULT_SIZE.width,
  depth: DEFAULT_SIZE.depth,
  stair: 'Ecktreppe',
  stairCorner: 'nw',
  stairWall: 'west',
  disinfection: null,
  options: {
    led: false,
    rolladen: false,
  },
  placements: [],
  placing: null,
  ppColor: 'Weiss',
  steelFinish: 'Gebuerstet',

  scene: 'outdoor',
  timeOfDay: 'day',
  deck: 'wood',

  lead: { firstName: '', lastName: '', phone: '', email: '', zip: '', message: '' },
  price: 0,

  openLeadForm: () => set({ showLeadForm: true }),
  closeLeadForm: () => set({ showLeadForm: false }),
  setTopView: (topView) => set({ topView }),

  setType: (type) => {
    const stair = ensureValidStair(type, get().stair)
    set({ type, stair })
    get().recompute()
  },
  setPoolSystem: (poolSystem) => {
    set({ poolSystem })
    get().recompute()
  },
  setSizeId: (sizeId) => {
    const size = findPoolSize(sizeId)
    const placements = get().placements.map((p) => {
      if (p.place === 'deck') {
        const s = snapToDeck(p.x, p.z, size.length, size.width)
        return { ...p, ...s }
      }
      const c = clampInPool(p.x, p.z, size.length, size.width)
      return { ...p, ...c }
    })
    set({
      sizeId,
      length: size.length,
      width: size.width,
      depth: size.depth,
      placements,
    })
    get().recompute()
  },
  setStair: (stair) => {
    if (stair === 'Keine') {
      set({ stair, placing: null })
      get().recompute()
      return
    }
    const item = getStairsForType(get().type).find((s) => s.id === stair)
    set({
      stair,
      placing: {
        catalogId: 'stair',
        kind: 'stair',
        place: item?.visual === 'Ecktreppe' ? 'corner' : 'wall',
        label: item?.label || 'Treppe',
      },
    })
    get().recompute()
  },
  setStairAnchor: ({ wall, corner }) => {
    set({
      stairWall: wall || get().stairWall,
      stairCorner: corner || get().stairCorner,
      placing: null,
    })
  },
  setDisinfection: (disinfection) => {
    set({ disinfection: get().disinfection === disinfection ? null : disinfection })
    get().recompute()
  },
  toggleOption: (key) => {
    set((s) => ({ options: { ...s.options, [key]: !s.options[key] } }))
    get().recompute()
  },
  startPlacing: (catalogId) => {
    const item = findPlaceable(catalogId)
    if (!item) return
    set({
      placing: {
        catalogId: item.id,
        kind: item.kind,
        place: item.place,
        label: item.label,
        exclusive: item.exclusive,
      },
    })
  },
  cancelPlacing: () => set({ placing: null }),
  confirmPlacement: (snap) => {
    const { placing } = get()
    if (!placing) return
    if (placing.kind === 'stair') {
      set({
        stairWall: snap.wall || 'west',
        stairCorner: snap.corner || nearestFallbackCorner(snap),
        placing: null,
      })
      return
    }
    const item = findPlaceable(placing.catalogId)
    if (!item) return
    set((s) => {
      let next = s.placements
      if (item.exclusive === true) {
        next = next.filter((p) => p.catalogId !== item.id)
      } else if (item.exclusive === 'robot') {
        next = next.filter((p) => p.kind !== 'robot')
      }
      next = [
        ...next,
        {
          id: uid(),
          catalogId: item.id,
          kind: item.kind,
          place: item.place,
          variant: item.variant || null,
          x: snap.x,
          z: snap.z,
          rotY: snap.rotY,
          wall: snap.wall,
          corner: snap.corner,
        },
      ]
      return { placements: next, placing: null }
    })
    get().recompute()
  },
  removePlacement: (id) => {
    set((s) => ({ placements: s.placements.filter((p) => p.id !== id) }))
    get().recompute()
  },
  removePlacementsByCatalog: (catalogId) => {
    set((s) => ({ placements: s.placements.filter((p) => p.catalogId !== catalogId) }))
    get().recompute()
  },
  setPPColor: (ppColor) => set({ ppColor }),
  setSteelFinish: (steelFinish) => set({ steelFinish }),
  setLead: (patch) => set((s) => ({ lead: { ...s.lead, ...patch } })),
  setScene: (scene) => set({ scene }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setDeck: (deck) => set({ deck }),

  recompute: () => set({ price: calcPrice(get()) }),
}))

function nearestFallbackCorner(snap) {
  if (snap.corner) return snap.corner
  if (snap.wall === 'east') return 'ne'
  if (snap.wall === 'south') return 'sw'
  if (snap.wall === 'north') return 'nw'
  return 'nw'
}

usePoolConfig.getState().recompute()
