import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../../data/config'

/**
 * Polycarbonat-Rollladen: Lamellen wickeln sich von der Edelstahlwelle
 * aufs Wasser (und zurück), statt nur zur Hälfte einzublenden.
 */

const SLAT_W = 0.072
const SLAT_H = 0.022
const PITCH = 0.082
const ROLL_R = 0.1
const R0 = ROLL_R + SLAT_H * 0.22

const PC = {
  color: '#d2dbe4',
  roughness: 0.14,
  metalness: 0.16,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.8,
}

const CHROME = {
  color: '#eef3f6',
  metalness: 0.97,
  roughness: 0.1,
  envMapIntensity: 2.2,
  clearcoat: 0.45,
  clearcoatRoughness: 0.08,
}

const _dummy = new THREE.Object3D()

function easeMotor(t) {
  const x = Math.min(1, Math.max(0, t))
  return 0.5 - 0.5 * Math.cos(Math.PI * x)
}

function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

function makeSlatGeometry(span) {
  const s = new THREE.Shape()
  const hw = SLAT_W / 2
  const h = SLAT_H
  const r = 0.006
  s.moveTo(-hw + r, 0)
  s.lineTo(hw - r, 0)
  s.quadraticCurveTo(hw, 0, hw, r)
  s.lineTo(hw, h - r)
  s.quadraticCurveTo(hw, h, hw - r, h)
  s.lineTo(0.012, h)
  s.quadraticCurveTo(0, h - 0.007, -0.012, h)
  s.lineTo(-hw + r, h)
  s.quadraticCurveTo(-hw, h, -hw, h - r)
  s.lineTo(-hw, r)
  s.quadraticCurveTo(-hw, 0, -hw + r, 0)

  const g = new THREE.ExtrudeGeometry(s, {
    depth: span,
    bevelEnabled: true,
    bevelThickness: 0.0014,
    bevelSize: 0.0014,
    bevelSegments: 1,
    curveSegments: 5,
    steps: 1,
  })
  g.translate(0, -h / 2, -span / 2)
  g.computeVertexNormals()
  g.computeBoundingSphere()
  return g
}

/** Slat sits on the drum. offset=0 is the peel lip (pool side, −X). */
function poseOnDrum(dummy, offset, rx, y) {
  const dist = Math.max(0, offset) * PITCH
  const turns = dist / Math.max(Math.PI * 2 * R0, 0.12)
  const r = R0 + turns * SLAT_H * 0.92
  // Over the top; keep faces mostly up so the roll reads from above.
  const a = Math.PI - dist / Math.max(r, 0.07)
  dummy.position.set(rx + Math.cos(a) * r, y + Math.sin(a) * r, 0)
  dummy.rotation.set(0, 0, (a - Math.PI) * 0.38)
  dummy.scale.set(offset > 16 ? 0 : 1, 1, 1)
}

function poseOnWater(dummy, i, paidOut, coverEnd, y) {
  dummy.position.set(coverEnd - paidOut * PITCH + (i + 0.5) * PITCH, y, 0)
  dummy.rotation.set(0, 0, 0)
  dummy.scale.set(1, 1, 1)
}

function posePeel(dummy, frac, rx, y, coverEnd) {
  const k = smoothstep(frac)
  poseOnDrum(dummy, 1 - frac, rx, y)
  const fromX = dummy.position.x
  const fromY = dummy.position.y
  const fromR = dummy.rotation.z
  const toX = coverEnd - 0.5 * PITCH
  dummy.position.set(fromX + (toX - fromX) * k, fromY + (y - fromY) * k, 0)
  dummy.rotation.set(0, 0, fromR * (1 - k))
  dummy.scale.set(1, 1, 1)
}

