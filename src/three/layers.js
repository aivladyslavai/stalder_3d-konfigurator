/** Layer für Schwimmkörper: in der Wasser-FBO unsichtbar, sonst sichtbar. */
export const FLOAT_LAYER = 1
/** Garten, Haus, Terrasse: im Hauptbild, nicht in der Wasser-Refraktion. */
export const SCENERY_LAYER = 2

const floatGroups = new Set()

export function applyLayer(root, layer) {
  if (!root) return
  root.traverse((o) => o.layers.set(layer))
}

export function registerFloatGroup(group) {
  if (group) floatGroups.add(group)
  return () => floatGroups.delete(group)
}

export function setFloatsVisible(visible) {
  for (const group of floatGroups) group.visible = visible
}
