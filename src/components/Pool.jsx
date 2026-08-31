import React, { useMemo, useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../data/config'
import { makePoolPanelTexture } from '../three/textures'
import {
  roundedRectShape,
  cornerRadiusFor,
  GRATE_PITCH,
  GRATE_BAR_W,
  GRATE_BAR_H,
  SKIMMER_COPING,
  overflowGrateLayout,
} from '../three/footprint'

/**
 * Becken (Pool) – formabhängig prozedural:
 *  - Wände + Boden folgen dem Grundriss (eckig oder abgerundet = Individuelle Form)
 *  - Skimmer: bündig im Boden, schmale dunkle Einfassung
 *  - Infinity: umlaufende Überlaufrinne
 * Oberkante bei y = 0, Becken nach unten.
 *
 * Props: { length, width, depth, material, shape }
 */
const PANEL_SIZE = 1.6 // Kantenlänge eines Auskleidungspaneels in Metern

const STEEL = {
  color: '#f4f7f8',
  metalness: 1,
  roughness: 0.12,
  envMapIntensity: 2.6,
  clearcoat: 0.65,
  clearcoatRoughness: 0.08,
  emissive: '#3d4a52',
  emissiveIntensity: 0.22,
}

const STEEL_FRAME = {
  color: '#f7fafb',
  metalness: 1,
  roughness: 0.1,
  envMapIntensity: 2.7,
  clearcoat: 0.55,
  clearcoatRoughness: 0.07,
  emissive: '#3d4a52',
  emissiveIntensity: 0.18,
}

function makeGrateBarGeometry(across) {
  const w = GRATE_BAR_W
  const h = GRATE_BAR_H
  const r = Math.min(w, h) * 0.48
  const shape = new THREE.Shape()
  const x0 = -w / 2
  const y0 = -h / 2
  shape.moveTo(x0 + r, y0)
  shape.lineTo(x0 + w - r, y0)
  shape.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r)
  shape.lineTo(x0 + w, y0 + h - r)
  shape.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h)
  shape.lineTo(x0 + r, y0 + h)
  shape.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r)
  shape.lineTo(x0, y0 + r)
  shape.quadraticCurveTo(x0, y0, x0 + r, y0)
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: across,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 6,
  })
  geo.translate(0, 0, -across / 2)
  geo.computeVertexNormals()
  return geo
}

const _barDummy = new THREE.Object3D()

function placeGrateBars(mesh, layout) {
  if (!mesh?.instanceMatrix) return
  const { outerL, innerW, zEdge, xEdge, barY, g } = layout
  let i = 0
  const rows = [
    { span: outerL, axis: 'x', c: zEdge, rot: 0 },
    { span: outerL, axis: 'x', c: -zEdge, rot: 0 },
    { span: innerW, axis: 'z', c: xEdge, rot: Math.PI / 2 },
    { span: innerW, axis: 'z', c: -xEdge, rot: Math.PI / 2 },
  ]
  for (const row of rows) {
    const n = Math.max(4, Math.floor(row.span / GRATE_PITCH))
    const used = n * GRATE_PITCH
    const start = -used / 2 + GRATE_PITCH / 2
    for (let k = 0; k < n; k++) {
      const t = start + k * GRATE_PITCH
      if (row.axis === 'x') _barDummy.position.set(t, barY, row.c)
      else _barDummy.position.set(row.c, barY, t)
      _barDummy.rotation.set(0, row.rot, 0)
      _barDummy.scale.set(1, 1, 1)
      _barDummy.updateMatrix()
      mesh.setMatrixAt(i, _barDummy.matrix)
      i += 1
    }
  }
  mesh.count = i
  mesh.instanceMatrix.needsUpdate = true
}

function grateBarCount(layout) {
  return (
    Math.max(4, Math.floor(layout.outerL / GRATE_PITCH)) * 2 +
    Math.max(4, Math.floor(layout.innerW / GRATE_PITCH)) * 2
  )
}

function GrateTrough({ along, g, floorY }) {
  const wallH = Math.abs(floorY) - 0.01
  const wallY = floorY / 2 - 0.003
  return (
    <group>
      <mesh position={[0, floorY, 0]} receiveShadow>
        <boxGeometry args={[along, 0.022, g]} />
        <meshPhysicalMaterial
          color="#07161c"
          roughness={0.28}
          metalness={0.22}
          envMapIntensity={1.1}
        />
      </mesh>
      <mesh position={[0, wallY, g / 2 - 0.006]} receiveShadow>
        <boxGeometry args={[along, wallH, 0.011]} />
        <meshPhysicalMaterial color="#142028" roughness={0.32} metalness={0.28} envMapIntensity={0.9} />
      </mesh>
      <mesh position={[0, wallY, -(g / 2 - 0.006)]} receiveShadow>
        <boxGeometry args={[along, wallH, 0.011]} />
        <meshPhysicalMaterial color="#10181e" roughness={0.4} metalness={0.18} envMapIntensity={0.7} />
      </mesh>
    </group>
  )
}

