import React, { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../data/config'
import {
  makeMosaicTexture,
  makeBrushedNormalTexture,
  makeBrushedRoughnessTexture,
  makePPNoiseTexture,
} from '../three/textures'
import { roundedRectShape, cornerRadiusFor } from '../three/footprint'

function Pool({ length, width, depth, material, shape }) {
  const t = WALL_THICKNESS
  const r = cornerRadiusFor(shape)
  const isInfinity = shape === 'Infinity'
  const isSkimmer = shape === 'Skimmer'
  const isSteel = material.kind === 'steel'
  const isBrushed = isSteel && material.finish !== 'Poliert'
  const halfL = length / 2
  const halfW = width / 2

  const geo = useMemo(() => {
    const outer = roundedRectShape(length, width, r)
    const innerHole = roundedRectShape(length - 2 * t, width - 2 * t, Math.max(0, r - t))
    outer.holes.push(innerHole)
    const walls = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: false, steps: 1 })
    walls.rotateX(-Math.PI / 2)
    walls.translate(0, -depth, 0)

    const floorShape = roundedRectShape(length - 2 * t, width - 2 * t, Math.max(0, r - t))
    const floor = new THREE.ShapeGeometry(floorShape)
    floor.rotateX(-Math.PI / 2)
    floor.translate(0, -depth + 0.02, 0)

    let rim = null
    if (!isInfinity) {
      const rimOuter = roundedRectShape(length + 0.24, width + 0.24, r + 0.12)
      rimOuter.holes.push(roundedRectShape(length, width, r))
      rim = new THREE.ExtrudeGeometry(rimOuter, { depth: 0.06, bevelEnabled: false })
      rim.rotateX(-Math.PI / 2)
      rim.translate(0, -0.04, 0)
    }
    return { walls, floor, rim }
  }, [length, width, depth, r, t, isInfinity])

  const mosaic = useMemo(() => makeMosaicTexture(512, 14, material.color), [material.color])
  const floorMap = useMemo(() => {
    const m = mosaic.clone()
    m.needsUpdate = true
    m.repeat.set(1, 1)
    return m
  }, [mosaic])
  const wallMap = useMemo(() => {
    const m = mosaic.clone()
    m.needsUpdate = true
    m.repeat.set(0.6, 0.6)
    return m
  }, [mosaic])

  const brushedNormal = useMemo(() => {
    if (!isBrushed) return null
    const tex = makeBrushedNormalTexture(512, 1.6)
    tex.repeat.set(4, 1.2)
    return tex
  }, [isBrushed])

  const brushedRough = useMemo(() => {
    if (!isBrushed) return null
    const tex = makeBrushedRoughnessTexture(512)
    tex.repeat.set(4, 1.2)
    return tex
  }, [isBrushed])

  const ppMap = useMemo(() => {
    if (material.kind !== 'pp') return null
    const tex = makePPNoiseTexture(256, material.color)
    tex.repeat.set(3, 3)
    return tex
  }, [material.kind, material.color])

  useEffect(() => {
    return () => {
      geo.walls.dispose()
      geo.floor.dispose()
      geo.rim && geo.rim.dispose()
      mosaic.dispose()
      floorMap.dispose()
      wallMap.dispose()
      brushedNormal?.dispose()
      brushedRough?.dispose()
      ppMap?.dispose()
    }
  }, [geo, mosaic, floorMap, wallMap, brushedNormal, brushedRough, ppMap])

  const inner = isSteel
    ? {
        color: '#ffffff',
        map: wallMap,
        metalness: material.metalness,
        roughness: material.roughness,
        clearcoat: material.clearcoat,
        clearcoatRoughness: material.clearcoatRoughness,
        envMapIntensity: material.envMapIntensity,
        normalMap: brushedNormal || undefined,
        normalScale: brushedNormal ? new THREE.Vector2(0.55, 0.55) : undefined,
        roughnessMap: brushedRough || undefined,
      }
    : {
        color: '#ffffff',
        map: ppMap || wallMap,
        metalness: material.metalness,
        roughness: material.roughness,
        clearcoat: material.clearcoat,
        clearcoatRoughness: material.clearcoatRoughness,
        envMapIntensity: material.envMapIntensity,
      }

  const rimMat = {
    color: isSteel ? material.color : '#c9ced1',
    metalness: isSteel ? material.metalness : 0.9,
    roughness: isSteel ? material.roughness : 0.22,
    clearcoat: isSteel ? material.clearcoat : 0.4,
    clearcoatRoughness: isSteel ? material.clearcoatRoughness : 0.2,
    envMapIntensity: isSteel ? material.envMapIntensity : 1.4,
    normalMap: brushedNormal || undefined,
    normalScale: brushedNormal ? new THREE.Vector2(0.7, 0.7) : undefined,
    roughnessMap: brushedRough || undefined,
  }

  return (
    <group>
      <mesh geometry={geo.walls} receiveShadow castShadow>
        <meshPhysicalMaterial {...inner} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo.floor} receiveShadow>
        <meshPhysicalMaterial
          {...inner}
          map={isSteel ? floorMap : ppMap || floorMap}
          side={THREE.DoubleSide}
        />
      </mesh>

      {geo.rim && (
        <mesh geometry={geo.rim} castShadow receiveShadow>
          <meshPhysicalMaterial {...rimMat} />
        </mesh>
      )}

      {isInfinity && (
        <group>
          <mesh position={[0, -0.01, -halfW - 0.06]} castShadow receiveShadow>
            <boxGeometry args={[length + 0.24, 0.06, 0.14]} />
            <meshPhysicalMaterial {...rimMat} />
          </mesh>
          <mesh position={[-halfL - 0.06, -0.01, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.14, 0.06, width + 0.24]} />
            <meshPhysicalMaterial {...rimMat} />
          </mesh>
          <mesh position={[halfL + 0.06, -0.01, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.14, 0.06, width + 0.24]} />
            <meshPhysicalMaterial {...rimMat} />
          </mesh>
          <mesh position={[0, -0.18, halfW + 0.011]}>
            <planeGeometry args={[length, 0.34]} />
            <meshStandardMaterial color="#4eb8d8" transparent opacity={0.45} roughness={0.08} metalness={0.15} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.42, halfW + 0.45]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[length + 0.2, 0.8]} />
            <meshPhysicalMaterial color="#2a8fb8" roughness={0.12} metalness={0.25} clearcoat={0.5} />
          </mesh>
        </group>
      )}

      {isSkimmer && (
        <mesh position={[halfL * 0.4, 0.002, -halfW - 0.06]} castShadow>
          <boxGeometry args={[0.3, 0.03, 0.22]} />
          <meshPhysicalMaterial color="#dfe3e6" roughness={0.35} metalness={0.55} clearcoat={0.4} />
        </mesh>
      )}
    </group>
  )
}

export default React.memo(Pool)
