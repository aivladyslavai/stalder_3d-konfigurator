import React, { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../../data/config'

/**
 * Polycarbonat-Rollladen: einzelne Lamellen bis zur Beckenmitte,
 * Edelstahlwelle am Plus-X-Ende (gegenüber der Ecktreppe).
 */

const SLAT_W = 0.064
const SLAT_H = 0.017
const PITCH = 0.067
const ROLL_R = 0.092

const PC = {
  color: '#c9d4de',
  roughness: 0.18,
  metalness: 0.14,
  clearcoat: 0.88,
  clearcoatRoughness: 0.11,
  envMapIntensity: 1.6,
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
  const r = 0.005
  s.moveTo(-hw + r, 0)
  s.lineTo(hw - r, 0)
  s.quadraticCurveTo(hw, 0, hw, r)
  s.lineTo(hw, h - r)
  s.quadraticCurveTo(hw, h, hw - r, h)
  s.lineTo(0.007, h)
  s.lineTo(0, h - 0.0026)
  s.lineTo(-0.007, h)
  s.lineTo(-hw + r, h)
  s.quadraticCurveTo(-hw, h, -hw, h - r)
  s.lineTo(-hw, r)
  s.quadraticCurveTo(-hw, 0, -hw + r, 0)

  const g = new THREE.ExtrudeGeometry(s, {
    depth: span,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.0012,
    bevelSegments: 1,
    curveSegments: 4,
    steps: 1,
  })
  g.translate(0, -h / 2, -span / 2)
  g.computeVertexNormals()
  g.computeBoundingBox()
  g.computeBoundingSphere()
  return g
}

function Cover({ poolLength, poolWidth, waterY = -0.17 }) {
  const meshRef = useRef()
  const t = WALL_THICKNESS
  const span = Math.max(0.6, poolWidth - t * 2 - 0.05)
  const innerMaxX = poolLength / 2 - t - 0.04
  const rx = innerMaxX - ROLL_R
  const y = waterY + SLAT_H / 2 + 0.006
  const coverStart = 0.04
  const coverEnd = rx - ROLL_R - 0.01
  const flatCount = Math.max(4, Math.floor((coverEnd - coverStart) / PITCH))
  const wrapCount = 6
  const count = flatCount + wrapCount

  const geometry = useMemo(() => makeSlatGeometry(span), [span])
  useLayoutEffect(() => () => geometry.dispose(), [geometry])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < flatCount; i++) {
      dummy.position.set(coverStart + (i + 0.5) * PITCH, y, 0)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    const R = ROLL_R + SLAT_H * 0.2
    for (let j = 0; j < wrapCount; j++) {
      const a = Math.PI + (j + 0.35) * 0.36
      dummy.position.set(rx + Math.cos(a) * R, y + Math.sin(a) * R, 0)
      dummy.rotation.set(0, 0, a - Math.PI)
      dummy.updateMatrix()
      mesh.setMatrixAt(flatCount + j, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [flatCount, wrapCount, y, rx, coverStart])

  const coverLen = flatCount * PITCH
  const coverMid = coverStart + coverLen / 2

  return (
    <group>
      <instancedMesh
        key={`${count}-${span.toFixed(2)}`}
        ref={meshRef}
        args={[geometry, null, count]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <meshPhysicalMaterial {...PC} />
      </instancedMesh>

      {[-1, 1].map((side) => (
        <mesh key={side} position={[coverMid, y + 0.002, side * (span / 2 + 0.012)]} castShadow>
          <boxGeometry args={[coverLen + 0.04, 0.01, 0.014]} />
          <meshPhysicalMaterial {...CHROME} />
        </mesh>
      ))}

      <group position={[rx, y, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[ROLL_R - 0.012, ROLL_R - 0.012, span + 0.05, 32]} />
          <meshPhysicalMaterial {...CHROME} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[0, 0, side * (span / 2 + 0.018)]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[ROLL_R + 0.012, ROLL_R + 0.012, 0.022, 28]} />
            <meshPhysicalMaterial {...CHROME} />
          </mesh>
        ))}
      </group>

      <group position={[poolLength / 2 + 0.28, 0, poolWidth / 2 - 0.38]}>
        <mesh position={[0, 0.11, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.22, 0.42]} />
          <meshPhysicalMaterial {...CHROME} />
        </mesh>
        <mesh position={[-0.12, 0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.16, 16]} />
          <meshStandardMaterial color="#1c1f22" roughness={0.45} metalness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

export default React.memo(Cover)
