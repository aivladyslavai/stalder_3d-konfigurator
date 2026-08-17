import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function SchwallDusche({ position, rotation }) {
  const spray = useRef()
  useFrame(({ clock }) => {
    if (!spray.current) return
    const s = 0.85 + Math.sin(clock.elapsedTime * 6) * 0.08
    spray.current.scale.set(s, 1, s)
  })

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0.08, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 1.1, 12]} />
        <meshStandardMaterial color="#d8dce0" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0.28, 1.05, 0]} rotation={[0, 0, -1.05]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.45, 12]} />
        <meshStandardMaterial color="#d8dce0" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0.46, 0.92, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.04, 0.08, 16]} />
        <meshStandardMaterial color="#b8bec3" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh ref={spray} position={[0.62, 0.55, 0]} rotation={[0, 0, 0.15]}>
        <coneGeometry args={[0.12, 0.7, 10, 1, true]} />
        <meshStandardMaterial color="#7ec8e3" transparent opacity={0.28} roughness={0.1} />
      </mesh>
    </group>
  )
}
