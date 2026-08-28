import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

function flattenGeo(geo) {
  if (!geo.index) return geo.clone()
  const out = geo.toNonIndexed()
  return out
}

/**
 * Meshes nach Material zusammenfassen – SketchUp/Carve-Modelle kommen oft
 * mit hunderten Draw Calls bei wenigen Materialien.
 */
export function mergeByMaterial(source) {
  source.updateMatrixWorld(true)
  const groups = new Map()
  source.traverse((o) => {
    if (!o.isMesh || !o.geometry) return
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    mats.forEach((mat) => {
      if (!mat) return
      const key = mat.uuid
      if (!groups.has(key)) groups.set(key, { material: mat, geos: [] })
      const g = flattenGeo(o.geometry)
      g.applyMatrix4(o.matrixWorld)
      groups.get(key).geos.push(g)
    })
  })

  const root = new THREE.Group()
  for (const { material, geos } of groups.values()) {
    if (!geos.length) continue
    let merged = null
    try {
      merged = mergeGeometries(geos, false)
    } catch {
      merged = null
    }
    if (merged) {
      geos.forEach((g) => g.dispose())
      root.add(new THREE.Mesh(merged, material))
    } else {
      geos.forEach((g) => root.add(new THREE.Mesh(g, material)))
    }
  }
  return root
}

function boxFromVisible(root) {
  const box = new THREE.Box3()
  const tmp = new THREE.Box3()
  let found = false
  root.updateMatrixWorld(true)
  root.traverse((o) => {
    if (!o.isMesh || !o.visible || !o.geometry) return
    tmp.setFromObject(o)
    if (!found) {
      box.copy(tmp)
      found = true
    } else {
      box.union(tmp)
    }
  })
  return found ? box : new THREE.Box3().setFromObject(root)
}

export function fitObject(root, { height, xz, scale = 1, sink = 0, yScale = 1 } = {}) {
  const box = boxFromVisible(root)
  const size = box.getSize(new THREE.Vector3())
  let s = scale
  if (xz) s *= xz / Math.max(size.x, size.z, 1e-4)
  else if (height) s *= height / Math.max(size.y, 1e-4)
  root.scale.multiplyScalar(s)
  if (yScale !== 1) root.scale.y *= yScale
  root.updateMatrixWorld(true)
  const fitted = boxFromVisible(root)
  const c = fitted.getCenter(new THREE.Vector3())
  root.position.x -= c.x
  root.position.y -= fitted.min.y + sink
  root.position.z -= c.z
  return root
}

/** HDRI-/Sky-Kugeln und grosse Catcher, die die Bounding-Box sprengen. */
export function hideDomes(root, maxSpan = 22) {
  root.updateMatrixWorld(true)
  const size = new THREE.Vector3()
  root.traverse((o) => {
    if (!o.isMesh) return
    const b = new THREE.Box3().setFromObject(o)
    b.getSize(size)
    if (Math.max(size.x, size.y, size.z) > maxSpan) o.visible = false
  })
}

/** Flache Bodenplatten aus Interior-Modellen ausblenden, damit das Becken sichtbar bleibt. */
export function hideFlatFloors(root, maxY = 0.9) {
  root.updateMatrixWorld(true)
  const size = new THREE.Vector3()
  root.traverse((o) => {
    if (!o.isMesh) return
    const b = new THREE.Box3().setFromObject(o)
    b.getSize(size)
    if (size.y < 0.7 && size.x > 2.5 && size.z > 2.5 && b.max.y < maxY) {
      o.visible = false
    }
  })
}

/** Möbel über dem Becken ausblenden; Wände und Raumhülle bleiben. */
export function hideInRect(root, hx, hz) {
  if (!hx || !hz) return
  const size = new THREE.Vector3()
  root.updateMatrixWorld(true)
  root.traverse((o) => {
    if (!o.isMesh || !o.visible) return
    const b = new THREE.Box3().setFromObject(o)
    if (b.max.x < -hx || b.min.x > hx || b.max.z < -hz || b.min.z > hz) return
    b.getSize(size)
    const enclosure = size.y > 3 && size.x > 8 && size.z > 6
    const wall = size.y > 2.2 && Math.min(size.x, size.z) < 1.5
    if (enclosure || wall) return
    o.visible = false
  })
}

export function prepareGltf(scene, opts = {}) {
  const wrapper = new THREE.Group()
  const clone = scene.clone(true)
  if (opts.merge) wrapper.add(mergeByMaterial(clone))
  else wrapper.add(clone)
  if (opts.hideDomes) hideDomes(wrapper)
  if (opts.hideFloors) hideFlatFloors(wrapper)
  fitObject(wrapper, opts)
  if (opts.clearX && opts.clearZ) hideInRect(wrapper, opts.clearX, opts.clearZ)
  wrapper.traverse((o) => {
    if (!o.isMesh) return
    o.castShadow = opts.castShadow !== false
    o.receiveShadow = opts.receiveShadow !== false
    o.frustumCulled = true
  })
  return wrapper
}
