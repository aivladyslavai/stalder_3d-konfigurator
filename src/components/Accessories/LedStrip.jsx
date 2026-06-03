import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * LED-Beleuchtung – Leuchtstreifen entlang beider Längswände nahe der Oberkante
 * sowie zwei PointLights im Becken. Die Farbe durchläuft langsam den Farbkreis
 * (blau → violett → türkis).
 *
 * Props: { poolLength, poolWidth, poolDepth }
 */
function LedStrip({ poolLength, poolWidth, poolDepth }) {
  const matRefs = [useRef(), useRef()]
  const lightRefs = [useRef(), useRef()]
  const halfW = poolWidth / 2

  useFrame(({ clock }) => {
    // Farbton langsam zyklisch (im Bereich blau/türkis/violett)
    const hue = (0.5 + Math.sin(clock.elapsedTime * 0.2) * 0.1) % 1
    const base = new THREE.Color().setHSL(hue, 1, 0.6)
    // HDR-Wert (>1) damit die Streifen über den Bloom-Effekt leuchten
    const glow = base.clone().multiplyScalar(3.2)
    matRefs.forEach((r) => r.current && r.current.color.copy(glow))
    lightRefs.forEach((r) => r.current && r.current.color.copy(base))
  })

  const y = -0.1 // nahe der Oberkante

  return (
    <group>
      {/* Leuchtstreifen an beiden Längswänden */}
      <mesh position={[0, y, halfW - 0.1]}>
        <boxGeometry args={[poolLength, 0.05, 0.05]} />
        <meshBasicMaterial ref={matRefs[0]} color="#00ccff" toneMapped={false} />
      </mesh>
      <mesh position={[0, y, -halfW + 0.1]}>
        <boxGeometry args={[poolLength, 0.05, 0.05]} />
        <meshBasicMaterial ref={matRefs[1]} color="#00ccff" toneMapped={false} />
      </mesh>

      {/* PointLights im Becken */}
      <pointLight
        ref={lightRefs[0]}
        position={[-poolLength / 4, -poolDepth / 2, 0]}
        color="#00aaff"
        intensity={5}
        distance={6}
      />
      <pointLight
        ref={lightRefs[1]}
        position={[poolLength / 4, -poolDepth / 2, 0]}
        color="#00aaff"
        intensity={5}
        distance={6}
      />
    </group>
  )
}

export default React.memo(LedStrip)
