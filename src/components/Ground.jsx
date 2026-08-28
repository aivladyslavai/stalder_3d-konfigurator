import React, { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { makeGrassTexture, makeStoneNormalTexture } from '../three/textures'

const SIZE = 52

/**
 * Rasenfläche rund um die Terrasse. Die Terrassenfläche ist ausgespart, damit
 * der Rasen weder Becken noch Wasserspiegel überdeckt.
 *
 * Props: { holeLength, holeWidth, timeOfDay }
 */
function Ground({ holeLength, holeWidth, timeOfDay = 'day' }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-SIZE / 2, -SIZE / 2)
    shape.lineTo(SIZE / 2, -SIZE / 2)
    shape.lineTo(SIZE / 2, SIZE / 2)
    shape.lineTo(-SIZE / 2, SIZE / 2)
    shape.lineTo(-SIZE / 2, -SIZE / 2)

    const hl = holeLength / 2
    const hw = holeWidth / 2
    const hole = new THREE.Path()
    hole.moveTo(-hl, -hw)
    hole.lineTo(hl, -hw)
    hole.lineTo(hl, hw)
    hole.lineTo(-hl, hw)
    hole.lineTo(-hl, -hw)
    shape.holes.push(hole)

    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    const uv = []
    for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i), pos.getZ(i))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    return geo
  }, [holeLength, holeWidth])

  const map = useMemo(() => {
    const tex = makeGrassTexture(512)
    tex.repeat.set(1 / 1.6, 1 / 1.6)
    return tex
  }, [])

  const normalMap = useMemo(() => {
    const tex = makeStoneNormalTexture(256, 60)
    tex.repeat.set(1 / 1.2, 1 / 1.2)
    return tex
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      map.dispose()
      normalMap.dispose()
    }
  }, [geometry, map, normalMap])

  return (
    <mesh geometry={geometry} position={[0, -0.08, 0]} receiveShadow>
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        normalScale={[0.3, 0.3]}
        color={timeOfDay === 'dusk' ? '#8b9a7f' : '#ffffff'}
        roughness={0.98}
        metalness={0}
        envMapIntensity={0.45}
      />
    </mesh>
  )
}

export default React.memo(Ground)
