/** Layer für Schwimmkörper: in der Wasser-FBO unsichtbar, sonst sichtbar. */
export const FLOAT_LAYER = 1

const floatGroups = new Set()

export function registerFloatGroup(group) {
  if (group) floatGroups.add(group)
  return () => floatGroups.delete(group)
}

export function setFloatsVisible(visible) {
  for (const group of floatGroups) group.visible = visible
}
