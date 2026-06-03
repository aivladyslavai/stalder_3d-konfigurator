import React from 'react'
import { WALL_THICKNESS } from '../../hooks/usePoolConfig'

/**
 * Gegenstromanlage – grosse Düse mittig an einer kurzen Wand.
 * Props: { poolLength, poolWidth, poolDepth }
 */
function CounterCurrent({ poolLength, poolDepth }) {
  const xPos = -poolLength / 2 + WALL_THICKNESS + 0.05 // an der linken kurzen Wand
  const y = -poolDepth / 2

  return (
    <mesh position={[xPos, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.15, 0.15, 0.3, 24]} />
      <meshStandardMaterial color="#cccccc" metalness={0.6} roughness={0.3} />
    </mesh>
  )
}

export default React.memo(CounterCurrent)
