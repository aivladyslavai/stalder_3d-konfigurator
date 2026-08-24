import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * RGBW-LED im Becken – nachts deutlich stärker (Bloom + Unterwasserlicht).
 */
function LedStrip({ poolLength, poolWidth, poolDepth, night = false }) {
  const stripMats = [useRef(), useRef(), useRef(), useRef()]
  const lightRefs = [useRef(), useRef(), useRef(), useRef()]
  const glowRefs = [useRef(), useRef()]
  const halfW = poolWidth / 2
  const halfL = poolLength / 2
  const color = useRef(new THREE.Color())
  const glow = useRef(new THREE.Color())

  useFrame(({ clock }) => {
    const hue = (0.52 + Math.sin(clock.elapsedTime * 0.22) * 0.08) % 1
    color.current.setHSL(hue, 0.95, night ? 0.62 : 0.55)
    glow.current.copy(color.current).multiplyScalar(night ? 5.5 : 3.0)
    stripMats.forEach((r) => r.current && r.current.color.copy(glow.current))
    lightRefs.forEach((r) => {
      if (!r.current) return
      r.current.color.copy(color.current)
      r.current.intensity = night ? 9 : 4.5
    })
    glowRefs.forEach((r) => {
      if (!r.current) return
      r.current.material.opacity = night ? 0.22 + Math.sin(clock.elapsedTime * 1.4) * 0.04 : 0.08
      r.current.material.color.copy(color.current)
    })
  })

  const y = -0.12

  return (
    <group>
      <mesh position={[0, y, halfW - 0.1]}>
        <boxGeometry args={[poolLength * 0.92, 0.04, 0.04]} />
        <meshBasicMaterial ref={stripMats[0]} color="#00ccff" toneMapped={false} />
      </mesh>
      <mesh position={[0, y, -halfW + 0.1]}>
        <boxGeometry args={[poolLength * 0.92, 0.04, 0.04]} />
        <meshBasicMaterial ref={stripMats[1]} color="#00ccff" toneMapped={false} />
      </mesh>
      <mesh position={[halfL - 0.12, y, 0]}>
        <boxGeometry args={[0.04, 0.04, poolWidth * 0.7]} />
        <meshBasicMaterial ref={stripMats[2]} color="#00ccff" toneMapped={false} />
      </mesh>
      <mesh position={[-halfL + 0.12, y, 0]}>
        <boxGeometry args={[0.04, 0.04, poolWidth * 0.7]} />
        <meshBasicMaterial ref={stripMats[3]} color="#00ccff" toneMapped={false} />
      </mesh>

      <pointLight ref={lightRefs[0]} position={[-poolLength / 4, -poolDepth * 0.45, 0]} color="#00aaff" intensity={5} distance={night ? 9 : 6} decay={2} />
      <pointLight ref={lightRefs[1]} position={[poolLength / 4, -poolDepth * 0.45, 0]} color="#00aaff" intensity={5} distance={night ? 9 : 6} decay={2} />
      <pointLight ref={lightRefs[2]} position={[0, -poolDepth * 0.35, poolWidth / 5]} color="#66ddff" intensity={3} distance={night ? 7 : 4} decay={2} />
      <pointLight ref={lightRefs[3]} position={[0, -poolDepth * 0.35, -poolWidth / 5]} color="#66ddff" intensity={3} distance={night ? 7 : 4} decay={2} />

      {/* weiches Unterwasser-Glow-Volumen */}
      <mesh ref={glowRefs[0]} position={[-poolLength / 5, -poolDepth * 0.5, 0]}>
        <sphereGeometry args={[1.1, 16, 12]} />
        <meshBasicMaterial color="#40c8ff" transparent opacity={0.1} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={glowRefs[1]} position={[poolLength / 5, -poolDepth * 0.5, 0]}>
        <sphereGeometry args={[1.1, 16, 12]} />
        <meshBasicMaterial color="#40c8ff" transparent opacity={0.1} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default React.memo(LedStrip)