function applySlatMatrices(mesh, { flatCount, wrapCount, y, rx, coverEnd, progress }) {
  if (!mesh?.instanceMatrix) return
  const total = flatCount + wrapCount
  const cap = mesh.instanceMatrix.count
  mesh.count = Math.min(total, cap)
  const p = Math.min(1, Math.max(0, progress))
  const paidOut = p * flatCount

  for (let i = 0; i < mesh.count; i++) {
    if (i < flatCount) {
      const local = paidOut - i
      if (local >= 1) poseOnWater(_dummy, i, paidOut, coverEnd, y)
      else if (local <= 0) poseOnDrum(_dummy, i - paidOut + 0.12, rx, y)
      else posePeel(_dummy, local, rx, y, coverEnd)
    } else {
      poseOnDrum(_dummy, i - paidOut + 0.35, rx, y)
    }
    _dummy.updateMatrix()
    mesh.setMatrixAt(i, _dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
}

function Cover({ open = true, onClosed, poolLength, poolWidth, waterY = -0.17 }) {
  const meshRef = useRef()
  const drumRef = useRef()
  const noseRef = useRef()
  const railA = useRef()
  const railB = useRef()
  const onClosedRef = useRef(onClosed)
  onClosedRef.current = onClosed

  const t = WALL_THICKNESS
  const span = Math.max(0.6, poolWidth - t * 2 - 0.04)
  const innerMaxX = poolLength / 2 - t - 0.03
  const rx = innerMaxX - ROLL_R * 0.85
  const y = waterY + SLAT_H / 2 + 0.028
  const coverEnd = rx - R0 - 0.008
  const coverStart = 0.04
  const flatCount = Math.max(4, Math.floor((coverEnd - coverStart) / PITCH))
  const wrapCount = 7
  const count = flatCount + wrapCount

  const layoutRef = useRef()
  layoutRef.current = { flatCount, wrapCount, y, rx, coverEnd }

  const anim = useRef({
    p: 0,
    from: 0,
    to: 0,
    t: 0,
    dur: 3.45,
    sent: false,
    running: false,
    dirty: true,
  })

  const geometry = useMemo(() => makeSlatGeometry(span), [span])
  useLayoutEffect(() => () => geometry.dispose(), [geometry])

  useEffect(() => {
    const a = anim.current
    a.from = a.p
    a.to = open ? 1 : 0
    a.t = 0
    a.dur = Math.max(0.5, Math.abs(a.to - a.from) * 3.2)
    a.sent = false
    a.running = Math.abs(a.to - a.from) > 1e-4
    a.dirty = true
  }, [open])

  const slatRef = useCallback((mesh) => {
    meshRef.current = mesh
    applySlatMatrices(mesh, { ...layoutRef.current, progress: anim.current.p })
  }, [])

  useLayoutEffect(() => {
    anim.current.dirty = true
    applySlatMatrices(meshRef.current, { ...layoutRef.current, progress: anim.current.p })
  }, [flatCount, wrapCount, y, rx, coverEnd, count, geometry])

  useFrame((_, dt) => {
    const a = anim.current
    const layout = layoutRef.current
    if (a.running) {
      a.t += Math.min(Math.max(dt, 0), 0.048)
      const u = Math.min(1, a.t / a.dur)
      a.p = a.from + (a.to - a.from) * easeMotor(u)
      a.dirty = true
      if (u >= 1) {
        a.running = false
        a.p = a.to
        if (a.to === 0 && !a.sent) {
          a.sent = true
          onClosedRef.current?.()
        }
      }
    }
    if (!a.dirty) return
    a.dirty = false

    applySlatMatrices(meshRef.current, { ...layout, progress: a.p })

    const paidOut = a.p * layout.flatCount
    const waterLen = paidOut * PITCH
    const startX = layout.coverEnd - waterLen
    if (drumRef.current) drumRef.current.rotation.z = -paidOut * PITCH / ROLL_R
    if (noseRef.current) {
      noseRef.current.position.x = startX - 0.008
      noseRef.current.visible = paidOut > 0.28
    }
    const mid = startX + waterLen * 0.5
    const railLen = Math.max(0.04, waterLen + 0.028)
    for (const rail of [railA.current, railB.current]) {
      if (!rail) continue
      rail.position.x = mid
      rail.scale.x = railLen
      rail.visible = paidOut > 0.65
    }
  })

  return (
    <group>
      <instancedMesh
        key={`${count}-${span.toFixed(3)}`}
        ref={slatRef}
        args={[geometry, null, count]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <meshPhysicalMaterial {...PC} />
      </instancedMesh>

      <mesh ref={noseRef} position={[coverEnd, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[SLAT_H * 0.58, SLAT_H * 0.58, span, 20]} />
        <meshPhysicalMaterial {...PC} metalness={0.28} roughness={0.12} />
      </mesh>

      <mesh ref={railA} position={[0, y + 0.001, span / 2 + 0.01]} castShadow visible={false}>
        <boxGeometry args={[1, 0.012, 0.016]} />
        <meshPhysicalMaterial {...CHROME} />
      </mesh>
      <mesh ref={railB} position={[0, y + 0.001, -(span / 2 + 0.01)]} castShadow visible={false}>
        <boxGeometry args={[1, 0.012, 0.016]} />
        <meshPhysicalMaterial {...CHROME} />
      </mesh>

      <group ref={drumRef} position={[rx, y, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[ROLL_R - 0.014, ROLL_R - 0.014, span + 0.06, 36]} />
          <meshPhysicalMaterial {...CHROME} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[0, 0, side * (span / 2 + 0.02)]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[ROLL_R + 0.016, ROLL_R + 0.016, 0.024, 32]} />
            <meshPhysicalMaterial {...CHROME} />
          </mesh>
        ))}
      </group>

      <RoundedBox args={[0.36, 0.18, poolWidth + 0.1]} radius={0.03} smoothness={4} position={[poolLength / 2 + 0.26, 0.09, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial {...CHROME} />
      </RoundedBox>
      <mesh position={[poolLength / 2 + 0.26, 0.185, 0]}>
        <boxGeometry args={[0.32, 0.012, poolWidth + 0.04]} />
        <meshPhysicalMaterial color="#b7c2cc" metalness={0.35} roughness={0.32} />
      </mesh>
    </group>
  )
}

function CoverGate({ rolladen, onBlocking, ...rest }) {
  const [alive, setAlive] = useState(!!rolladen)
  const openRef = useRef(!!rolladen)
  openRef.current = !!rolladen

  useEffect(() => {
    if (rolladen) setAlive(true)
  }, [rolladen])

  useEffect(() => {
    onBlocking?.(alive)
  }, [alive, onBlocking])

  if (!alive) return null
  return (
    <Cover
      open={!!rolladen}
      onClosed={() => {
        if (!openRef.current) setAlive(false)
      }}
      {...rest}
    />
  )
}

export default React.memo(CoverGate)
