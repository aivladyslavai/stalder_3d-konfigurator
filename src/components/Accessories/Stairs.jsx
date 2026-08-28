import React from 'react'
import { WALL_THICKNESS } from '../../data/config'

const steel = <meshPhysicalMaterial color="#e8eef2" metalness={0.94} roughness={0.16} envMapIntensity={1.9} />
const polished = <meshPhysicalMaterial color="#f4f7f9" metalness={0.98} roughness={0.07} envMapIntensity={2.2} clearcoat={0.55} clearcoatRoughness={0.08} />

const WALL_POSE = {
  west: (L, W, t) => ({ position: [-L / 2 + t, 0, 0], rotation: [0, 0, 0] }),
  east: (L, W, t) => ({ position: [L / 2 - t, 0, 0], rotation: [0, Math.PI, 0] }),
  north: (L, W, t) => ({ position: [0, 0, -W / 2 + t], rotation: [0, -Math.PI / 2, 0] }),
  south: (L, W, t) => ({ position: [0, 0, W / 2 - t], rotation: [0, Math.PI / 2, 0] }),
}

const CORNER_ROT = { nw: 0, ne: -Math.PI / 2, se: Math.PI, sw: Math.PI / 2 }

function Stairs({ type, poolLength, poolWidth, poolDepth, steps = 4, wall = 'west', corner = 'nw' }) {
  const t = WALL_THICKNESS
  const N = steps
  const stepH = poolDepth / N
  const tread = 0.32

  if (type === 'Ecktreppe') {
    const x0 = -poolLength / 2 + t
    const z0 = -poolWidth / 2 + t
    return (
      <group rotation={[0, CORNER_ROT[corner] || 0, 0]}>
        {Array.from({ length: N }).map((_, i) => {
          const ext = (N - i) * tread
          const y = -poolDepth + (i + 0.5) * stepH
          return (
            <mesh key={i} position={[x0 + ext / 2, y, z0 + ext / 2]} castShadow receiveShadow>
              <boxGeometry args={[ext, stepH, ext]} />
              {steel}
            </mesh>
          )
        })}
      </group>
    )
  }

  const pose = (WALL_POSE[wall] || WALL_POSE.west)(poolLength, poolWidth, t)
  const span = wall === 'west' || wall === 'east' ? poolWidth - t * 2 : poolLength - t * 2

  if (type === 'Breitstufentreppe') {
    return (
      <group position={pose.position} rotation={pose.rotation}>
        {Array.from({ length: N }).map((_, i) => {
          const ext = (N - i) * tread
          const y = -poolDepth + (i + 0.5) * stepH
          return (
            <mesh key={i} position={[ext / 2, y, 0]} castShadow receiveShadow>
              <boxGeometry args={[ext, stepH, span]} />
              {steel}
            </mesh>
          )
        })}
      </group>
    )
  }

  const w = Math.min(1.3, span)
  const protr = 0.5
  return (
    <group position={pose.position} rotation={pose.rotation}>
      {Array.from({ length: N }).map((_, i) => {
        const y = -poolDepth + (i + 1) * stepH
        return (
          <mesh key={i} position={[protr / 2, y - 0.03, -span / 2 + w / 2]} castShadow receiveShadow>
            <boxGeometry args={[protr, 0.06, w]} />
            {polished}
          </mesh>
        )
      })}
    </group>
  )
}

export default React.memo(Stairs)
