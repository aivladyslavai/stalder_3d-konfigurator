import * as THREE from 'three'
import { WALL_THICKNESS } from '../data/config'

// Eckradius je Beckenform (m)
export function cornerRadiusFor(shape) {
  return shape === 'Individuell' ? 0.7 : 0
}

// Wasserspiegel-Höhe (y) je Beckenform
export function waterLevelFor(shape) {
  switch (shape) {
    case 'Infinity':
      return -0.004 // randvoll, fliesst über die Wehrkante
    case 'Skimmer':
      return -0.02
    default:
      return -0.1
  }
}

// Überlaufrinne: Rostbreite und Fuge zum Beckenrand (m)
export const GRATE_WIDTH = 0.2
export const GRATE_GAP = 0.02
export const GRATE_PITCH = 0.05
export const GRATE_BAR_W = 0.02
export const GRATE_BAR_H = 0.016

export function overflowGrateLayout(length, width) {
  const g = GRATE_WIDTH
  const gap = GRATE_GAP
  return {
    g,
    gap,
    outerL: length + 2 * (g + gap),
    innerW: width + 2 * gap,
    zEdge: width / 2 + gap + g / 2,
    xEdge: length / 2 + gap + g / 2,
    barY: -0.001,
    waterY: -0.024,
    floorY: -0.118,
    poolHalf: [length / 2, width / 2],
  }
}

/** Sichtbare dunkle Linie zwischen Terrasse und Wasser beim Skimmer (m). */
export const SKIMMER_COPING = 0.012

/** Zusatzmass, das Terrasse und Rasen rund ums Becken freilassen müssen. */
export function overflowInsetFor(shape) {
  return shape === 'Infinity' ? 2 * (GRATE_WIDTH + GRATE_GAP) : 0
}

/**
 * Terrassen-Aussparung: Überlauf lässt Platz für den Rost,
 * Skimmer liegt bündig – die Terrasse reicht bis an die schmale Einfassung.
 */
export function deckOpeningFor(length, width, shape) {
  const r = cornerRadiusFor(shape)
  if (shape === 'Infinity') {
    const extra = overflowInsetFor(shape)
    return { length: length + extra, width: width + extra, radius: r + extra / 2 }
  }
  const t = WALL_THICKNESS
  const c = SKIMMER_COPING
  return {
    length: length - 2 * t + 2 * c,
    width: width - 2 * t + 2 * c,
    radius: Math.max(0, r - t + c),
  }
}

/**
 * Rechteck mit (optional) abgerundeten Ecken in der XY-Ebene.
 * x = Längsachse, y = Querachse.
 */
export function roundedRectShape(w, h, r) {
  const shape = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  r = Math.max(0, Math.min(r, w / 2 - 0.001, h / 2 - 0.001))
  if (r <= 0.0001) {
    shape.moveTo(x, y)
    shape.lineTo(x + w, y)
    shape.lineTo(x + w, y + h)
    shape.lineTo(x, y + h)
    shape.lineTo(x, y)
    return shape
  }
  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  return shape
}
