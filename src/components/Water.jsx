import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../data/config'
import { makeWaterNormalTexture } from '../three/textures'
import { roundedRectShape, cornerRadiusFor, waterLevelFor } from '../three/footprint'

function Water({ length, width, shape, led, night = false, pickable = true }) {
  const meshRef = useRef()
  const foamRef = useRef()
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

  const foamGeo = useMemo(() => {
    const outer = roundedRectShape(length - t * 1.1, width - t * 1.1, Math.max(0, r - t))
    const hole = roundedRectShape(length - t * 2.4, width - t * 2.4, Math.max(0, r - t * 1.4))
    outer.holes.push(hole)
    const g = new THREE.ShapeGeometry(outer)
    g.rotateX(-Math.PI / 2)
    return g
  }, [length, width, t, r])

  const normalMap = useMemo(() => {
    const tex = makeWaterNormalTexture(512, 16)
    tex.repeat.set(5, 5)
    return tex
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      foamGeo.dispose()
      normalMap.dispose()
    }
  }, [geometry, foamGeo, normalMap])

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    if (meshRef.current) meshRef.current.position.y = baseY + Math.sin(time * 0.7) * 0.005
    if (foamRef.current) foamRef.current.position.y = baseY + 0.004 + Math.sin(time * 0.9) * 0.002
    if (normalMap) normalMap.offset.set((time * 0.018) % 1, (time * 0.012) % 1)
  })

  const zOffset = isInfinity ? t / 2 : 0
  const waterColor = led ? (night ? '#3ad0f0' : '#2fb6d8') : night ? '#1a5f82' : '#2a86b4'
  const opacity = night ? (led ? 0.72 : 0.78) : 0.6

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        position={[0, baseY, zOffset]}
        renderOrder={2}
        raycast={pickable ? undefined : () => {}}
      >
        <MeshReflectorMaterial
          resolution={night ? 768 : 1280}
          mixBlur={night ? 1.6 : 0.9}
          mixStrength={night ? 0.85 : 1.35}
          mixContrast={1.05}
          roughness={night ? 0.2 : 0.1}
          depthScale={0.45}
          minDepthThreshold={0.2}
          maxDepthThreshold={1.0}
          color={waterColor}
          metalness={0.18}
          mirror={night ? 0.35 : 0.62}
          normalMap={normalMap}
          normalScale={[0.2, 0.2]}
          transparent
          opacity={opacity}
          envMapIntensity={night ? 0.55 : 1.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* feiner Schaum-/Glanzrand am Beckenrand */}
      <mesh ref={foamRef} geometry={foamGeo} position={[0, baseY + 0.004, zOffset]} renderOrder={3} raycast={() => {}}>
        <meshBasicMaterial
          color={led && night ? '#9be8ff' : '#eaf6fb'}
          transparent
          opacity={night ? 0.22 : 0.28}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default React.memo(Water)
