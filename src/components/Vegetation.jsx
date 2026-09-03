import React, { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { makeHedgeFoliageTexture } from '../three/textures'
import { GltfCopies } from './GltfProp'
import House from './House'
import { SCENERY_LAYER } from '../three/layers'

/**
 * Grundstück: Palmen, Haus dahinter, niedrige Hecke als sichtbare Grenze.
 */

export const HEDGE_RADIUS = 20

const PNG_PALMS = [
  { p: [-11.2, 0, -7.4], h: 9.2, y: 0.28 },
  { p: [-13.6, 0, -5.6], h: 6.2, y: 1.12 },
  { p: [-10.3, 0, -5.1], h: 4.6, y: -0.4 },
  { p: [-9.4, 0, 3.15], h: 4.1, y: 0.95 },
  { p: [-10.0, 0, 4.55], h: 4.9, y: -0.62 },
  { p: [-14.2, 0, -8.2], h: 8.4, y: 0.7 },
  { p: [11.4, 0, -7.0], h: 8.6, y: -0.72 },
  { p: [13.4, 0, -5.2], h: 5.1, y: 0.55 },
  { p: [10.6, 0, -8.6], h: 6.8, y: 1.35 },
]

const COCONUTS = [
  { p: [-12.2, 0, -3.8], h: 7.8, y: 0.52 },
  { p: [-14.0, 0, -1.6], h: 5.0, y: -0.85 },
  { p: [-10.5, 0, -1.2], h: 4.3, y: 1.05 },
  { p: [-13.2, 0, 2.6], h: 6.6, y: 0.22 },
  { p: [12.4, 0, -3.2], h: 7.4, y: -0.38 },
  { p: [13.8, 0, -0.4], h: 4.7, y: 0.9 },
  { p: [10.8, 0, 0.6], h: 5.4, y: -1.1 },
]

const DATES = [
  { p: [-11.4, 0, 1.2], h: 7.0, y: 0.18 },
  { p: [-13.8, 0, 4.1], h: 4.5, y: 1.4 },
  { p: [-10.1, 0, 3.5], h: 5.6, y: -0.55 },
  { p: [11.6, 0, 1.8], h: 7.4, y: 1.48 },
  { p: [13.5, 0, 3.4], h: 4.4, y: -0.2 },
  { p: [10.5, 0, 4.0], h: 6.0, y: 0.8 },
]

function buildHedge() {
  const pts = []
  const n = 36
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const r = HEDGE_RADIUS + Math.sin(i * 0.7) * 0.12
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))
  }
  const curve = new THREE.CatmullRomCurve3(pts, true)
  const profile = new THREE.Shape()
  const hw = 0.32
  const hh = 1.72
  profile.moveTo(-hw, 0.02)
  profile.lineTo(hw, 0.02)
  profile.lineTo(hw, hh - 0.18)
  profile.quadraticCurveTo(hw, hh, 0, hh)
  profile.quadraticCurveTo(-hw, hh, -hw, hh - 0.18)
  profile.closePath()
  const geo = new THREE.ExtrudeGeometry(profile, {
    steps: n,
    extrudePath: curve,
    bevelEnabled: false,
  })
  geo.computeVertexNormals()
  return geo
}

function Vegetation({ timeOfDay = 'day' }) {
  const hedge = useMemo(buildHedge, [])
  const hedgeMap = useMemo(() => {
    const tex = makeHedgeFoliageTexture(512)
    tex.repeat.set(22, 1.8)
    return tex
  }, [])

  useEffect(
    () => () => {
      hedge.dispose()
      hedgeMap.dispose()
    },
    [hedge, hedgeMap],
  )

  const tint = timeOfDay === 'dusk' ? '#7a8490' : '#8a9a78'

  return (
    <group>
      <House />
      <GltfCopies url="/models/palm.glb" merge items={PNG_PALMS} layer={SCENERY_LAYER} />
      <GltfCopies url="/models/coconut-palm.glb" merge items={COCONUTS} layer={SCENERY_LAYER} />
      <GltfCopies url="/models/date-palm.glb" merge items={DATES} layer={SCENERY_LAYER} />

      <mesh geometry={hedge} receiveShadow>
        <meshStandardMaterial
          map={hedgeMap}
          color={tint}
          roughness={0.95}
          metalness={0}
          envMapIntensity={0.45}
        />
      </mesh>
    </group>
  )
}

export default React.memo(Vegetation)
