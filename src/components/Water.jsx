import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../data/config'
import { makeWaterNormalTexture } from '../three/textures'
import { roundedRectShape, cornerRadiusFor, waterLevelFor } from '../three/footprint'

/**
 * Reflektierende, animierte Wasseroberfläche mit echter Wellen-Normalmap.
 * Form & Wasserspiegel richten sich nach der gewählten Beckenform.
 *
 * Props: { length, width, shape, led }
 */
function Water({ length, width, shape, led }) {
  const meshRef = useRef()
  const t = WALL_THICKNESS
  const r = cornerRadiusFor(shape)
  const baseY = waterLevelFor(shape)
  const isInfinity = shape === 'Infinity'

  const geometry = useMemo(() => {
    const shp = roundedRectShape(length - t, width - t, Math.max(0, r - t))
    const g = new THREE.ShapeGeometry(shp)
    g.rotateX(-Math.PI / 2)
    return g
  }, [length, width, t, r])

  const normalMap = useMemo(() => {
    const tex = makeWaterNormalTexture(512, 14)
    tex.repeat.set(4, 4)
    return tex
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      normalMap.dispose()
    }
  }, [geometry, normalMap])

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    if (meshRef.current) meshRef.current.position.y = baseY + Math.sin(time * 0.7) * 0.005
    if (normalMap) normalMap.offset.set((time * 0.015) % 1, (time * 0.01) % 1)
  })

  // Infinity-Wasser bis zur offenen vorderen Kante schieben
  const zOffset = isInfinity ? t / 2 : 0

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, baseY, zOffset]} renderOrder={2}>
      <MeshReflectorMaterial
        resolution={1024}
        mixBlur={1.2}
        mixStrength={1.1}
        mixContrast={1.0}
        roughness={0.14}
        depthScale={0.4}
        minDepthThreshold={0.2}
        maxDepthThreshold={1.0}
        color={led ? '#2fb6d8' : '#2a86b4'}
        metalness={0.2}
        mirror={0.5}
        normalMap={normalMap}
        normalScale={[0.16, 0.16]}
        transparent
        opacity={0.62}
        envMapIntensity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default React.memo(Water)
