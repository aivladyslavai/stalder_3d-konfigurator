import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const SHELL = {
  color: '#1c242e',
  roughness: 0.42,
  metalness: 0.22,
  envMapIntensity: 1.15,
  emissive: '#1a4860',
  emissiveIntensity: 0.34,
}

const SHELL_LIGHT = {
  color: '#2a3542',
  roughness: 0.38,
  metalness: 0.18,
  envMapIntensity: 1.05,
  emissive: '#163848',
  emissiveIntensity: 0.18,
}

const RUBBER = {
  color: '#121416',
  roughness: 0.88,
  metalness: 0.04,
  envMapIntensity: 0.25,
  emissive: '#0a1218',
  emissiveIntensity: 0.12,
}

const CHROME = {
  color: '#c5d2da',
  roughness: 0.16,
  metalness: 0.92,
  envMapIntensity: 1.8,
  emissive: '#243844',
  emissiveIntensity: 0.16,
}

const BRUSH = {
  color: '#2b241c',
  roughness: 0.78,
  metalness: 0.08,
  envMapIntensity: 0.35,
  emissive: '#1a140c',
  emissiveIntensity: 0.1,
}

function makeTrackTreadTex() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#141618'
  ctx.fillRect(0, 0, 256, 64)
  for (let i = 0; i < 12; i++) {
    const x = i * 22
    ctx.fillStyle = i % 2 ? '#0c0d0f' : '#1c1f22'
    ctx.beginPath()
    ctx.moveTo(x + 2, 6)
    ctx.lineTo(x + 16, 6)
    ctx.lineTo(x + 20, 32)
    ctx.lineTo(x + 16, 58)
    ctx.lineTo(x + 2, 58)
    ctx.lineTo(x - 2, 32)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fillRect(x + 4, 10, 8, 8)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 1)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function Track({ z, map }) {
  const wheels = useRef([])
  useFrame((_, dt) => {
    for (const w of wheels.current) if (w) w.rotation.x += dt * 2.6
  })

  return (
    <group position={[0, -0.052, z]}>
      <RoundedBox args={[0.4, 0.086, 0.068]} radius={0.03} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial {...RUBBER} map={map} />
      </RoundedBox>
      {[-0.12, 0, 0.12].map((x, i) => (
        <mesh
          key={x}
          ref={(el) => {
            wheels.current[i] = el
          }}
          position={[x, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.034, 0.034, 0.072, 16]} />
          <meshStandardMaterial {...SHELL_LIGHT} />
        </mesh>
      ))}
    </group>
  )
}

function Brush({ x }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.x += dt * 6.2
  })
  return (
    <group position={[x, -0.042, 0]}>
      <mesh ref={ref} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 0.3, 20]} />
        <meshStandardMaterial {...BRUSH} />
      </mesh>
      {[-0.08, 0, 0.08].map((z) => (
        <mesh key={z} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.034, 0.006, 8, 16]} />
          <meshStandardMaterial color="#3a2e20" roughness={0.7} emissive="#1a140c" emissiveIntensity={0.08} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Dolphin-ähnlicher Bodenroboter: Gehäuse, Gummiketten, Bürsten, Griff, LED.
 * Leichtes Emissive, damit er unter MeshTransmission-Wasser lesbar bleibt.
 */
export default function Robot({ position, variant = 'X60', poolDepth }) {
  const body = useRef()
  const led = useRef()
  const scale = variant === 'X80' ? 1.12 : 1
  const trackMap = useMemo(() => makeTrackTreadTex(), [])
  useEffect(() => () => trackMap.dispose(), [trackMap])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (body.current) body.current.rotation.y = Math.sin(t * 0.22) * 0.55
    if (led.current) {
      const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3.1))
      led.current.material.emissiveIntensity = pulse
    }
  })

  return (
    <group
      ref={body}
      position={[position[0], -poolDepth + 0.118, position[2]]}
      scale={scale}
    >
      <RoundedBox args={[0.46, 0.13, 0.34]} radius={0.045} smoothness={4} position={[0, 0.012, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...SHELL} />
      </RoundedBox>

      <RoundedBox args={[0.38, 0.045, 0.26]} radius={0.02} smoothness={3} position={[0, 0.078, 0]} castShadow>
        <meshPhysicalMaterial
          color="#4a5c68"
          roughness={0.12}
          metalness={0.15}
          transmission={0.22}
          thickness={0.04}
          transparent
          opacity={0.78}
          envMapIntensity={1.4}
          emissive="#1a3848"
          emissiveIntensity={0.2}
        />
      </RoundedBox>

      <mesh position={[0, 0.072, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.008, 10, 28]} />
        <meshStandardMaterial {...SHELL_LIGHT} />
      </mesh>
      {[-0.07, 0.07].map((z) => (
        <mesh key={z} position={[0.02, 0.07, z]}>
          <boxGeometry args={[0.09, 0.006, 0.018]} />
          <meshStandardMaterial {...SHELL_LIGHT} />
        </mesh>
      ))}

      <mesh position={[0, 0.145, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.11, 0.009, 10, 24, Math.PI]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {[-0.11, 0.11].map((z) => (
        <mesh key={z} position={[0, 0.086, z]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      ))}

      <mesh position={[0.205, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.028, 0.034, 0.04, 20]} />
        <meshStandardMaterial {...SHELL_LIGHT} />
      </mesh>
      <mesh ref={led} position={[0.228, 0.03, 0]}>
        <sphereGeometry args={[0.016, 16, 16]} />
        <meshStandardMaterial color="#9ee7ff" emissive="#5ad4ff" emissiveIntensity={0.9} roughness={0.15} />
      </mesh>

      <mesh position={[0, 0.018, 0.168]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.3, 0.018, 0.012]} />
        <meshStandardMaterial color="#96917E" roughness={0.35} metalness={0.4} emissive="#3a382c" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 0.018, -0.168]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[0.3, 0.018, 0.012]} />
        <meshStandardMaterial color="#96917E" roughness={0.35} metalness={0.4} emissive="#3a382c" emissiveIntensity={0.15} />
      </mesh>

      <Track z={0.175} map={trackMap} />
      <Track z={-0.175} map={trackMap} />
      <Brush x={0.21} />
      <Brush x={-0.21} />

      {variant === 'X80' && (
        <mesh position={[-0.228, 0.04, 0]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial color="#c9a227" emissive="#c9a227" emissiveIntensity={0.7} />
        </mesh>
      )}
    </group>
  )
}
