import React, { useLayoutEffect, useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../../data/config'

/**
 * Polycarbonat-Rollladen: einzelne Hohlkammer-Lamellen bis zur Beckenmitte,
 * Edelstahlwelle am Plus-X-Ende (gegenüber der Ecktreppe).
 */

const SLAT_W = 0.072
const SLAT_H = 0.022
const PITCH = 0.082
const ROLL_R = 0.1

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

function applySlatMatrices(mesh, { flatCount, wrapCount, y, rx, coverStart }) {
  if (!mesh) return
  const dummy = new THREE.Object3D()
  const want = flatCount + wrapCount
  const cap = mesh.instanceMatrix?.count ?? want
  const n = Math.min(want, cap)
  mesh.count = n
  for (let i = 0; i < flatCount; i++) {
    dummy.position.set(coverStart + (i + 0.5) * PITCH, y, 0)
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  const R = ROLL_R + SLAT_H * 0.25
  for (let j = 0; j < wrapCount; j++) {
    const a = Math.PI + (j + 0.2) * 0.34
    dummy.position.set(rx + Math.cos(a) * R, y + Math.sin(a) * R, 0)
    dummy.rotation.set(0, 0, a - Math.PI)
    dummy.updateMatrix()
    mesh.setMatrixAt(flatCount + j, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  mesh.frustumCulled = false
  mesh.computeBoundingSphere()
}

function Cover({ poolLength, poolWidth, waterY = -0.17 }) {
  const meshRef = useRef()
  const t = WALL_THICKNESS
  const span = Math.max(0.6, poolWidth - t * 2 - 0.04)
  const innerMaxX = poolLength / 2 - t - 0.03
  const rx = innerMaxX - ROLL_R * 0.85
  const y = waterY + SLAT_H / 2 + 0.028
  // Westseite bleibt frei (Treppe). Lamellen von der Beckenmitte bis zur Welle (+X).
  const coverStart = 0.04
  const coverEnd = rx - ROLL_R - 0.02
  const flatCount = Math.max(4, Math.floor((coverEnd - coverStart) / PITCH))
  const wrapCount = 7
  const count = flatCount + wrapCount
  const layout = { flatCount, wrapCount, y, rx, coverStart }

  const geometry = useMemo(() => makeSlatGeometry(span), [span])
  useLayoutEffect(() => () => geometry.dispose(), [geometry])

  const slatRef = (mesh) => {
    meshRef.current = mesh
    applySlatMatrices(mesh, layout)
  }

  useLayoutEffect(() => {
    applySlatMatrices(meshRef.current, layout)
  }, [flatCount, wrapCount, y, rx, coverStart, count, geometry])

  const coverLen = flatCount * PITCH
  const coverMid = coverStart + coverLen / 2

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

      <mesh position={[coverStart - 0.008, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[SLAT_H * 0.52, SLAT_H * 0.52, span, 20]} />
        <meshPhysicalMaterial {...PC} />
      </mesh>

      {[-1, 1].map((side) => (
        <mesh key={`rail-${side}`} position={[coverMid, y + 0.001, side * (span / 2 + 0.01)]} castShadow>
          <boxGeometry args={[coverLen + 0.03, 0.012, 0.016]} />
          <meshPhysicalMaterial {...CHROME} />
        </mesh>
      ))}

      <group position={[rx, y, 0]}>
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

      {/* Rollladenkasten auf der Terrasse am kurzen Plus-X-Ende */}
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

export default React.memo(Cover)
