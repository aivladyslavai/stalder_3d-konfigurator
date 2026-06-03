import React from 'react'
import * as THREE from 'three'

/**
 * Innenraum-Variante: moderner Pool-Pavillon. Zwei massive Wände (Putz),
 * zwei Glasfronten mit Sprossen, Decke mit eingelassenen warmen Spots.
 * Vermittelt „Pool im Gebäude“.
 *
 * Props: { poolLength, poolWidth }
 */
function Indoor({ poolLength, poolWidth }) {
  const rx = poolLength / 2 + 4
  const rz = poolWidth / 2 + 4
  const H = 3.6

  const plaster = <meshStandardMaterial color="#ece8e1" roughness={0.95} metalness={0} />
  const glass = (
    <meshStandardMaterial
      color="#cfe0e6"
      transparent
      opacity={0.16}
      roughness={0.04}
      metalness={0.1}
      side={THREE.DoubleSide}
      envMapIntensity={1.4}
    />
  )
  const frame = <meshStandardMaterial color="#3a3f44" roughness={0.4} metalness={0.6} />

  // Sprossen für eine Glasfront (vertikale Pfosten)
  const mullions = (axis, count, span, fixed) => {
    const items = []
    for (let i = 0; i <= count; i++) {
      const p = -span / 2 + (span / count) * i
      items.push(p)
    }
    return items
  }

  return (
    <group>
      {/* Boden-Reflexionshilfe entfällt – Deck dient als Raumboden */}

      {/* Massive Wände: hinten (z-) und links (x-) */}
      <mesh position={[0, H / 2, -rz]} receiveShadow castShadow>
        <boxGeometry args={[rx * 2 + 0.4, H, 0.2]} />
        {plaster}
      </mesh>
      <mesh position={[-rx, H / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.2, H, rz * 2 + 0.4]} />
        {plaster}
      </mesh>

      {/* Decke */}
      <mesh position={[0, H, 0]} receiveShadow>
        <boxGeometry args={[rx * 2 + 0.4, 0.2, rz * 2 + 0.4]} />
        <meshStandardMaterial color="#e6e3dd" roughness={0.9} />
      </mesh>

      {/* Glasfront vorne (z+) */}
      <mesh position={[0, H / 2, rz]}>
        <boxGeometry args={[rx * 2, H, 0.04]} />
        {glass}
      </mesh>
      {/* Glasfront rechts (x+) */}
      <mesh position={[rx, H / 2, 0]}>
        <boxGeometry args={[0.04, H, rz * 2]} />
        {glass}
      </mesh>

      {/* Rahmen / Sprossen der vorderen Glasfront */}
      {mullions('x', Math.max(3, Math.round((rx * 2) / 1.6)), rx * 2).map((x, i) => (
        <mesh key={`fx${i}`} position={[x, H / 2, rz]}>
          <boxGeometry args={[0.06, H, 0.08]} />
          {frame}
        </mesh>
      ))}
      {mullions('z', Math.max(3, Math.round((rz * 2) / 1.6)), rz * 2).map((z, i) => (
        <mesh key={`rz${i}`} position={[rx, H / 2, z]}>
          <boxGeometry args={[0.08, H, 0.06]} />
          {frame}
        </mesh>
      ))}
      {/* obere/untere Rahmenkante */}
      <mesh position={[0, H - 0.05, rz]}>
        <boxGeometry args={[rx * 2, 0.1, 0.1]} />
        {frame}
      </mesh>
      <mesh position={[rx, H - 0.05, 0]}>
        <boxGeometry args={[0.1, 0.1, rz * 2]} />
        {frame}
      </mesh>

      {/* Decken-Spots (leuchtend) + warmes Licht */}
      {[-poolLength / 3, 0, poolLength / 3].map((x, i) => (
        <group key={`spot${i}`} position={[x, H - 0.12, poolWidth / 2 + 1.2]}>
          <mesh>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
            <meshBasicMaterial color="#fff1d8" toneMapped={false} />
          </mesh>
          <pointLight position={[0, -0.3, 0]} color="#ffe7c4" intensity={6} distance={9} decay={2} />
        </group>
      ))}
      {/* indirektes Grundlicht */}
      <pointLight position={[0, H - 0.5, -rz + 1]} color="#fff0d8" intensity={4} distance={14} />
    </group>
  )
}

export default React.memo(Indoor)
