import React from 'react'

/**
 * Dekorative Umgebung auf der Terrasse: Sonnenliegen und Pflanzkübel.
 * Verleiht der Szene Massstab und Lifestyle-Charakter (wie in Referenz-Renderings).
 *
 * Props: { poolLength, poolWidth }
 */

// Moderne Sonnenliege (Rahmen + Auflage + leicht geneigte Rückenlehne)
function Lounger({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Rahmen / Beine */}
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.1, 1.95]} />
        <meshStandardMaterial color="#5b5f63" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Sitzauflage */}
      <mesh position={[0, 0.24, 0.25]} castShadow receiveShadow>
        <boxGeometry args={[0.66, 0.12, 1.35]} />
        <meshStandardMaterial color="#dcdcd6" roughness={0.85} />
      </mesh>
      {/* Rückenlehne (geneigt) */}
      <mesh position={[0, 0.42, -0.72]} rotation={[-0.62, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.66, 0.12, 0.78]} />
        <meshStandardMaterial color="#dcdcd6" roughness={0.85} />
      </mesh>
    </group>
  )
}

// Pflanzkübel mit kugeliger Bepflanzung
function Planter({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#9a9389" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#46603a" roughness={1} flatShading />
      </mesh>
      <mesh position={[0.15, 1.25, 0.1]} castShadow>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial color="#526e44" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

function Surroundings({ poolLength, poolWidth, scene = 'outdoor' }) {
  const hl = poolLength / 2
  const hw = poolWidth / 2
  const indoor = scene === 'indoor'

  return (
    <group>
      {/* Sonnenliegen nur im Aussenbereich */}
      {!indoor && (
        <>
          <Lounger position={[-hl - 2.6, 0, -0.6]} rotation={Math.PI / 2} />
          <Lounger position={[-hl - 2.6, 0, 1.4]} rotation={Math.PI / 2} />
        </>
      )}

      {/* Pflanzkübel (beide Szenen) – innen näher ans Becken gerückt */}
      <Planter position={[hl + 1.4, 0, -hw - 1.4]} scale={indoor ? 1.0 : 1.1} />
      <Planter position={[-hl - 1.3, 0, -hw - 1.5]} scale={0.9} />
      {!indoor && <Planter position={[hl + 2.4, 0, hw + 1.2]} scale={1.0} />}
      {indoor && <Planter position={[hl + 1.6, 0, hw + 1.4]} scale={1.15} />}
    </group>
  )
}

export default React.memo(Surroundings)
