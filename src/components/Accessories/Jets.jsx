import React from 'react'
import { WALL_THICKNESS } from '../../hooks/usePoolConfig'

/**
 * Massagedüsen – 3 Düsen an einer Längswand.
 * Props: { poolLength, poolWidth, poolDepth }
 */
function Jets({ poolLength, poolWidth, poolDepth }) {
  const zPos = poolWidth / 2 - WALL_THICKNESS - 0.05 // an der vorderen Längswand
  const y = -poolDepth / 2
  const positions = [-poolLength / 4, 0, poolLength / 4]

  return (
    <group>
      {positions.map((x, i) => (
        <mesh key={i} position={[x, y, zPos]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.15, 16]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

export default React.memo(Jets)
