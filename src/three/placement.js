import { WALL_THICKNESS } from '../data/config'

const WALL_ROT = {
  west: 0,
  east: Math.PI,
  north: Math.PI / 2,
  south: -Math.PI / 2,
}

const CORNER_ROT = {
  nw: 0,
  ne: -Math.PI / 2,
  se: Math.PI,
  sw: Math.PI / 2,
}

export function innerHalf(length, width, extra = 0.08) {
  const inset = WALL_THICKNESS + extra
  return { hx: length / 2 - inset, hz: width / 2 - inset }
}

export function clampInPool(x, z, length, width, extra = 0.25) {
  const { hx, hz } = innerHalf(length, width, extra)
  return {
    x: Math.max(-hx, Math.min(hx, x)),
    z: Math.max(-hz, Math.min(hz, z)),
  }
}

export function nearestWall(x, z, length, width) {
  const { hx, hz } = innerHalf(length, width, 0.06)
  const scores = {
    west: Math.abs(x + hx),
    east: Math.abs(x - hx),
    north: Math.abs(z + hz),
    south: Math.abs(z - hz),
  }
  return Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0]
}

export function nearestCorner(x, z) {
  const ns = z < 0 ? 'n' : 's'
  const ew = x < 0 ? 'w' : 'e'
  return `${ns}${ew}`
}

export function snapToWall(x, z, length, width) {
  const wall = nearestWall(x, z, length, width)
  const { hx, hz } = innerHalf(length, width, 0.06)
  const along = wall === 'west' || wall === 'east' ? z : x
  const maxAlong = wall === 'west' || wall === 'east' ? hz : hx
  const clamped = Math.max(-maxAlong, Math.min(maxAlong, along))
  const pos =
    wall === 'west'
      ? { x: -hx, z: clamped }
      : wall === 'east'
        ? { x: hx, z: clamped }
        : wall === 'north'
          ? { x: clamped, z: -hz }
          : { x: clamped, z: hz }
  return { ...pos, wall, rotY: WALL_ROT[wall], corner: null }
}

export function snapToNamedWall(wall, length, width) {
  const { hx, hz } = innerHalf(length, width, 0.06)
  const rotY = WALL_ROT[wall] ?? 0
  if (wall === 'west') return { x: -hx, z: 0, wall, rotY, corner: null }
  if (wall === 'east') return { x: hx, z: 0, wall, rotY, corner: null }
  if (wall === 'north') return { x: 0, z: -hz, wall, rotY, corner: null }
  return { x: 0, z: hz, wall: 'south', rotY, corner: null }
}

/** Keep an accessory on the same wall, preserving its offset along that wall. */
export function snapAlongWall(wall, along, length, width) {
  const base = snapToNamedWall(wall, length, width)
  const { hx, hz } = innerHalf(length, width, 0.06)
  if (wall === 'west' || wall === 'east') {
    return { ...base, z: Math.max(-hz, Math.min(hz, along)) }
  }
  return { ...base, x: Math.max(-hx, Math.min(hx, along)) }
}

/**
 * Re-fit a placed accessory after the pool size changes.
 * Wall items stay on their wall; floor/deck items keep a relative position.
 */
export function rescalePlacement(p, length, width, prevLength, prevWidth) {
  if (!p) return p
  if (p.place === 'deck' || p.kind === 'heatpump') {
    return { ...p, ...snapToDeck(p.x, p.z, length, width) }
  }
  if (p.place === 'wall' || p.wall) {
    const wall = p.wall || nearestWall(p.x, p.z, prevLength, prevWidth)
    const prev = innerHalf(prevLength, prevWidth, 0.06)
    const next = innerHalf(length, width, 0.06)
    let along = wall === 'west' || wall === 'east' ? p.z : p.x
    if (wall === 'west' || wall === 'east') {
      if (prev.hz > 1e-6) along *= next.hz / prev.hz
    } else if (prev.hx > 1e-6) {
      along *= next.hx / prev.hx
    }
    return { ...p, ...snapAlongWall(wall, along, length, width) }
  }
  if (p.place === 'floor') {
    const prev = innerHalf(prevLength, prevWidth, 0.35)
    const next = innerHalf(length, width, 0.35)
    const x = prev.hx > 1e-6 ? (p.x / prev.hx) * next.hx : p.x
    const z = prev.hz > 1e-6 ? (p.z / prev.hz) * next.hz : p.z
    return { ...p, ...clampInPool(x, z, length, width, 0.35) }
  }
  return { ...p, ...clampInPool(p.x, p.z, length, width) }
}

export function wallDirXZ(wall) {
  if (wall === 'east') return [ -1, 0 ]
  if (wall === 'north') return [ 0, 1 ]
  if (wall === 'south') return [ 0, -1 ]
  return [ 1, 0 ]
}

/** Surface-jet origin (world XZ) just in front of the Gegenstromdüse. */
export function jetFlowFromPlacement(p) {
  if (!p) return null
  const dir = wallDirXZ(p.wall)
  return {
    origin: [p.x + dir[0] * 0.14, p.z + dir[1] * 0.14],
    dir,
  }
}

export function snapToCorner(x, z) {
  const corner = nearestCorner(x, z)
  return { x: 0, z: 0, wall: null, rotY: CORNER_ROT[corner], corner }
}

export function snapToFloor(x, z, length, width) {
  const p = clampInPool(x, z, length, width, 0.35)
  return { ...p, wall: null, rotY: 0, corner: null }
}

export function snapToDeck(x, z, length, width) {
  const gap = 0.85
  const hx = length / 2 + gap
  const hz = width / 2 + gap
  const insideX = Math.abs(x) < length / 2 + 0.2
  const insideZ = Math.abs(z) < width / 2 + 0.2
  if (insideX && insideZ) {
    const wall = nearestWall(x, z, length, width)
    if (wall === 'west') return { x: -hx, z, wall, rotY: 0, corner: null }
    if (wall === 'east') return { x: hx, z, wall, rotY: Math.PI, corner: null }
    if (wall === 'north') return { x, z: -hz, wall, rotY: Math.PI / 2, corner: null }
    return { x, z: hz, wall, rotY: -Math.PI / 2, corner: null }
  }
  return {
    x: Math.max(-hx - 1.2, Math.min(hx + 1.2, x)),
    z: Math.max(-hz - 1.2, Math.min(hz + 1.2, z)),
    wall: null,
    rotY: 0,
    corner: null,
  }
}

export function resolveSnap(place, x, z, length, width, isCornerStair = false) {
  if (isCornerStair) return snapToCorner(x, z)
  if (place === 'floor') return snapToFloor(x, z, length, width)
  if (place === 'deck') return snapToDeck(x, z, length, width)
  return snapToWall(x, z, length, width)
}
