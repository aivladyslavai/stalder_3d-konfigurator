import React, { useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { prepareGltf } from '../three/prepareGltf'
import { extendGltfLoader } from '../three/gltfSpecGloss'

function usePrepared(url, opts) {
  const { scene } = useGLTF(url, true, true, extendGltfLoader)
  useLayoutEffect(() => {
    scene.traverse((o) => {
      if (!o.isMesh || !o.material) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.forEach((m) => {
        m.envMapIntensity = 0.5
        if (m.roughness != null) m.roughness = Math.max(m.roughness, 0.55)
        if (m.metalness != null) m.metalness = Math.min(m.metalness, 0.2)
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace
        if (m.emissiveIntensity != null) m.emissiveIntensity = Math.min(m.emissiveIntensity, 0.18)
        if (m.isMeshBasicMaterial) m.toneMapped = true
        if (opts.vinyl) {
          m.metalness = 0
          m.roughness = Math.max(m.roughness || 0, 0.9)
          m.envMapIntensity = 0
          if (m.emissive) m.emissive.setRGB(0, 0, 0)
          if (m.emissiveIntensity != null) m.emissiveIntensity = 0
          if (m.specularIntensity != null) m.specularIntensity = 0.12
          m.envMap = null
          return
        }
        if (opts.foliage) {
          m.metalness = 0
          m.side = THREE.DoubleSide
          if (m.map) {
            m.alphaTest = Math.max(m.alphaTest || 0, 0.15)
            m.transparent = false
            m.depthWrite = true
          }
          return
        }
        if (m.transparent || m.alphaMap || m.alphaTest > 0) {
          m.alphaTest = Math.max(m.alphaTest || 0, 0.4)
          m.transparent = false
          m.depthWrite = true
          m.side = THREE.DoubleSide
        }
      })
    })
  }, [scene, opts.foliage, opts.vinyl])
  return useMemo(
    () => prepareGltf(scene, opts),
    [
      scene,
      opts.height,
      opts.xz,
      opts.scale,
      opts.sink,
      opts.yScale,
      opts.merge,
      opts.hideFloors,
      opts.hideDomes,
      opts.clearX,
      opts.clearZ,
      opts.castShadow,
      opts.receiveShadow,
      opts.foliage,
      opts.vinyl,
      opts.layer,
    ],
  )
}

/**
 * Sketchfab-GLB: optional mergen, auf Höhe oder Grundriss skalieren,
 * auf y = 0 stellen und in XZ zentrieren.
 */
export function GltfProp({
  url,
  height,
  xz,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  sink = 0,
  yScale = 1,
  merge = false,
  hideFloors = false,
  hideDomes = false,
  foliage = false,
  vinyl = false,
  layer,
  clearX,
  clearZ,
  castShadow = true,
  receiveShadow = true,
}) {
  const object = usePrepared(url, {
    height,
    xz,
    scale,
    sink,
    yScale,
    merge,
    hideFloors,
    hideDomes,
    foliage,
    vinyl,
    layer,
    clearX,
    clearZ,
    castShadow,
    receiveShadow,
  })
  const wrap = useRef()
  useLayoutEffect(() => {
    if (layer == null) return
    object.traverse((o) => o.layers.set(layer))
    wrap.current?.layers.set(layer)
  }, [object, layer])
  return (
    <group ref={wrap} position={position} rotation={rotation}>
      <primitive object={object} />
    </group>
  )
}

/** Einmal vorbereiten, dann günstig klonen – für Ahorne mit tausenden Meshes. */
export function GltfCopies({ url, items, merge = false, foliage = false, castShadow = true, receiveShadow = true }) {
  const proto = usePrepared(url, { height: 1, merge, foliage, castShadow, receiveShadow })
  return (
    <>
      {items.map((t, i) => (
        <group key={i} position={t.p} rotation={[0, t.y || 0, 0]} scale={t.h}>
          <primitive object={i === 0 ? proto : proto.clone(true)} />
        </group>
      ))}
    </>
  )
}

const preload = (url) => useGLTF.preload(url, true, true, extendGltfLoader)

preload('/models/palm.glb')
preload('/models/coconut-palm.glb')
preload('/models/date-palm.glb')
preload('/models/rhizome.glb')
preload('/models/pothos.glb')
preload('/models/float.glb')
preload('/models/beach-chair-2.glb')
preload('/models/cooler.glb')
preload('/models/cocktail.glb')
preload('/models/flipflops.glb')
preload('/models/tropical.glb')
preload('/models/plants.glb')
