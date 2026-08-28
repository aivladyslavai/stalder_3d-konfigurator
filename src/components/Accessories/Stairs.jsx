import React, { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { WALL_THICKNESS } from '../../data/config'

/**
 * Ecktreppe: römische Viertelkreis-Stufen, 3 Draw-Calls.
 * Breitstufe / Schwebestufen: gerundete Vorderkante.
 */

const TREAD_H = 0.055
const GAP = 0.014
const LED = '#eaffff'

const TREAD_VIS = {
  color: '#c2d4dc',
  emissive: '#163848',
  emissiveIntensity: 0.2,
  metalness: 0.4,
  roughness: 0.26,
  envMapIntensity: 1.2,
}

function steelMat(material, polished = false) {
  const steel = !material || material.metalness > 0.4
  if (!steel) {
    return {
      color: polished ? '#dce8ee' : material.color,
      metalness: 0.08,
      roughness: polished ? 0.28 : 0.4,
      envMapIntensity: 0.9,
      emissive: '#24586a',
      emissiveIntensity: polished ? 0.38 : 0.16,
    }
  }
  return polished
    ? {
        color: '#c8dbe6',
        metalness: 0.5,
        roughness: 0.2,
        envMapIntensity: 1.4,
        emissive: '#2a5362',
        emissiveIntensity: 0.22,
      }
    : {
        color: '#6d7e88',
        metalness: 0.55,
        roughness: 0.38,
        envMapIntensity: 1.05,
      }
}

function makeQuarterDisk(r) {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.absarc(0, 0, Math.max(0.06, r), 0, Math.PI / 2, false)
  s.lineTo(0, 0)
  return s
}

function makeFloatTreadShape(depth, width) {
  const r = Math.min(0.05, depth * 0.2, width * 0.08)
  const hw = width / 2
  const s = new THREE.Shape()
  s.moveTo(0, -hw + 0.01)
  s.lineTo(depth - r, -hw)
  s.absarc(depth - r, -hw + r, r, -Math.PI / 2, 0, false)
  s.lineTo(depth, hw - r)
  s.absarc(depth - r, hw - r, r, 0, Math.PI / 2, false)
  s.lineTo(0, hw - 0.01)
  s.lineTo(0, -hw + 0.01)
  return s
}

function boxAt(sx, sy, sz, x, y, z) {
  const g = new THREE.BoxGeometry(sx, sy, sz)
  g.translate(x, y, z)
  return g
}

function makeWideTreadShape(depth, span, radius) {
  const r = Math.max(0.05, Math.min(radius, depth * 0.48, span * 0.1))
  const s = new THREE.Shape()
  const h = span / 2
  s.moveTo(0, -h)
  s.lineTo(depth - r, -h)
  s.absarc(depth - r, -h + r, r, -Math.PI / 2, 0, false)
  s.lineTo(depth, h - r)
  s.absarc(depth - r, h - r, r, 0, Math.PI / 2, false)
  s.lineTo(0, h)
  s.lineTo(0, -h)
  return s
}

function extrudeUp(shape, thickness, bevel = 0) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: bevel > 0 ? 1 : 0,
    curveSegments: 24,
    steps: 1,
  })
  g.rotateX(Math.PI / 2)
  g.translate(0, thickness, 0)
  return g
}

const WALL_POSE = {
  west: (L, W, t) => ({ position: [-L / 2 + t, 0, 0], rotation: [0, 0, 0] }),
  east: (L, W, t) => ({ position: [L / 2 - t, 0, 0], rotation: [0, Math.PI, 0] }),
  north: (L, W, t) => ({ position: [0, 0, -W / 2 + t], rotation: [0, -Math.PI / 2, 0] }),
  south: (L, W, t) => ({ position: [0, 0, W / 2 - t], rotation: [0, Math.PI / 2, 0] }),
}

function cornerPose(corner, L, W, t) {
  const x = L / 2 - t
  const z = W / 2 - t
  switch (corner) {
    case 'ne':
      return { position: [x, 0, -z], rotation: [0, -Math.PI / 2, 0] }
    case 'se':
      return { position: [x, 0, z], rotation: [0, Math.PI, 0] }
    case 'sw':
      return { position: [-x, 0, z], rotation: [0, Math.PI / 2, 0] }
    default:
      return { position: [-x, 0, -z], rotation: [0, 0, 0] }
  }
}

function mergeAndDispose(parts) {
  const merged = mergeGeometries(parts, false)
  parts.forEach((g) => g.dispose())
  if (merged) merged.computeVertexNormals()
  return merged
}

