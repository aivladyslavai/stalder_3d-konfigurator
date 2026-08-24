import React, { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { makeGrassTexture } from '../three/textures'

function Lounger({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.06, 1.95]} />
        <meshPhysicalMaterial color="#4a5056" roughness={0.35} metalness={0.65} />
      </mesh>
      {[-0.28, 0.28].flatMap((x) =>
        [-0.8, 0.8].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.06, z]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.12, 10]} />
            <meshStandardMaterial color="#3a3f44" metalness={0.7} roughness={0.4} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.22, 0.22]} castShadow receiveShadow>
        <boxGeometry args={[0.64, 0.1, 1.3]} />
        <meshStandardMaterial color="#eceae3" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.4, -0.7]} rotation={[-0.58, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.64, 0.1, 0.72]} />
        <meshStandardMaterial color="#eceae3" roughness={0.88} />
      </mesh>
    </group>
  )
}

function Planter({ position, scale = 1, tone = '#4d6a3e' }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.55, 16]} />
        <meshStandardMaterial color="#8f877c" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.48, 18, 14]} />
        <meshStandardMaterial color={tone} roughness={0.95} />
      </mesh>
      <mesh position={[0.18, 1.1, 0.12]} castShadow>
        <sphereGeometry args={[0.28, 14, 12]} />
        <meshStandardMaterial color="#5a7a48" roughness={0.95} />
      </mesh>
      <mesh position={[-0.16, 1.05, -0.1]} castShadow>
        <sphereGeometry args={[0.22, 14, 12]} />
        <meshStandardMaterial color="#3f5c34" roughness={0.95} />
      </mesh>
    </group>
  )
}

function Hedge({ position, rotation = 0, length = 4, height = 1.6 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, height, 0.55]} />
        <meshStandardMaterial color="#3f5c34" roughness={1} />
      </mesh>
      <mesh position={[0, height * 0.92, 0]} castShadow>
        <boxGeometry args={[length * 0.98, height * 0.22, 0.62]} />
        <meshStandardMaterial color="#4d6e40" roughness={1} />
      </mesh>
    </group>
  )
}

function Cypress({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        <meshStandardMaterial color="#5a4332" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[0.55, 2.4, 10]} />
        <meshStandardMaterial color="#355338" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[0.35, 1.4, 10]} />
        <meshStandardMaterial color="#426643" roughness={0.95} />
      </mesh>
    </group>
  )
}

function Umbrella({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 2.3, 10]} />
        <meshStandardMaterial color="#d8d4cc" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.25, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[1.35, 0.45, 16, 1, true]} />
        <meshStandardMaterial color="#f2f0ea" side={THREE.DoubleSide} roughness={0.85} />
      </mesh>
    </group>
  )
}

function DistantHills() {
  return (
    <group>
      <mesh position={[-18, 2.2, -28]} rotation={[0, 0.2, 0]}>
        <sphereGeometry args={[8, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7a8f78" roughness={1} flatShading />
      </mesh>
      <mesh position={[6, 3.5, -32]} rotation={[0, -0.15, 0]}>
        <sphereGeometry args={[11, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#6b7f6a" roughness={1} flatShading />
      </mesh>
      <mesh position={[22, 1.8, -26]}>
        <sphereGeometry args={[7, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#879987" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

function GrassGround() {
  const map = useMemo(() => {
    const tex = makeGrassTexture(512)
    tex.repeat.set(18, 18)
    return tex
  }, [])

  useEffect(() => () => map.dispose(), [map])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, 0]} receiveShadow>
      <planeGeometry args={[70, 70]} />
      <meshStandardMaterial map={map} color="#7a9a62" roughness={0.95} />
    </mesh>
  )
}

function Surroundings({ poolLength, poolWidth, scene = 'outdoor' }) {
  const hl = poolLength / 2
  const hw = poolWidth / 2
  const indoor = scene === 'indoor'

  return (
    <group>
      {!indoor && (
        <>
          <GrassGround />
          <DistantHills />
          <Hedge position={[0, 0, -hw - 5.2]} length={poolLength + 10} height={1.7} />
          <Hedge position={[-hl - 5.5, 0, 0]} rotation={Math.PI / 2} length={poolWidth + 8} height={1.55} />
          <Hedge position={[hl + 6.2, 0, 1]} rotation={Math.PI / 2} length={poolWidth + 6} height={1.45} />

          <Lounger position={[-hl - 2.8, 0, -0.5]} rotation={Math.PI / 2} />
          <Lounger position={[-hl - 2.8, 0, 1.5]} rotation={Math.PI / 2} />
          <Umbrella position={[-hl - 3.5, 0, 0.5]} />

          <Cypress position={[-hl - 4.8, 0, -hw - 3.2]} scale={1.15} />
          <Cypress position={[hl + 4.6, 0, -hw - 3.4]} scale={1.05} />
          <Cypress position={[hl + 5.4, 0, hw + 2.8]} scale={0.9} />
        </>
      )}

      <Planter position={[hl + 1.5, 0, -hw - 1.5]} scale={indoor ? 1.0 : 1.15} />
      <Planter position={[-hl - 1.4, 0, -hw - 1.6]} scale={0.95} tone="#3f5c34" />
      {!indoor && <Planter position={[hl + 2.6, 0, hw + 1.35]} scale={1.05} tone="#526e44" />}
      {!indoor && <Planter position={[-hl - 2.2, 0, hw + 1.6]} scale={0.85} />}
      {indoor && <Planter position={[hl + 1.6, 0, hw + 1.4]} scale={1.15} />}
    </group>
  )
}

export default React.memo(Surroundings)
