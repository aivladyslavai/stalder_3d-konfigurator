import React, { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { GltfProp } from './GltfProp'
import { FLOAT_LAYER, registerFloatGroup } from '../three/layers'

/**
 * Möblierung der Terrasse plus die mitgelieferten GLB-Pflanzen und der Schwimmring.
 *
 * Props: { poolLength, poolWidth, scene, waterY, showFloat, rolladen }
 */

const FABRIC = { color: '#e8e3d8', roughness: 0.94 }
const FRAME = { color: '#5c6166', roughness: 0.5, metalness: 0.45 }

function Lounger({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.06, 1.9]} />
        <meshStandardMaterial {...FRAME} />
      </mesh>
      {[-0.29, 0.29].map((x) =>
        [-0.78, 0.78].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.09, z]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.18, 10]} />
            <meshStandardMaterial {...FRAME} />
          </mesh>
        )),
      )}
      <RoundedBox args={[0.68, 0.14, 1.3]} radius={0.06} smoothness={3} position={[0, 0.27, 0.28]} castShadow receiveShadow>
        <meshStandardMaterial {...FABRIC} />
      </RoundedBox>
      <RoundedBox
        args={[0.68, 0.13, 0.82]}
        radius={0.055}
        smoothness={3}
        position={[0, 0.45, -0.7]}
        rotation={[-0.62, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...FABRIC} />
      </RoundedBox>
      <RoundedBox
        args={[0.36, 0.11, 0.26]}
        radius={0.05}
        smoothness={3}
        position={[0, 0.58, -0.5]}
        rotation={[-0.62, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color="#dfe3e5" roughness={0.9} />
      </RoundedBox>
    </group>
  )
}

function SideTable({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 28]} />
        <meshStandardMaterial color="#8d9297" roughness={0.45} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.19, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.38, 16]} />
        <meshStandardMaterial color="#6f757a" roughness={0.5} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <cylinderGeometry args={[0.19, 0.21, 0.03, 20]} />
        <meshStandardMaterial color="#5c6166" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  )
}

function FloatingSwan({ position, rotationY, height }) {
  const ref = useRef()
  const baseY = position[1]
  const x = position[0]
  const z = position[2]

  useLayoutEffect(() => {
    const g = ref.current
    if (!g) return
    g.userData.waterFloat = true
    g.traverse((o) => o.layers.set(FLOAT_LAYER))
    return registerFloatGroup(g)
  }, [])

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    const heave = Math.sin(t * 0.85 + x * 0.7) * 0.03 + Math.sin(t * 1.33 + z) * 0.014
    g.position.y = baseY + heave
    g.rotation.x = Math.sin(t * 0.62 + z) * 0.1 + Math.sin(t * 1.21) * 0.035
    g.rotation.z = Math.cos(t * 0.54 + x) * 0.09 + Math.sin(t * 0.97) * 0.03
    g.rotation.y = rotationY + Math.sin(t * 0.22) * 0.08
  })

  return (
    <group ref={ref} position={position} rotation={[0, rotationY, 0]} renderOrder={8}>
      <GltfProp url="/models/float.glb" height={height} sink={0.02} vinyl layer={FLOAT_LAYER} castShadow={false} />
    </group>
  )
}

