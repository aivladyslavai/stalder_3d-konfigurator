import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function makeCloudTexture() {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, size, size)

  const blobs = [
    [0.5, 0.58, 0.34],
    [0.32, 0.55, 0.26],
    [0.68, 0.54, 0.27],
    [0.42, 0.42, 0.22],
    [0.6, 0.4, 0.2],
    [0.5, 0.36, 0.16],
  ]
  blobs.forEach(([ux, uy, r]) => {
    const x = ux * size
    const y = uy * size
    const rad = r * size
    const g = ctx.createRadialGradient(x, y, rad * 0.12, x, y, rad)
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.45, 'rgba(245,250,255,0.55)')
    g.addColorStop(1, 'rgba(230,240,250,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, Math.PI * 2)
    ctx.fill()
  })

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

const CLUSTERS = [
  { p: [2, 17.5, -24], s: 20, o: 0.92 },
  { p: [-13, 16.2, -20], s: 15, o: 0.84 },
  { p: [16, 16.8, -18], s: 16, o: 0.86 },
  { p: [-20, 15.5, -2], s: 13, o: 0.76 },
  { p: [20, 15.8, 6], s: 12, o: 0.72 },
]

function DayClouds({ dusk = false }) {
  const texture = useMemo(makeCloudTexture, [])
  const puffs = useRef()
  useEffect(() => () => texture.dispose(), [texture])

  useFrame(({ camera }) => {
    const g = puffs.current
    if (!g) return
    g.children.forEach((child) => {
      child.quaternion.copy(camera.quaternion)
    })
  })

  return (
    <group>
      <mesh renderOrder={-20} frustumCulled={false}>
        <sphereGeometry args={[85, 16, 12]} />
        <meshBasicMaterial
          color={dusk ? '#243044' : '#5aa3d4'}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
      <group ref={puffs}>
        {CLUSTERS.map((c, i) => (
          <mesh key={i} position={c.p} renderOrder={-2} frustumCulled={false}>
            <planeGeometry args={[c.s, c.s * 0.52]} />
            <meshBasicMaterial
              map={texture}
              color={dusk ? '#d2b8a4' : '#ffffff'}
              transparent
              opacity={dusk ? c.o * 0.55 : c.o}
              depthWrite={false}
              fog={false}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export default React.memo(DayClouds)
