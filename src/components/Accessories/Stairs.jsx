import React, { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { WALL_THICKNESS } from '../../data/config'
import { makePerforatedTreadMaps } from '../../three/textures'

/**
 * Ecktreppe: nested right triangles (straight 45° front), 6 steps.
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

function makeFloatTreadFrame(depth, width, inset = 0.026) {
  const outer = makeFloatTreadShape(depth, width)
  const hw = (width - inset * 2) / 2
  const x0 = inset + 0.004
  const x1 = depth - inset
  const hole = new THREE.Path()
  hole.moveTo(x0, -hw)
  hole.lineTo(x0, hw)
  hole.lineTo(x1, hw)
  hole.lineTo(x1, -hw)
  hole.closePath()
  outer.holes.push(hole)
  return outer
}

const FLOAT_FLOOR_H = 0.016
const FLOAT_FRAME_H = 0.034
const FLOAT_TREAD_H = FLOAT_FLOOR_H + FLOAT_FRAME_H
const FLOAT_RISE = 0.25

const CHROME_PLATE = {
  color: '#f3f7f9',
  metalness: 0.92,
  roughness: 0.16,
  envMapIntensity: 2.05,
  clearcoat: 0.55,
  clearcoatRoughness: 0.1,
  emissive: '#3a6574',
  emissiveIntensity: 0.38,
}

const CHROME_ARM = {
  color: '#e4eef2',
  metalness: 0.94,
  roughness: 0.18,
  envMapIntensity: 1.85,
  clearcoat: 0.35,
  clearcoatRoughness: 0.12,
  emissive: '#2f5562',
  emissiveIntensity: 0.22,
}

function applyMapRepeat(maps, rx, ry) {
  Object.values(maps).forEach((tex) => {
    if (tex?.repeat) tex.repeat.set(rx, ry)
  })
}

function FloatTread({ depth, width, yBottom, z, maps, floor, frame }) {
  const meshD = depth - 0.052
  const meshW = width - 0.052
  const wellD = meshD - 0.004
  const wellW = meshW - 0.004
  const cx = 0.012 + depth * 0.5
  const floorTop = yBottom + FLOAT_FLOOR_H
  const top = yBottom + FLOAT_TREAD_H

  return (
    <group>
      <mesh geometry={floor} position={[0.012, yBottom, z]} castShadow receiveShadow>
        <meshPhysicalMaterial {...CHROME_PLATE} roughness={0.22} />
      </mesh>
      <mesh geometry={frame} position={[0.012, floorTop, z]} castShadow receiveShadow>
        <meshPhysicalMaterial {...CHROME_PLATE} />
      </mesh>

      <mesh position={[cx, floorTop + 0.0012, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[wellD, wellW]} />
        <meshPhysicalMaterial
          color="#0c4a56"
          roughness={0.14}
          metalness={0.18}
          envMapIntensity={1.2}
          emissive="#17808f"
          emissiveIntensity={0.42}
        />
      </mesh>

      <mesh
        position={[cx, top - 0.0014, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
        renderOrder={2}
      >
        <planeGeometry args={[meshD, meshW]} />
        <meshPhysicalMaterial
          {...maps}
          color="#ffffff"
          roughness={0.18}
          metalness={0.95}
          envMapIntensity={2.05}
          clearcoat={0.45}
          clearcoatRoughness={0.12}
          emissive="#4a7382"
          emissiveIntensity={0.14}
          normalScale={[0.9, 0.9]}
          alphaTest={0.45}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      <mesh position={[0.012 + depth - 0.026, top - 0.003, z]} castShadow>
        <boxGeometry args={[0.018, 0.01, width * 0.92]} />
        <meshPhysicalMaterial
          color="#f6fafc"
          metalness={0.95}
          roughness={0.1}
          envMapIntensity={2.2}
          clearcoat={0.7}
          emissive="#5a8490"
          emissiveIntensity={0.4}
        />
      </mesh>

      <mesh position={[0.012 + depth - 0.034, top - 0.012, z]} castShadow>
        <boxGeometry args={[0.006, 0.0028, width * 0.68]} />
        <meshStandardMaterial
          color="#c5f6ff"
          emissive="#7aecfa"
          emissiveIntensity={0.55}
          toneMapped={false}
          roughness={0.2}
        />
      </mesh>

      {[-1, 1].map((side) => {
        const sz = z + side * width * 0.3
        return (
          <group key={side}>
            <mesh position={[0.028, yBottom + FLOAT_TREAD_H * 0.42, sz]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.011, 0.011, 0.07, 14]} />
              <meshPhysicalMaterial {...CHROME_ARM} />
            </mesh>
            <mesh position={[0.11, yBottom + 0.007, sz]} castShadow>
              <boxGeometry args={[0.18, 0.01, 0.034]} />
              <meshPhysicalMaterial {...CHROME_ARM} roughness={0.22} />
            </mesh>
            <mesh position={[0.2, yBottom + 0.013, sz]} castShadow>
              <boxGeometry args={[0.028, 0.008, 0.028]} />
              <meshPhysicalMaterial {...CHROME_ARM} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function FloatingStair({ steps, poolLength, poolWidth, wall, waterY, t }) {
  const maps = useMemo(() => makePerforatedTreadMaps(512, 12), [])
  const span = wall === 'west' || wall === 'east' ? poolWidth - t * 2 : poolLength - t * 2
  const width = Math.min(1.18, Math.max(0.78, span - 0.14))
  const depth = 0.38
  const z0 = -span / 2 + width / 2 + 0.07
  const N = steps || 4
  const topTread = waterY - 0.012

  const floor = useMemo(() => {
    const g = extrudeUp(makeFloatTreadShape(depth, width), FLOAT_FLOOR_H, 0.004)
    g.computeVertexNormals()
    return g
  }, [depth, width])

  const frame = useMemo(() => {
    const g = extrudeUp(makeFloatTreadFrame(depth, width), FLOAT_FRAME_H, 0.007)
    g.computeVertexNormals()
    return g
  }, [depth, width])

  useEffect(() => {
    const meshD = depth - 0.052
    const meshW = width - 0.052
    const pitch = 0.022
    const holes = 12
    applyMapRepeat(maps, meshD / (holes * pitch), meshW / (holes * pitch))
  }, [maps, width, depth])

  useEffect(
    () => () => {
      floor.dispose()
      frame.dispose()
      Object.values(maps).forEach((tex) => tex.dispose?.())
    },
    [maps, floor, frame],
  )

  return (
    <group>
      {Array.from({ length: N }, (_, i) => (
        <FloatTread
          key={i}
          depth={depth}
          width={width}
          yBottom={topTread - FLOAT_TREAD_H - i * FLOAT_RISE}
          z={z0}
          maps={maps}
          floor={floor}
          frame={frame}
        />
      ))}
    </group>
  )
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

function makeCornerStepShape(r) {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.lineTo(r, 0)
  s.lineTo(0, r)
  s.closePath()
  return s
}

function ledBar(ax, az, bx, bz, y) {
  const dx = bx - ax
  const dz = bz - az
  const len = Math.hypot(dx, dz)
  if (len < 0.01) return null
  const g = new THREE.BoxGeometry(0.016, 0.01, len)
  g.rotateY(Math.atan2(dx, dz))
  g.translate((ax + bx) / 2, y, (az + bz) / 2)
  return g
}

function extrudeUp(shape, thickness, bevel = 0, curveSegments = 20) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: bevel > 0 ? 3 : 0,
    curveSegments,
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
    const N = 6
    const innerW = poolWidth - t * 2
    const innerL = poolLength - t * 2
    const maxR = Math.min(1.35, innerW * 0.58, innerL * 0.34)
    const top = waterY - 0.02
    const rise = (top - TREAD_H - (-poolDepth)) / N
    const bodies = []
    const treads = []
    const leds = []
    for (let i = 0; i < N; i++) {
      const radius = ((N - i) * maxR) / N
      const yBottom = -poolDepth + i * rise
      const bodyH = Math.max(0.036, rise - TREAD_H - GAP)
      const bodyR = Math.max(0.06, radius - 0.028)
      const body = extrudeUp(makeCornerStepShape(bodyR), bodyH, 0, 1)
      body.translate(0, yBottom, 0)
      bodies.push(body)
      const tread = extrudeUp(makeCornerStepShape(radius), TREAD_H, 0, 1)
      tread.translate(0, yBottom + bodyH + GAP, 0)
      treads.push(tread)
      const ly = yBottom + bodyH + GAP + TREAD_H * 0.42
      const bar = ledBar(radius, 0, 0, radius, ly)
      if (bar) leds.push(bar)
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

  if (eck) {
    if (!eckGeos?.body || !eckGeos?.tread) return null
    const pose = cornerPose(corner, poolLength, poolWidth, t)
    return (
      <group position={pose.position} rotation={pose.rotation}>
        <mesh geometry={eckGeos.body}>
          <meshStandardMaterial {...bodyMat} flatShading />
        </mesh>
        <mesh geometry={eckGeos.tread}>
          <meshStandardMaterial {...TREAD_VIS} flatShading />
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

  if (type === 'Schwebetreppe') {
    return (
      <group position={pose.position} rotation={pose.rotation}>
        <FloatingStair
          steps={steps}
          poolLength={poolLength}
          poolWidth={poolWidth}
          wall={wall}
          waterY={waterY}
          t={t}
        />
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
