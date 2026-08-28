import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CHROME = {
  color: '#c9d6de',
  metalness: 0.94,
  roughness: 0.13,
  envMapIntensity: 1.6,
}

const CHROME_SOFT = {
  color: '#8f9ca6',
  metalness: 0.86,
  roughness: 0.24,
  envMapIntensity: 1.2,
}

const WELL = {
  color: '#10181e',
  metalness: 0.38,
  roughness: 0.4,
  envMapIntensity: 0.55,
}

function makeFaceplate() {
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.048, 0.005),
    new THREE.Vector2(0.092, 0.011),
    new THREE.Vector2(0.128, 0.013),
    new THREE.Vector2(0.158, 0.02),
    new THREE.Vector2(0.176, 0.03),
    new THREE.Vector2(0.186, 0.018),
    new THREE.Vector2(0.194, 0.005),
  ]
  const g = new THREE.LatheGeometry(pts, 72)
  g.rotateZ(-Math.PI / 2)
  g.computeVertexNormals()
  return g
}

function makeHandle() {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.055, -0.175, -0.125),
    new THREE.Vector3(0.155, -0.3, 0),
    new THREE.Vector3(0.055, -0.175, 0.125),
  )
  const g = new THREE.TubeGeometry(curve, 24, 0.011, 10, false)
  g.computeVertexNormals()
  return g
}

/**
 * iGarden-InverJet-ähnliche Gegenstromdüse: Chrom-Blende, Düse, Haltegriff, LED.
 * Lokal +X ins Becken, Y oben.
 */
function CounterCurrent({ position, rotation, waterY = -0.17 }) {
  const stream = useRef()
  const y = waterY - 0.28
  const pos = position ? [position[0], y, position[2]] : [0, y, 0]
  const foamY = waterY - y + 0.008

  const geos = useMemo(
    () => ({
      plate: makeFaceplate(),
      handle: makeHandle(),
    }),
    [],
  )

  useEffect(
    () => () => {
      geos.plate.dispose()
      geos.handle.dispose()
    },
    [geos],
  )

  useFrame(({ clock }) => {
    if (!stream.current) return
    const t = clock.elapsedTime
    const s = 0.92 + Math.sin(t * 7.2) * 0.07
    stream.current.scale.set(s, 1, s)
    stream.current.material.opacity = 0.16 + Math.sin(t * 5.4) * 0.04
  })

  return (
    <group position={pos} rotation={rotation || [0, 0, 0]}>
      <group position={[-0.052, 0, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.018, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 48]} />
        <meshStandardMaterial {...CHROME_SOFT} />
      </mesh>

      <mesh geometry={geos.plate}>
        <meshStandardMaterial {...CHROME} />
      </mesh>

      <mesh rotation={[0, Math.PI / 2, 0]} position={[0.02, 0, 0]}>
        <torusGeometry args={[0.168, 0.007, 10, 56]} />
        <meshStandardMaterial {...CHROME} roughness={0.1} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.016, 0, 0]}>
        <cylinderGeometry args={[0.078, 0.09, 0.028, 32]} />
        <meshStandardMaterial {...WELL} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.048, 0, 0]}>
        <cylinderGeometry args={[0.042, 0.05, 0.055, 24]} />
        <meshStandardMaterial {...CHROME_SOFT} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.086, 0, 0]}>
        <cylinderGeometry args={[0.026, 0.03, 0.042, 20]} />
        <meshStandardMaterial {...CHROME} roughness={0.1} />
      </mesh>

      <mesh rotation={[0, Math.PI / 2, 0]} position={[0.108, 0, 0]}>
        <torusGeometry args={[0.024, 0.005, 8, 24]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.09, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.07, 16]} />
        <meshStandardMaterial color="#070b0e" metalness={0.2} roughness={0.55} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side} position={[0.04, 0.055, side * 0.108]} rotation={[side * 0.18, 0, 0.12]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.016, 0.02, 0.03, 16]} />
            <meshStandardMaterial {...CHROME_SOFT} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0.02, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.02, 12]} />
            <meshStandardMaterial {...WELL} />
          </mesh>
        </group>
      ))}

      {[-0.055, 0, 0.055].map((z) => (
        <mesh key={z} position={[0.03, -0.145, z]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.012, 0.01, 0.038]} />
          <meshStandardMaterial {...WELL} roughness={0.6} />
        </mesh>
      ))}

      <mesh geometry={geos.handle}>
        <meshStandardMaterial {...CHROME} roughness={0.16} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0.05, -0.168, side * 0.122]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.014, 0.02, 12]} />
          <meshStandardMaterial {...CHROME_SOFT} />
        </mesh>
      ))}

      <mesh rotation={[0, Math.PI / 2, 0]} position={[0.026, 0, 0]}>
        <torusGeometry args={[0.132, 0.0045, 8, 48]} />
        <meshBasicMaterial color="#9af4ff" toneMapped={false} />
      </mesh>

      <mesh ref={stream} position={[0.55, 0.04, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.95, 18, 1, true]} />
        <meshBasicMaterial color="#c8eef8" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.42, foamY, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
        <circleGeometry args={[0.2, 28]} />
        <meshBasicMaterial color="#e8f7ff" transparent opacity={0.38} depthWrite={false} />
      </mesh>
      <mesh position={[0.62, foamY, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
        <circleGeometry args={[0.12, 20]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      </group>
    </group>
  )
}

export default React.memo(CounterCurrent)
