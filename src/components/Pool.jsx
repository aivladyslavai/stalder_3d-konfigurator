import React, { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../data/config'
import { makeMosaicTexture } from '../three/textures'
import { roundedRectShape, cornerRadiusFor, waterLevelFor } from '../three/footprint'

/**
 * Becken (Pool) – formabhängig prozedural:
 *  - Wände + Boden folgen dem Grundriss (eckig oder abgerundet = Individuelle Form)
 *  - umlaufende Edelstahl-Randeinfassung (bei Infinity vorne offen = Überlaufkante)
 *  - Skimmer-Deckel bei Skimmer-Pool
 * Oberkante bei y = 0, Becken nach unten.
 *
 * Props: { length, width, depth, material, shape }
 */
function Pool({ length, width, depth, material, shape }) {
  const t = WALL_THICKNESS
  const r = cornerRadiusFor(shape)
  const isInfinity = shape === 'Infinity'
  const isSkimmer = shape === 'Skimmer'
  const halfL = length / 2
  const halfW = width / 2

  // --- Geometrien ---
  const geo = useMemo(() => {
    // Wände als extrudierter Ring (Aussenkontur mit Innen-Loch)
    const outer = roundedRectShape(length, width, r)
    const innerHole = roundedRectShape(length - 2 * t, width - 2 * t, Math.max(0, r - t))
    outer.holes.push(innerHole)
    const walls = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: false, steps: 1 })
    walls.rotateX(-Math.PI / 2)
    walls.translate(0, -depth, 0) // Oberkante auf y = 0

    // Boden
    const floorShape = roundedRectShape(length - 2 * t, width - 2 * t, Math.max(0, r - t))
    const floor = new THREE.ShapeGeometry(floorShape)
    floor.rotateX(-Math.PI / 2)
    floor.translate(0, -depth + 0.02, 0)

    // Randeinfassung als Ring (nur wenn nicht Infinity)
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

  // --- Mosaik-Texturen ---
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

  useEffect(() => {
    return () => {
      geo.walls.dispose()
      geo.floor.dispose()
      geo.rim && geo.rim.dispose()
      mosaic.dispose()
      floorMap.dispose()
      wallMap.dispose()
    }
  }, [geo, mosaic, floorMap, wallMap])

  const inner = {
    roughness: Math.max(0.25, material.roughness),
    metalness: material.metalness,
    envMapIntensity: 1.0,
  }
  const steel = { color: '#c9ced1', metalness: 0.92, roughness: 0.22, envMapIntensity: 1.4 }
  const waterY = waterLevelFor(shape)

  return (
    <group>
      {/* Wände */}
      <mesh geometry={geo.walls} receiveShadow castShadow>
        <meshStandardMaterial {...inner} map={wallMap} color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      {/* Boden */}
      <mesh geometry={geo.floor} receiveShadow>
        <meshStandardMaterial {...inner} map={floorMap} color="#ffffff" side={THREE.DoubleSide} />
      </mesh>

      {/* Randeinfassung */}
      {geo.rim && (
        <mesh geometry={geo.rim} castShadow receiveShadow>
          <meshStandardMaterial {...steel} />
        </mesh>
      )}

      {/* Infinity-Überlaufkante: Rand nur auf 3 Seiten, vorne offen */}
      {isInfinity && (
        <group>
          {/* hintere Längsseite */}
          <mesh position={[0, -0.01, -halfW - 0.06]} castShadow receiveShadow>
            <boxGeometry args={[length + 0.24, 0.06, 0.14]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          {/* kurze Seiten */}
          <mesh position={[-halfL - 0.06, -0.01, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.14, 0.06, width + 0.24]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[halfL + 0.06, -0.01, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.14, 0.06, width + 0.24]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          {/* Überlauf-Wasserfall (dünner Wasserschleier an der Frontwand) */}
          <mesh position={[0, -0.18, halfW + 0.011]}>
            <planeGeometry args={[length, 0.34]} />
            <meshStandardMaterial color="#2f9bc4" transparent opacity={0.5} roughness={0.15} metalness={0.2} side={THREE.DoubleSide} />
          </mesh>
          {/* Auffangrinne / unteres Becken vor der Kante */}
          <mesh position={[0, -0.4, halfW + 0.45]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[length + 0.2, 0.8]} />
            <meshStandardMaterial color="#2a8fb8" roughness={0.1} metalness={0.3} />
          </mesh>
        </group>
      )}

      {/* Skimmer-Deckel auf dem hinteren Rand */}
      {isSkimmer && (
        <mesh position={[halfL * 0.4, 0.001, -halfW - 0.06]} castShadow>
          <boxGeometry args={[0.3, 0.03, 0.22]} />
          <meshStandardMaterial color="#e2e2e2" roughness={0.7} metalness={0.1} />
        </mesh>
      )}
    </group>
  )
}

export default React.memo(Pool)
