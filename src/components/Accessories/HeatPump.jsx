import React from 'react'

/**
 * Wärmepumpe – Gehäuse mit Lüftergitter, neben dem Becken auf der Terrasse.
 * Props: { poolLength, poolWidth, poolDepth }
 */
function HeatPump({ poolLength, poolWidth }) {
  // neben dem Becken auf der Terrasse platziert
  const xPos = poolLength / 2 + 1.0
  const zPos = -poolWidth / 2 - 0.5

  return (
    <group position={[xPos, 0.45, zPos]}>
      {/* Gehäuse */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.9, 0.6]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Lüftergitter oben */}
      <mesh position={[0, 0.46, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 24]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  )
}

export default React.memo(HeatPump)
