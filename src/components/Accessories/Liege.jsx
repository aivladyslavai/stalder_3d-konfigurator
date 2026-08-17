import React from 'react'

export default function Liege({ position, rotation, poolDepth }) {
  const depth = poolDepth
  return (
    <group position={position} rotation={rotation}>
      {[0, 1, 2, 3].map((i) => {
        const h = 0.12
        const y = -depth + 0.18 + i * 0.16
        const len = 2.0 - i * 0.12
        return (
          <mesh key={i} position={[0.35 + i * 0.18, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.38, h, len]} />
            <meshStandardMaterial color="#cfd4d8" metalness={0.55} roughness={0.35} />
          </mesh>
        )
      })}
    </group>
  )
}

export function Bank({ position, rotation, poolDepth }) {
  const y = -poolDepth + 0.42
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0.28, y, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.08, 2.0]} />
        <meshStandardMaterial color="#d5d9dc" metalness={0.65} roughness={0.28} />
      </mesh>
      {[-0.85, 0.85].map((z) => (
        <mesh key={z} position={[0.28, y - 0.2, z]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.36, 12]} />
          <meshStandardMaterial color="#b7bcc0" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}
