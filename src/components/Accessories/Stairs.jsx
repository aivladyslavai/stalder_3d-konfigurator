import React from 'react'
import { WALL_THICKNESS } from '../../data/config'

/**
 * Treppe im Becken – drei Varianten, jeweils korrekt auf dem Beckenboden stehend:
 *  - Ecktreppe:         quadratische Stufen in einer Ecke (unten breit, oben schmal)
 *  - Breitstufentreppe: über die ganze Beckenbreite verlaufende Stufen
 *  - Schwebetreppe:     filigrane, freitragende Stufen an der Wand (Design-Optik)
 *
 * Aufbau-Prinzip (Eck/Breit): N Stufen à Höhe stepH, von unten nach oben gestapelt.
 * Jede Stufe ruht auf der darunterliegenden – nichts schwebt. Die oberste Stufe
 * schliesst bündig mit der Wasseroberkante (y = 0) ab.
 *
 * Props: { type, poolLength, poolWidth, poolDepth }
 */
function Stairs({ type, poolLength, poolWidth, poolDepth }) {
  const t = WALL_THICKNESS
  const N = 4
  const stepH = poolDepth / N
  const tread = 0.32 // Auftrittstiefe pro Stufe
  const steel = ['#d2d5d8', 0.55, 0.35] // color, metalness, roughness
  const mat = <meshStandardMaterial color={steel[0]} metalness={steel[1]} roughness={steel[2]} />

  const x0 = -poolLength / 2 + t // linke kurze Wand
  const z0 = -poolWidth / 2 + t // hintere Längswand (für Ecktreppe)

  if (type === 'Breitstufentreppe') {
    const w = poolWidth - t * 2
    return (
      <group>
        {Array.from({ length: N }).map((_, i) => {
          // i = 0 unten (breit) … i = N-1 oben (schmal, an der Wand)
          const ext = (N - i) * tread
          const y = -poolDepth + (i + 0.5) * stepH
          return (
            <mesh key={i} position={[x0 + ext / 2, y, 0]} castShadow receiveShadow>
              <boxGeometry args={[ext, stepH, w]} />
              {mat}
            </mesh>
          )
        })}
      </group>
    )
  }

  if (type === 'Schwebetreppe') {
    // Freitragende, dünne Stufen an der Wand – bewusst „schwebende“ Optik
    const w = Math.min(1.3, poolWidth - t * 2)
    const z = -poolWidth / 2 + t + w / 2
    const protr = 0.5
    const polished = (
      <meshStandardMaterial color="#e9ecee" metalness={0.95} roughness={0.12} />
    )
    return (
      <group>
        {Array.from({ length: N }).map((_, i) => {
          const y = -poolDepth + (i + 1) * stepH // Oberkante der Stufe
          return (
            <mesh key={i} position={[x0 + protr / 2, y - 0.03, z]} castShadow receiveShadow>
              <boxGeometry args={[protr, 0.06, w]} />
              {polished}
            </mesh>
          )
        })}
      </group>
    )
  }

  // Ecktreppe (Standard) – quadratische Stufen in der hinteren linken Ecke
  return (
    <group>
      {Array.from({ length: N }).map((_, i) => {
        // i = 0 unten (grösste Grundfläche) … i = N-1 oben (kleinste, in der Ecke)
        const ext = (N - i) * tread
        const y = -poolDepth + (i + 0.5) * stepH
        return (
          <mesh key={i} position={[x0 + ext / 2, y, z0 + ext / 2]} castShadow receiveShadow>
            <boxGeometry args={[ext, stepH, ext]} />
            {mat}
          </mesh>
        )
      })}
    </group>
  )
}

export default React.memo(Stairs)
