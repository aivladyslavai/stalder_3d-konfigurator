import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../../data/config'

/**
 * Unterwasser-RGBW-Scheinwerfer nur an einer Längswand (Hausseite, −Z).
 * Linse zeigt ins Becken; aus der Standardkamera ist die Fläche sichtbar.
 * Bis 7 m eine Lampe, darüber zwei.
 */

const CHROME = {
  color: '#f4f8fa',
  metalness: 0.98,
  roughness: 0.07,
  envMapIntensity: 2.5,
  clearcoat: 0.7,
  clearcoatRoughness: 0.06,
}

function lampXs(poolLength, count) {
  const inset = poolLength / 2 - WALL_THICKNESS - 0.55
  if (count === 2) return [-inset * 0.62, inset * 0.62]
  return [0]
}

function RgbwLamp({ lensRef, lightRef }) {
  return (
    <group>
      {/* Dose entlang lokaler +Z (ins Becken) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.055]} castShadow>
        <cylinderGeometry args={[0.155, 0.175, 0.11, 48]} />
        <meshPhysicalMaterial color="#b7c2c8" metalness={0.88} roughness={0.24} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]} castShadow>
        <cylinderGeometry args={[0.175, 0.175, 0.022, 48]} />
        <meshPhysicalMaterial {...CHROME} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.026]}>
        <cylinderGeometry args={[0.14, 0.14, 0.012, 48]} />
        <meshPhysicalMaterial {...CHROME} />
      </mesh>
      <mesh position={[0, 0, 0.034]}>
        <torusGeometry args={[0.118, 0.012, 12, 48]} />
        <meshStandardMaterial color="#121416" roughness={0.65} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <circleGeometry args={[0.108, 48]} />
        <meshStandardMaterial
          ref={lensRef}
          color="#c5f2ff"
          emissive="#3ec8ff"
          emissiveIntensity={2.2}
          roughness={0.18}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.05]}>
        <sphereGeometry args={[0.09, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#dff8ff"
          roughness={0.08}
          metalness={0}
          transparent
          opacity={0.35}
          transmission={0.2}
          thickness={0.03}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0, 0.32]} color="#7adfff" intensity={2.8} distance={5.5} decay={2} />
    </group>
  )
}

function LedStrip({ poolLength, poolWidth, poolDepth }) {
  const count = poolLength > 7 ? 2 : 1
  const lensRefs = useRef([])
  const lightRefs = useRef([])
  const emit = useRef(new THREE.Color())
  const tint = useRef(new THREE.Color())
  const white = useRef(new THREE.Color('#e8fbff'))
  const t = WALL_THICKNESS
  const z = -poolWidth / 2 + t + 0.06
  const y = -Math.min(0.4, poolDepth * 0.3)
  const xs = useMemo(() => lampXs(poolLength, count), [poolLength, count])

  useFrame(({ clock }) => {
    const hue = (0.52 + Math.sin(clock.elapsedTime * 0.18) * 0.05) % 1
    emit.current.setHSL(hue, 0.75, 0.52)
    tint.current.copy(emit.current).lerp(white.current, 0.4)
    lensRefs.current.forEach((m) => {
      if (!m) return
      m.emissive.copy(emit.current)
      m.color.copy(tint.current)
    })
    const pulse = 2.6 + Math.sin(clock.elapsedTime * 1.3) * 0.25
    lightRefs.current.forEach((l) => {
      if (!l) return
      l.color.copy(emit.current)
      l.intensity = pulse
    })
  })

  return (
    <group>
      {xs.map((x, i) => (
        <group key={`${count}-${i}`} position={[x, y, z]}>
          <RgbwLamp
            lensRef={(el) => {
              lensRefs.current[i] = el
            }}
            lightRef={(el) => {
              lightRefs.current[i] = el
            }}
          />
        </group>
      ))}
    </group>
  )
}

export default React.memo(LedStrip)
