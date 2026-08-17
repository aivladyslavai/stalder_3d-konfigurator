import React from 'react'

export default function Jet({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.12, 20]} />
        <meshStandardMaterial color="#c9ced2" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.04, 16]} />
        <meshStandardMaterial color="#8a9298" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}
