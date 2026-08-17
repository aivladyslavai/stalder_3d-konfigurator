import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Robot({ position, variant = 'X60', poolDepth }) {
  const ref = useRef()
  const scale = variant === 'X80' ? 1.15 : 1
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.35) * 0.4
  })

  return (
    <group ref={ref} position={[position[0], -poolDepth + 0.09, position[2]]} scale={scale}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.12, 0.32]} />
        <meshStandardMaterial color={variant === 'X80' ? '#1f2a38' : '#2c3a4a'} roughness={0.4} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.08, 0]} castShadow>
        <sphereGeometry args={[0.13, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3d4f63" roughness={0.35} metalness={0.4} />
      </mesh>
      {[-0.18, 0.18].map((z) => (
        <mesh key={z} position={[0, -0.04, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.38, 16]} />
          <meshStandardMaterial color="#111418" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0.16, 0.04, 0]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color="#32B4E6" emissive="#32B4E6" emissiveIntensity={1.6} />
      </mesh>
    </group>
  )
}
