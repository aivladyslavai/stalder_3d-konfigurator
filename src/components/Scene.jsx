import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Sky, SoftShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ToneMapping, SMAA } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

import Pool from './Pool'
import Water from './Water'
import Caustics from './Caustics'
import Deck from './Deck'
import Indoor from './Indoor'
import Surroundings from './Surroundings'
import Stairs from './Accessories/Stairs'
import LedStrip from './Accessories/LedStrip'
import Cover from './Accessories/Cover'
import HeatPump from './Accessories/HeatPump'
import CounterCurrent from './Accessories/CounterCurrent'
import Jet from './Accessories/Jets'
import SchwallDusche from './Accessories/SchwallDusche'
import Liege, { Bank } from './Accessories/Liege'
import Robot from './Accessories/Robot'
import { usePoolConfig, getPoolMaterial } from '../hooks/usePoolConfig'
import { visualShapeForSystem, findStair } from '../data/config'
import { resolveSnap } from '../three/placement'

function lighting(scene, time) {
  if (scene === 'indoor') {
    return {
      env: 'apartment',
      envIntensity: 0.55,
      bg: '#11151b',
      sky: false,
      fog: ['#11151b', 22, 55],
      ambient: 0.3,
      sun: { pos: [6, 11, 8], intensity: 0.7, color: '#fff2dc' },
      hemi: 0.25,
    }
  }
  if (time === 'dusk') {
    return {
      env: 'sunset',
      envIntensity: 0.35,
      bg: '#27344a',
      sky: { turbidity: 12, rayleigh: 1.6, sun: [-2, 0.4, -3] },
      fog: ['#27344a', 26, 62],
      ambient: 0.14,
      sun: { pos: [-6, 5, -4], intensity: 0.9, color: '#ffb27a' },
      hemi: 0.2,
    }
  }
  return {
    env: 'sunset',
    envIntensity: 0.5,
    bg: '#cfe3f2',
    sky: { turbidity: 6, rayleigh: 0.45, sun: [6, 4, 3] },
    fog: ['#cfe3f2', 34, 70],
    ambient: 0.22,
    sun: { pos: [9, 13, 7], intensity: 2.0, color: '#fff3e2' },
    hemi: 0.35,
  }
}

function CameraRig({ scene, length, width, topView }) {
  const { camera, controls } = useThree()
  useEffect(() => {
    if (topView) {
      camera.position.set(0.01, Math.max(14, length + 4), 0.01)
      camera.lookAt(0, 0, 0)
    } else if (scene === 'indoor') {
      camera.position.set(length / 2 + 2.5, 3.1, width / 2 + 2.6)
    } else {
      camera.position.set(9, 6, 11)
    }
    if (controls) {
      controls.target.set(0, -0.5, 0)
      controls.update()
    }
  }, [scene, topView, length, width, camera, controls])
  return null
}

function PlacementLayer({ length, width, placing }) {
  const confirmPlacement = usePoolConfig((s) => s.confirmPlacement)
  const [ghost, setGhost] = useState(null)
  const isDeck = placing.place === 'deck'
  const isCorner = placing.place === 'corner'

  const snapPoint = (point) =>
    resolveSnap(placing.place === 'corner' ? 'wall' : placing.place, point.x, point.z, length, width, isCorner)

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, isDeck ? 0.03 : 0.05, 0]}
        renderOrder={20}
        onPointerMove={(e) => {
          e.stopPropagation()
          setGhost(snapPoint(e.point))
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          const snap = snapPoint(e.point)
          confirmPlacement(snap)
        }}
      >
        <planeGeometry args={isDeck ? [length + 8, width + 8] : [Math.max(0.5, length - 0.28), Math.max(0.5, width - 0.28)]} />
        <meshBasicMaterial color="#32B4E6" transparent opacity={0.18} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
      {ghost && (
        <mesh position={[ghost.x, 0.08, ghost.z]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshBasicMaterial color="#32B4E6" transparent opacity={0.85} />
        </mesh>
      )}
    </>
  )
}