function WideStep({ depth, span, radius, riserH, yBottom, bodyMat, treadMat }) {
  const bodyH = Math.max(0.04, riserH - TREAD_H - GAP)
  const { body, tread } = useMemo(() => {
    const body = extrudeUp(makeWideTreadShape(Math.max(0.1, depth - 0.04), span - 0.03, Math.max(0.04, radius - 0.02)), bodyH)
    const tread = extrudeUp(makeWideTreadShape(depth, span, radius), TREAD_H)
    body.computeVertexNormals()
    tread.computeVertexNormals()
    return { body, tread }
  }, [depth, span, radius, bodyH])

  useEffect(
    () => () => {
      body.dispose()
      tread.dispose()
    },
    [body, tread],
  )

  return (
    <group position={[0, yBottom, 0]}>
      <mesh geometry={body}>
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <mesh geometry={tread} position={[0, bodyH + GAP, 0]}>
        <meshStandardMaterial {...treadMat} />
      </mesh>
      <mesh position={[depth - 0.01, bodyH + GAP + TREAD_H * 0.4, 0]}>
        <boxGeometry args={[0.014, 0.01, span * 0.92]} />
        <meshBasicMaterial color={LED} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Stairs({
  type,
  poolLength,
  poolWidth,
  poolDepth,
  steps = 4,
  wall = 'west',
  corner = 'nw',
  material,
  waterY = -0.17,
}) {
  const t = WALL_THICKNESS
  const bodyMat = steelMat(material, false)
  const treadMat = steelMat(material, true)

  const eck = type === 'Ecktreppe'
  const eckGeos = useMemo(() => {
    if (!eck) return null
    const N = 5
    const innerW = poolWidth - t * 2
    const innerL = poolLength - t * 2
    const maxR = Math.min(1.32, innerW * 0.58, innerL * 0.32)
    const minR = Math.min(0.42, maxR * 0.34)
    const top = waterY - 0.02
    const rise = (top - TREAD_H - (-poolDepth)) / N
    const bodies = []
    const treads = []
    const leds = []
    for (let i = 0; i < N; i++) {
      const radius = minR + ((N - 1 - i) * (maxR - minR)) / (N - 1)
      const yBottom = -poolDepth + i * rise
      const bodyH = Math.max(0.036, rise - TREAD_H - GAP)
      const bodyR = Math.max(0.07, radius - 0.07)
      const body = extrudeUp(makeQuarterDisk(bodyR), bodyH)
      body.translate(0, yBottom, 0)
      bodies.push(body)
      const tread = extrudeUp(makeQuarterDisk(radius), TREAD_H)
      tread.translate(0, yBottom + bodyH + GAP, 0)
      treads.push(tread)
      const led = new THREE.TorusGeometry(Math.max(0.04, radius - 0.004), 0.014, 6, 28, Math.PI / 2)
      led.rotateX(Math.PI / 2)
      led.translate(0, yBottom + bodyH + GAP + TREAD_H * 0.42, 0)
      leds.push(led)
    }
    return {
      body: mergeAndDispose(bodies),
      tread: mergeAndDispose(treads),
      led: mergeAndDispose(leds),
    }
  }, [eck, poolLength, poolWidth, poolDepth, waterY, t])

  useEffect(
    () => () => {
      if (!eckGeos) return
      eckGeos.body?.dispose()
      eckGeos.tread?.dispose()
      eckGeos.led?.dispose()
    },
    [eckGeos],
  )

  const floatGeos = useMemo(() => {
    if (type !== 'Schwebetreppe') return null
    const N = steps || 4
    const span = wall === 'west' || wall === 'east' ? poolWidth - t * 2 : poolLength - t * 2
    const width = Math.min(1.14, Math.max(0.72, span - 0.14))
    const depth = 0.36
    const z0 = -span / 2 + width / 2 + 0.07
    const rise = 0.255
    const topTread = waterY - 0.018
    const treads = []
    const brackets = []
    const leds = []
    const grooves = []
    for (let i = 0; i < N; i++) {
      const yBottom = topTread - TREAD_H - i * rise
      const tread = extrudeUp(makeFloatTreadShape(depth, width), TREAD_H, 0.004)
      tread.translate(0.012, yBottom, z0)
      treads.push(tread)
      for (const side of [-1, 1]) {
        const z = z0 + side * width * 0.31
        brackets.push(boxAt(0.016, 0.078, 0.058, 0.01, yBottom + TREAD_H * 0.28, z))
        brackets.push(boxAt(0.2, 0.013, 0.036, 0.118, yBottom - 0.007, z))
        brackets.push(boxAt(0.028, 0.028, 0.028, 0.022, yBottom + TREAD_H * 0.28, z))
      }
      leds.push(boxAt(0.012, 0.007, width * 0.78, 0.012 + depth - 0.018, yBottom + 0.005, z0))
      for (let k = 0; k < 3; k++) {
        grooves.push(boxAt(0.0055, 0.0028, width * 0.62, 0.09 + k * 0.075, yBottom + TREAD_H + 0.001, z0))
      }
    }
    return {
      tread: mergeAndDispose(treads),
      bracket: mergeAndDispose(brackets),
      led: mergeAndDispose(leds),
      groove: mergeAndDispose(grooves),
    }
  }, [type, steps, poolLength, poolWidth, waterY, wall, t])

  useEffect(
    () => () => {
      if (!floatGeos) return
      floatGeos.tread?.dispose()
      floatGeos.bracket?.dispose()
      floatGeos.led?.dispose()
      floatGeos.groove?.dispose()
    },
    [floatGeos],
  )

  if (eck) {
    if (!eckGeos?.body || !eckGeos?.tread) return null
    const pose = cornerPose(corner, poolLength, poolWidth, t)
    return (
      <group position={pose.position} rotation={pose.rotation}>
        <mesh geometry={eckGeos.body}>
          <meshStandardMaterial {...bodyMat} />
        </mesh>
        <mesh geometry={eckGeos.tread}>
          <meshStandardMaterial {...TREAD_VIS} />
        </mesh>
        {eckGeos.led && (
          <mesh geometry={eckGeos.led}>
            <meshBasicMaterial color={LED} toneMapped={false} />
          </mesh>
        )}
      </group>
    )
  }

  const pose = (WALL_POSE[wall] || WALL_POSE.west)(poolLength, poolWidth, t)
  const span = wall === 'west' || wall === 'east' ? poolWidth - t * 2 : poolLength - t * 2

  if (type === 'Schwebetreppe' && floatGeos?.tread) {
    return (
      <group position={pose.position} rotation={pose.rotation}>
        <mesh geometry={floatGeos.tread}>
          <meshStandardMaterial {...TREAD_VIS} metalness={0.48} roughness={0.18} envMapIntensity={1.55} />
        </mesh>
        {floatGeos.bracket && (
          <mesh geometry={floatGeos.bracket}>
            <meshStandardMaterial {...bodyMat} />
          </mesh>
        )}
        {floatGeos.groove && (
          <mesh geometry={floatGeos.groove}>
            <meshStandardMaterial color="#8a969e" roughness={0.48} metalness={0.5} />
          </mesh>
        )}
        {floatGeos.led && (
          <mesh geometry={floatGeos.led}>
            <meshBasicMaterial color={LED} toneMapped={false} />
          </mesh>
        )}
      </group>
    )
  }

  if (type === 'Breitstufentreppe') {
    const N = Math.max(4, steps || Math.round(poolDepth / 0.26))
    const top = waterY - 0.02
    const rise = (top - TREAD_H - (-poolDepth)) / N
    const maxDepth = Math.min(1.2, (poolLength - t * 2) * 0.42)

    return (
      <group position={pose.position} rotation={pose.rotation}>
        {Array.from({ length: N }).map((_, i) => {
          const depth = ((N - i) * maxDepth) / N + 0.04
          return (
            <WideStep
              key={i}
              depth={depth}
              span={span - 0.06}
              radius={Math.min(0.16, depth * 0.32)}
              riserH={rise}
              yBottom={-poolDepth + i * rise}
              bodyMat={bodyMat}
              treadMat={treadMat}
            />
          )
        })}
      </group>
    )
  }

  const N = steps || 4
  const top = waterY - 0.04
  const rise = (top - (-poolDepth)) / (N + 0.15)
  const w = Math.min(1.25, span - 0.08)
  const protr = 0.48

  return (
    <group position={pose.position} rotation={pose.rotation}>
      {Array.from({ length: N }).map((_, i) => {
        const y = -poolDepth + (i + 1) * rise
        return (
          <group key={i} position={[protr / 2 + 0.04, y, -span / 2 + w / 2 + 0.04]}>
            <mesh>
              <boxGeometry args={[protr, TREAD_H, w]} />
              <meshStandardMaterial {...treadMat} />
            </mesh>
            <mesh position={[protr / 2 - 0.008, -0.004, 0]}>
              <boxGeometry args={[0.012, 0.008, w * 0.9]} />
              <meshBasicMaterial color={LED} toneMapped={false} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export default React.memo(Stairs)