function GrateFrame({ along, g, y }) {
  const rail = 0.013
  return (
    <group>
      <mesh position={[0, y + 0.003, g / 2 - rail / 2]} castShadow receiveShadow>
        <boxGeometry args={[along, GRATE_BAR_H + 0.004, rail]} />
        <meshPhysicalMaterial {...STEEL_FRAME} />
      </mesh>
      <mesh position={[0, y + 0.003, -(g / 2 - rail / 2)]} castShadow receiveShadow>
        <boxGeometry args={[along, GRATE_BAR_H + 0.004, rail]} />
        <meshPhysicalMaterial {...STEEL_FRAME} />
      </mesh>
    </group>
  )
}

/** Überlaufrinne: echte Edelstahl-Lamellen + Rahmen, Wasser sieht man dazwischen. */
function OverflowGrate({ length, width }) {
  const meshRef = useRef()
  const layout = useMemo(() => overflowGrateLayout(length, width), [length, width])
  const count = grateBarCount(layout)
  const barGeo = useMemo(
    () => makeGrateBarGeometry(layout.g - 0.028),
    [layout.g],
  )

  useLayoutEffect(() => {
    placeGrateBars(meshRef.current, layout)
  }, [layout, count, barGeo])

  useEffect(
    () => () => barGeo.dispose(),
    [barGeo],
  )

  const sides = [
    { key: 'n', pos: [0, 0, -layout.zEdge], rot: 0, along: layout.outerL },
    { key: 's', pos: [0, 0, layout.zEdge], rot: 0, along: layout.outerL },
    { key: 'w', pos: [-layout.xEdge, 0, 0], rot: Math.PI / 2, along: layout.innerW },
    { key: 'e', pos: [layout.xEdge, 0, 0], rot: Math.PI / 2, along: layout.innerW },
  ]

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[barGeo, null, count]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <meshPhysicalMaterial {...STEEL} />
      </instancedMesh>
      {sides.map((s) => (
        <group key={s.key} position={s.pos} rotation={[0, s.rot, 0]}>
          <GrateTrough along={s.along} g={layout.g} floorY={layout.floorY} />
          <GrateFrame along={s.along} g={layout.g} y={layout.barY} />
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
    walls.translate(0, -depth - 0.002, 0) // knapp unter der Terrasse, kein Z-Fight

    // Boden
    const floorShape = roundedRectShape(length - 2 * t, width - 2 * t, Math.max(0, r - t))
    const floor = new THREE.ShapeGeometry(floorShape)
    floor.rotateX(-Math.PI / 2)
    floor.translate(0, -depth + 0.02, 0)

    // Nur die feine sichtbare Linie am Wasser; die Terrasse deckt den Rest der Wandkrone.
    let rim = null
    if (!isInfinity) {
      const c = SKIMMER_COPING
      const innerL = length - 2 * t
      const innerW = width - 2 * t
      const innerR = Math.max(0, r - t)
      const rimOuter = roundedRectShape(innerL + 2 * c, innerW + 2 * c, innerR + c)
      rimOuter.holes.push(roundedRectShape(innerL, innerW, innerR))
      rim = new THREE.ExtrudeGeometry(rimOuter, { depth: 0.014, bevelEnabled: false })
      rim.rotateX(-Math.PI / 2)
      rim.translate(0, -0.014, 0)
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
  const coping = {
    color: '#2a3138',
    metalness: 0.55,
    roughness: 0.42,
    envMapIntensity: 0.7,
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

      {/* Schmale dunkle Einfassung, bündig mit der Terrasse */}
      {geo.rim && (
        <mesh geometry={geo.rim} receiveShadow>
          <meshStandardMaterial {...coping} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      )}

      {/* Überlauf: umlaufende Rinne mit Edelstahlrost */}
      {isInfinity && <OverflowGrate length={length} width={width} />}

      {/* Skimmer-Schlitz in der nördlichen Einfassung */}
      {isSkimmer && (
        <mesh position={[halfL * 0.28, 0.001, -(halfW - t) - SKIMMER_COPING * 0.45]} receiveShadow>
          <boxGeometry args={[0.34, 0.004, SKIMMER_COPING * 0.72]} />
          <meshStandardMaterial color="#0e1114" metalness={0.4} roughness={0.5} />
        </mesh>
      )}
    </group>
  )
}

export default React.memo(Pool)
