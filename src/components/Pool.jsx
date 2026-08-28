import React, { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../data/config'
import { makePoolPanelTexture, makeGrateTexture } from '../three/textures'
import {
  roundedRectShape,
  cornerRadiusFor,
  GRATE_WIDTH,
  GRATE_GAP,
} from '../three/footprint'

/**
 * Becken (Pool) – formabhängig prozedural:
 *  - Wände + Boden folgen dem Grundriss (eckig oder abgerundet = Individuelle Form)
 *  - umlaufende Edelstahl-Randeinfassung (bei Infinity vorne offen = Überlaufkante)
 *  - Skimmer-Deckel bei Skimmer-Pool
 * Oberkante bei y = 0, Becken nach unten.
 *
 * Props: { length, width, depth, material, shape }
 */
const PANEL_SIZE = 1.6 // Kantenlänge eines Auskleidungspaneels in Metern

/** Überlaufrinne mit Edelstahlrost rund um das Becken. */
function OverflowGrate({ length, width }) {
  const grate = useMemo(() => makeGrateTexture(256, 16), [])
  useEffect(() => () => grate.dispose(), [grate])

  const g = GRATE_WIDTH
  const gap = GRATE_GAP
  const outerL = length + 2 * (g + gap)
  const innerW = width + 2 * gap
  const zEdge = width / 2 + gap + g / 2
  const xEdge = length / 2 + gap + g / 2

  // 16 Lamellen je Kachel, Kachel = 0.7 m ⇒ rund 4.4 cm Teilung
  const long = useMemo(() => {
    const m = grate.clone()
    m.needsUpdate = true
    m.repeat.set(outerL / 0.7, 1)
    return m
  }, [grate, outerL])
  const short = useMemo(() => {
    const m = grate.clone()
    m.needsUpdate = true
    m.repeat.set(innerW / 0.7, 1)
    return m
  }, [grate, innerW])

  // Rostoberkante bündig mit der Terrasse (y = 0)
  const y = -0.015
  const bars = [
    { key: 'n', pos: [0, y, -zEdge], rot: 0, size: [outerL, 0.03, g], map: long },
    { key: 's', pos: [0, y, zEdge], rot: 0, size: [outerL, 0.03, g], map: long },
    { key: 'w', pos: [-xEdge, y, 0], rot: Math.PI / 2, size: [innerW, 0.03, g], map: short },
    { key: 'e', pos: [xEdge, y, 0], rot: Math.PI / 2, size: [innerW, 0.03, g], map: short },
  ]

  return (
    <group>
      {bars.map((b) => (
        <group key={b.key} position={b.pos} rotation={[0, b.rot, 0]}>
          {/* dunkle Rinne unter dem Rost */}
          <mesh position={[0, -0.12, 0]}>
            <boxGeometry args={[b.size[0], 0.2, g]} />
            <meshStandardMaterial color="#1e242a" roughness={0.95} />
          </mesh>
          <mesh receiveShadow>
            <boxGeometry args={b.size} />
            {/* wenig metalness: sonst kommt die Farbe fast nur aus der
                Reflexion und der Rost wirkt dunkel */}
            <meshStandardMaterial map={b.map} metalness={0.4} roughness={0.42} envMapIntensity={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

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

  // --- Auskleidung: grossformatige Paneele statt Mosaik ---
  const panelKind = material.metalness > 0.4 ? 'steel' : 'liner'
  const panel = useMemo(
    () => makePoolPanelTexture(512, material.color, panelKind),
    [material.color, panelKind],
  )
  const floorMap = useMemo(() => {
    const m = panel.clone()
    m.needsUpdate = true
    m.repeat.set(1 / PANEL_SIZE, 1 / PANEL_SIZE)
    return m
  }, [panel])
  const wallMap = useMemo(() => {
    const m = panel.clone()
    m.needsUpdate = true
    m.repeat.set(1 / PANEL_SIZE, 1 / PANEL_SIZE)
    return m
  }, [panel])

  useEffect(() => {
    return () => {
      geo.walls.dispose()
      geo.floor.dispose()
      geo.rim && geo.rim.dispose()
      panel.dispose()
      floorMap.dispose()
      wallMap.dispose()
    }
  }, [geo, panel, floorMap, wallMap])

  const steelLook = panelKind === 'steel'
  const inner = steelLook
    ? {
        roughness: material.roughness,
        metalness: Math.max(0.9, material.metalness),
        envMapIntensity: 2.25,
        clearcoat: material.roughness < 0.12 ? 0.7 : 0.28,
        clearcoatRoughness: material.roughness < 0.12 ? 0.06 : 0.22,
      }
    : {
        roughness: Math.max(0.25, material.roughness),
        metalness: material.metalness,
        envMapIntensity: 0.75,
      }
  const steel = {
    color: '#eef3f6',
    metalness: 0.96,
    roughness: 0.14,
    envMapIntensity: 2.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.18,
  }

  return (
    <group>
      {/* Wände */}
      <mesh geometry={geo.walls} receiveShadow>
        {steelLook ? (
          <meshPhysicalMaterial {...inner} map={wallMap} color="#ffffff" side={THREE.DoubleSide} />
        ) : (
          <meshStandardMaterial {...inner} map={wallMap} color="#ffffff" side={THREE.DoubleSide} />
        )}
      </mesh>
      {/* Boden */}
      <mesh geometry={geo.floor} receiveShadow>
        {steelLook ? (
          <meshPhysicalMaterial {...inner} map={floorMap} color="#ffffff" side={THREE.DoubleSide} />
        ) : (
          <meshStandardMaterial {...inner} map={floorMap} color="#ffffff" side={THREE.DoubleSide} />
        )}
      </mesh>

      {/* Randeinfassung */}
      {geo.rim && (
        <mesh geometry={geo.rim} castShadow receiveShadow>
          <meshPhysicalMaterial {...steel} />
        </mesh>
      )}

      {/* Überlauf: umlaufende Rinne mit Edelstahlrost */}
      {isInfinity && <OverflowGrate length={length} width={width} />}

      {/* Skimmer-Deckel auf dem hinteren Rand */}
      {isSkimmer && (
        <mesh position={[halfL * 0.4, 0.001, -halfW - 0.06]} castShadow>
          <boxGeometry args={[0.3, 0.03, 0.22]} />
          <meshPhysicalMaterial color="#e8eef2" roughness={0.16} metalness={0.94} envMapIntensity={1.9} />
        </mesh>
      )}
    </group>
  )
}

export default React.memo(Pool)
