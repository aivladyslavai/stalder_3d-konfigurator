import React from 'react'
import { WALL_THICKNESS } from '../../hooks/usePoolConfig'

export default function CounterCurrent({ position, rotation, poolDepth }) {
  const y = position ? position[1] : -poolDepth / 2
  const pos = position || [-0, y, 0]
  return (
    <group position={pos} rotation={rotation || [0, 0, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.22, 24]} />
        <meshStandardMaterial color="#d0d4d8" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.1, 0.08, 20]} />
        <meshStandardMaterial color="#9aa3aa" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

export { WALL_THICKNESS }