function Surroundings({ poolLength, poolWidth, scene = 'outdoor', waterY = -0.17, showFloat = true, rolladen = false }) {
  const hl = poolLength / 2
  const hw = poolWidth / 2
  const indoor = scene === 'indoor'

  return (
    <group>
      {indoor ? (
        <>
          <Lounger position={[-hl - 1.9, 0, -1.05]} rotation={Math.PI / 2} />
          <Lounger position={[-hl - 1.9, 0, 1.05]} rotation={Math.PI / 2} />
        </>
      ) : (
        <>
          <GltfProp
            url="/models/beach-chair-2.glb"
            height={2.08}
            position={[-hl - 2.15, 0, -1.55]}
            rotation={[0, Math.PI / 2, 0]}
          />
          <GltfProp
            url="/models/beach-chair-2.glb"
            height={2.08}
            position={[-hl - 2.15, 0, 1.55]}
            rotation={[0, Math.PI / 2, 0]}
          />
        </>
      )}
      <SideTable position={[-hl - 1.9, 0, 0]} />

      {!indoor && (
        <>
          <GltfProp
            url="/models/cooler.glb"
            height={0.58}
            position={[-hl - 0.82, 0, -1.38]}
            rotation={[0, 1.35, 0]}
          />

          <GltfProp
            url="/models/plants.glb"
            xz={3.4}
            position={[-12.4, 0, -6.15]}
            rotation={[0, 0.35, 0]}
            hideDomes
            foliage
          />
          <GltfProp url="/models/tropical.glb" foliage xz={1.7} position={[-10.6, 0, -5.8]} rotation={[0, -0.4, 0]} />
          <GltfProp url="/models/tropical.glb" foliage xz={1.45} position={[-13.1, 0, -2.4]} rotation={[0, 0.85, 0]} />
          <GltfProp url="/models/tropical.glb" foliage xz={1.6} position={[-11.2, 0, 2.35]} rotation={[0, -1.1, 0]} />
          <GltfProp url="/models/tropical.glb" foliage xz={1.35} position={[-9.7, 0, 3.7]} rotation={[0, 0.3, 0]} />
          <GltfProp url="/models/tropical.glb" foliage xz={1.5} position={[12.2, 0, -5.4]} rotation={[0, 0.5, 0]} />
          <GltfProp url="/models/lotus-pink.glb" foliage height={0.72} sink={0.07} position={[-10.9, 0, -6.6]} rotation={[0, 0.2, 0]} />
          <GltfProp url="/models/lotus-white.glb" foliage height={0.66} sink={0.06} position={[-12.6, 0, -4.5]} rotation={[0, 0.85, 0]} />
          <GltfProp url="/models/lotus-pink.glb" foliage height={0.58} sink={0.07} position={[-11.5, 0, -2.15]} rotation={[0, 1.25, 0]} />
          <GltfProp url="/models/lotus-white.glb" foliage height={0.7} sink={0.06} position={[-13.4, 0, 0.4]} rotation={[0, -0.35, 0]} />
          <GltfProp url="/models/lotus-pink.glb" foliage height={0.6} sink={0.07} position={[-10.4, 0, 2.9]} rotation={[0, 0.7, 0]} />
          <GltfProp url="/models/lotus-white.glb" foliage height={0.64} sink={0.06} position={[-9.55, 0, 4.15]} rotation={[0, 1.1, 0]} />
          <GltfProp url="/models/lotus-white.glb" foliage height={0.55} sink={0.06} position={[11.8, 0, -6.2]} rotation={[0, 0.25, 0]} />
          <GltfProp url="/models/lotus-pink.glb" foliage height={0.62} sink={0.07} position={[13.0, 0, -3.6]} rotation={[0, -0.6, 0]} />
        </>
      )}

      <GltfProp
        url="/models/flipflops.glb"
        height={0.05}
        position={[-hl - 1.55, 0, 2.2]}
        rotation={[0, 0.7, 0]}
      />
      <group position={[-hl - 1.9, 0.4, 0]}>
        <GltfProp url="/models/cocktail.glb" height={0.21} rotation={[0, 0.35, 0]} />
      </group>

      {/* Pothos: kleineres Topfmodell auf der Terrasse */}
      <GltfProp url="/models/pothos.glb" height={0.95} position={[hl + 1.45, 0, -hw - 1.25]} rotation={[0, 0.4, 0]} />
      <GltfProp
        url="/models/pothos.glb"
        height={indoor ? 1.05 : 0.88}
        position={[-hl - 1.15, 0, hw + 1.85]}
        rotation={[0, -0.7, 0]}
        scale={indoor ? 1 : 0.95}
      />

      {/* Rhizom-Pflanze: grösserer Kübel */}
      <GltfProp url="/models/rhizome.glb" height={indoor ? 1.15 : 1.25} position={[hl + 1.35, 0, hw + 1.35]} rotation={[0, 0.9, 0]} />
      {indoor && (
        <GltfProp url="/models/rhizome.glb" height={1.1} position={[-hl - 1.55, 0, -hw - 1.45]} rotation={[0, 2.1, 0]} />
      )}

      {showFloat && (
        <FloatingSwan
          position={[poolLength * (rolladen ? -0.22 : 0.18), waterY, poolWidth * 0.16]}
          rotationY={-0.6}
          height={0.62}
        />
      )}
    </group>
  )
}

export default React.memo(Surroundings)
