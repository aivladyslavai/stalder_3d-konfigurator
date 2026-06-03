import React from 'react'

/**
 * Abdeckung – flache Platte über dem Becken mit 10 Lamellen-Linien als Detail.
 * Props: { poolLength, poolWidth, poolDepth }
 */
function Cover({ poolLength, poolWidth }) {
  const slatCount = 10

  return (
    <group position={[0, 0.02, 0]}>
      {/* Grundplatte */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[poolLength, 0.04, poolWidth]} />
        <meshStandardMaterial color="#334455" transparent opacity={0.8} roughness={0.6} />
      </mesh>

      {/* Lamellen-Linien (Detail) */}
      {Array.from({ length: slatCount }).map((_, i) => {
        const x = -poolLength / 2 + ((i + 0.5) * poolLength) / slatCount
        return (
          <mesh key={i} position={[x, 0.021, 0]}>
            <boxGeometry args={[0.01, 0.005, poolWidth]} />
            <meshStandardMaterial color="#22333f" />
          </mesh>
        )
      })}
    </group>
  )
}

export default React.memo(Cover)