function PlacedItems({ placements, depth }) {
  return placements.map((p) => {
    const pos = [p.x, p.kind === 'heatpump' ? 0 : p.kind === 'schwall' ? 0 : -depth / 2, p.z]
    const rot = [0, p.rotY || 0, 0]
    if (p.kind === 'jet') return <Jet key={p.id} position={pos} rotation={rot} />
    if (p.kind === 'schwall') return <SchwallDusche key={p.id} position={[p.x, 0, p.z]} rotation={rot} />
    if (p.kind === 'liege') return <Liege key={p.id} position={[p.x, 0, p.z]} rotation={rot} poolDepth={depth} />
    if (p.kind === 'bank') return <Bank key={p.id} position={[p.x, 0, p.z]} rotation={rot} poolDepth={depth} />
    if (p.kind === 'robot') return <Robot key={p.id} position={[p.x, 0, p.z]} variant={p.variant} poolDepth={depth} />
    if (p.kind === 'countercurrent') return <CounterCurrent key={p.id} position={pos} rotation={rot} poolDepth={depth} />
    if (p.kind === 'heatpump') return <HeatPump key={p.id} position={[p.x, 0, p.z]} rotation={rot} />
    return null
  })
}

export default function Scene() {
  const state = usePoolConfig()
  const {
    type,
    length,
    width,
    depth,
    poolSystem,
    stair,
    stairWall,
    stairCorner,
    options,
    scene,
    timeOfDay,
    deck,
    placements,
    placing,
    topView,
  } = state
  const material = getPoolMaterial(state)
  const shape = visualShapeForSystem(poolSystem)
  const stairItem = findStair(type, stair)
  const acc = { poolLength: length, poolWidth: width, poolDepth: depth }
  const L = lighting(scene, timeOfDay)

  const maxDist = useMemo(() => Math.max(18, length + width + 8), [length, width])

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [9, 6, 11], fov: 40 }}
      gl={{ antialias: false, toneMapping: THREE.NoToneMapping, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[L.bg]} />
      <fog attach="fog" args={L.fog} />

      {L.sky && (
        <Sky turbidity={L.sky.turbidity} rayleigh={L.sky.rayleigh} mieCoefficient={0.005} mieDirectionalG={0.85} sunPosition={L.sky.sun} />
      )}

      <SoftShadows size={26} samples={16} focus={0.6} />
      <ambientLight intensity={L.ambient} />
      <hemisphereLight args={['#dff0ff', '#b8a98c', L.hemi]} />
      <directionalLight
        position={L.sun.pos}
        intensity={L.sun.intensity}
        color={L.sun.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />

      <Suspense fallback={null}>
        <Environment preset={L.env} environmentIntensity={L.envIntensity} />
        <Deck length={length} width={width} shape={shape} deck={deck} />
        {scene === 'indoor' && <Indoor poolLength={length} poolWidth={width} />}
        <Surroundings poolLength={length} poolWidth={width} scene={scene} />
        <Pool length={length} width={width} depth={depth} material={material} shape={shape} />
        {!options.rolladen && <Caustics length={length} width={width} depth={depth} shape={shape} led={options.led} />}
        {!options.rolladen && <Water length={length} width={width} shape={shape} led={options.led} pickable={!placing} />}
        {stairItem.visual && (
          <Stairs type={stairItem.visual} steps={stairItem.steps} wall={stairWall} corner={stairCorner} {...acc} />
        )}
        {options.led && <LedStrip {...acc} />}
        {options.rolladen && <Cover {...acc} />}
        <PlacedItems placements={placements} depth={depth} />
        {placing && <PlacementLayer length={length} width={width} placing={placing} />}
      </Suspense>

      <CameraRig scene={scene} length={length} width={width} topView={topView} />
      <OrbitControls
        makeDefault
        enabled={!placing}
        enablePan={false}
        minDistance={6}
        maxDistance={maxDist}
        maxPolarAngle={topView ? 0.18 : Math.PI / 2.15}
        target={[0, -0.5, 0]}
        enableDamping
        dampingFactor={0.08}
      />

      <EffectComposer multisampling={0}>
        <Bloom
          mipmapBlur
          luminanceThreshold={scene === 'indoor' || timeOfDay === 'dusk' ? 0.7 : 0.9}
          luminanceSmoothing={0.25}
          intensity={scene === 'indoor' || timeOfDay === 'dusk' ? 0.9 : 0.55}
        />
        <SMAA />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.22} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  )
}
