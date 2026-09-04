import { create } from 'zustand'
import {
  CHLOR_SYSTEM,
  clampDimension,
  formatDimsShort,
  sizeClassFor,
  findStair,
  findPPColor,
  findSteelFinish,
  findPlaceable,
  findPoolSize,
  getBasePrice,
  getFilterInfo,
  getSaltInfo,
  getHeatPumpInfo,
  getRolladenPrice,
  getLedInfo,
  getStairsForType,
  fullWidthStairWall,
  countercurrentWall,
  otherShortWall,
} from '../data/config'
import { rescalePlacement, snapToNamedWall } from '../three/placement'

export { WALL_THICKNESS, visualShapeForSystem } from '../data/config'

const DEFAULT_SIZE = { length: 5, width: 2.5, depth: 1.5 }

function uid() {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function ensureValidStair(type, stair) {
  const available = getStairsForType(type)
  if (stair === 'Keine') return stair
  return available.some((s) => s.id === stair) ? stair : available[0].id
}

export function calcPrice(state) {
  const { type, poolSystem, length, width, stair, disinfection, options, placements } = state
  const sizeId = sizeClassFor(length, width)

  let total = getBasePrice(type, poolSystem, length, width)
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
  const sizeId = sizeClassFor(state.length, state.width)
  lines.push({
    id: 'base',
    label: `${state.type === 'PP' ? 'PP' : 'Chromstahl'} ${state.poolSystem === 'Ueberlauf' ? 'Überlauf' : 'Skimmer'} ${formatDimsShort(state.length, state.width, state.depth)}`,
    price: getBasePrice(state.type, state.poolSystem, state.length, state.width),
  })
  lines.push({ id: 'filter', label: getFilterInfo(sizeId).label, price: getFilterInfo(sizeId).price })

  const stair = findStair(state.type, state.stair)
  if (stair.price > 0) lines.push({ id: 'stair', label: stair.label, price: stair.price })

  if (state.disinfection === 'chlor') lines.push({ id: 'chlor', label: CHLOR_SYSTEM.label, price: CHLOR_SYSTEM.price })
  if (state.disinfection === 'salt') {
    const salt = getSaltInfo(sizeId)
    lines.push({ id: 'salt', label: salt.label, price: salt.price })
  }
  if (state.options.led) {
    const led = getLedInfo(state.type)
    lines.push({ id: 'led', label: led.label, price: led.price })
  }
  if (state.options.rolladen) {
    lines.push({ id: 'rolladen', label: 'Rollladen Polycarbonat', price: getRolladenPrice(sizeId) })
  }
  if (state.placements.some((p) => p.catalogId === 'heatpump')) {
    const hp = getHeatPumpInfo(sizeId)
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
  showDimensions: false,

  type: 'Chromstahl',
  poolSystem: 'Skimmer',
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

  lead: {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    zip: '',
    wishMonth: '',
    wishYear: '',
    poolSite: '',
    gardenWork: '',
    gartenbauer: '',
    message: '',
  },
  price: 0,

  openLeadForm: () => set({ showLeadForm: true }),
  closeLeadForm: () => set({ showLeadForm: false }),
  setTopView: (topView) => set({ topView }),
  setShowDimensions: (showDimensions) => set({ showDimensions }),

  setType: (type) => {
    const stair = ensureValidStair(type, get().stair)
    set({ type, stair })
    get().recompute()
  },
  setPoolSystem: (poolSystem) => {
    set({ poolSystem })
    get().recompute()
  },
  setPoolSize: (id) => {
    const size = findPoolSize(id)
    const cur = get()
    if (cur.length === size.length && cur.width === size.width && cur.depth === size.depth) return
    const placements = cur.placements.map((p) =>
      rescalePlacement(p, size.length, size.width, cur.length, cur.width),
    )
    let placing = cur.placing
    if (placing?.preview?.wall) {
      placing = {
        ...placing,
        preview: rescalePlacement(
          { ...placing.preview, place: placing.place },
          size.length,
          size.width,
          cur.length,
          cur.width,
        ),
      }
    }
    set({ length: size.length, width: size.width, depth: size.depth, placements, placing })
    get().recompute()
  },
  setDimension: (key, rawValue) => {
    const value = clampDimension(key, rawValue)
    const cur = get()
    if (cur[key] === value) return
    const dims = { length: cur.length, width: cur.width, depth: cur.depth, [key]: value }
    const placements = cur.placements.map((p) =>
      rescalePlacement(p, dims.length, dims.width, cur.length, cur.width),
    )
    let placing = cur.placing
    if (placing?.preview?.wall) {
      placing = {
        ...placing,
        preview: rescalePlacement(
          { ...placing.preview, place: placing.place },
          dims.length,
          dims.width,
          cur.length,
          cur.width,
        ),
      }
    }
    set({ ...dims, placements, placing })
    get().recompute()
  },
  setStair: (stair) => {
    if (stair === 'Keine') {
      set({ stair, placing: null })
      get().recompute()
      return
    }
    const cur = get()
    const item = getStairsForType(cur.type).find((s) => s.id === stair)
    const restore = { wall: cur.stairWall, corner: cur.stairCorner }
    const patch = {
      stair,
      placing: {
        catalogId: 'stair',
        kind: 'stair',
        place: item?.visual === 'Ecktreppe' ? 'corner' : 'wall',
        label: item?.label || 'Treppe',
        restore,
      },
    }
    if (item?.visual === 'Breitstufentreppe') {
      const jetWall = countercurrentWall(cur.placements)
      const wall = patch.stairWall || cur.stairWall
      if (wall !== 'west' && wall !== 'east') {
        patch.stairWall = jetWall === 'west' ? 'east' : 'west'
      } else if (jetWall && wall === jetWall) {
        patch.stairWall = otherShortWall(jetWall)
      }
    }
    set(patch)
    get().recompute()
  },
  previewStairAnchor: ({ wall, corner }) => {
    const cur = get()
    if (findStair(cur.type, cur.stair).visual === 'Breitstufentreppe' && wall && wall === countercurrentWall(cur.placements)) {
      return
    }
    set({
      stairWall: wall || cur.stairWall,
      stairCorner: corner || cur.stairCorner,
    })
  },
  setStairAnchor: ({ wall, corner }) => {
    const cur = get()
    if (findStair(cur.type, cur.stair).visual === 'Breitstufentreppe' && wall && wall === countercurrentWall(cur.placements)) {
      return
    }
    set({
      stairWall: wall || cur.stairWall,
      stairCorner: corner || cur.stairCorner,
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
    const cur = get()
    const existing = cur.placements.find((p) => p.catalogId === item.id)
    let preview = null
    if (item.kind === 'countercurrent') {
      const blocked = fullWidthStairWall(cur.type, cur.stair, cur.stairWall)
      let wall = existing?.wall || 'west'
      if (wall === blocked) wall = otherShortWall(blocked)
      preview = existing && existing.wall === wall
        ? { wall: existing.wall || wall, x: existing.x, z: existing.z, rotY: existing.rotY }
        : snapToNamedWall(wall, cur.length, cur.width)
    }
    set({
      placing: {
        catalogId: item.id,
        kind: item.kind,
        place: item.place,
        label: item.label,
        variant: item.variant || null,
        exclusive: item.exclusive,
        restorePlacement: existing || null,
        preview,
      },
    })
  },
  previewWallPlacement: (wall) => {
    const { placing, length, width, type, stair, stairWall } = get()
    if (!placing) return
    if (placing.kind === 'countercurrent' && wall === fullWidthStairWall(type, stair, stairWall)) return
    set({ placing: { ...placing, preview: snapToNamedWall(wall, length, width) } })
  },
  confirmWallPlacement: (wall) => {
    const cur = get()
    if (!cur.placing) return
    if (cur.placing.kind === 'countercurrent' && wall === fullWidthStairWall(cur.type, cur.stair, cur.stairWall)) return
    const snap = snapToNamedWall(wall, cur.length, cur.width)
    get().confirmPlacement(snap)
  },
  cancelPlacing: () => {
    const { placing } = get()
    if (placing?.kind === 'stair' && placing.restore) {
      set({
        placing: null,
        stairWall: placing.restore.wall,
        stairCorner: placing.restore.corner,
      })
      return
    }
    set({ placing: null })
  },
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
    if (
      item.kind === 'countercurrent' &&
      snap.wall === fullWidthStairWall(get().type, get().stair, get().stairWall)
    ) {
      return
    }
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
