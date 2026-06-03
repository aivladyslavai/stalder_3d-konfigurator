import * as THREE from 'three'

// Eckradius je Beckenform (m)
export function cornerRadiusFor(shape) {
  return shape === 'Individuell' ? 0.7 : 0
}

// Wasserspiegel-Höhe (y) je Beckenform
export function waterLevelFor(shape) {
  switch (shape) {
    case 'Infinity':
      return -0.025 // randvoll bis zur Überlaufkante
    case 'Skimmer':
      return -0.17 // tiefer (Skimmer-Prinzip)
    default:
      return -0.1
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
