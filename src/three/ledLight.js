import * as THREE from 'three'
import { WALL_THICKNESS, findLedColor } from '../data/config'

const emit = new THREE.Color()
const glow = new THREE.Color()
const water = new THREE.Color()
const caustic = new THREE.Color()

export function sampleLedColors(id, time = 0) {
  if (id === 'wechsel') {
    const hue = (time * 0.065) % 1
    emit.setHSL(hue, 0.88, 0.56)
    glow.setHSL(hue, 0.72, 0.66)
    water.setHSL(hue, 0.55, 0.42)
    caustic.setHSL(hue, 0.58, 0.76)
    return { emit, glow, water, caustic }
  }
  const c = findLedColor(id)
  emit.set(c.emit)
  glow.set(c.light || c.emit)
  water.set(c.water)
  caustic.set(c.caustic)
  return { emit, glow, water, caustic }
}

export function lampCountFor(poolLength) {
  return poolLength > 7 ? 2 : 1
}

export function lampXs(poolLength, count = lampCountFor(poolLength)) {
  const inset = poolLength / 2 - WALL_THICKNESS - 0.55
  if (count === 2) return [-inset * 0.62, inset * 0.62]
  return [0]
}

/** xz of each wall lamp (beam shoots +Z into the pool). */
export function lampXZ(poolLength, poolWidth) {
  const z = -poolWidth / 2 + WALL_THICKNESS + 0.06
  return lampXs(poolLength).map((x) => [x, z])
}

export function lampY(poolDepth) {
  return -Math.min(0.4, poolDepth * 0.3)
}

export function ledEnvBoost(envMode) {
  if (envMode === 'dusk') {
    return { spot: 28, fill: 5.8, volume: 0.28, scatter: 0.42, mist: 0.16, lens: 3.2 }
  }
  if (envMode === 'indoor') {
    return { spot: 22, fill: 4.6, volume: 0.22, scatter: 0.34, mist: 0.13, lens: 2.6 }
  }
  return { spot: 14, fill: 3.2, volume: 0.14, scatter: 0.22, mist: 0.09, lens: 2.1 }
}
