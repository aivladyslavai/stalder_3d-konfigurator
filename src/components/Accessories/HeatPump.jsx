import React from 'react'

export default function HeatPump({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.9, 0.55]} />
        <meshStandardMaterial color="#e6e8ea" roughness={0.48} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.05, 24]} />
        <meshStandardMaterial color="#b0b4b8" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.45, 0.28]}>
        <boxGeometry args={[0.7, 0.55, 0.02]} />
        <meshStandardMaterial color="#8e949a" metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  )
}
