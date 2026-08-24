import React, { Suspense, useEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Sky, SoftShadows, ContactShadows } from '@react-three/drei'
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
import PlacementLayer from './PlacementLayer'
import { usePoolConfig, getPoolMaterial } from '../hooks/usePoolConfig'
import { visualShapeForSystem, findStair } from '../data/config'

function lighting(scene, time) {
  if (scene === 'indoor') {
    return {
      env: 'apartment',
      envIntensity: 0.7,
      bg: '#121821',
      sky: false,
      fog: ['#121821', 20, 50],
      ambient: 0.28,
      sun: { pos: [6, 11, 8], intensity: 0.85, color: '#fff2dc' },
      hemi: 0.28,
      night: true,
    }
  }
  if (time === 'dusk') {
    return {
      env: 'night',
      envIntensity: 0.28,
      bg: '#0b121c',
      sky: { turbidity: 10, rayleigh: 2.4, sun: [-4, 0.12, -3] },
      fog: ['#0b121c', 16, 46],
      ambient: 0.07,
      sun: { pos: [-9, 2.2, -5], intensity: 0.28, color: '#ff8a4a' },
      hemi: 0.1,
      night: true,
    }
  }
  return {
    env: 'park',
    envIntensity: 0.85,
    bg: '#b7d2e6',
    sky: { turbidity: 3.5, rayleigh: 0.55, sun: [9, 7, 4] },
    fog: ['#c4dceb', 42, 95],
    ambient: 0.3,
    sun: { pos: [11, 17, 8], intensity: 2.55, color: '#fff5e6' },
    hemi: 0.42,
    night: false,
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
  const placingStairs = placing?.kind === 'stair'
  const night = !!L.night
  const ledOn = !!options.led

  const maxDist = useMemo(() => Math.max(18, length + width + 8), [length, width])
  const bloomIntensity = night ? (ledOn ? 1.35 : 0.75) : 0.5
  const bloomThreshold = night ? (ledOn ? 0.45 : 0.7) : 0.92

  return (
    <Canvas
      shadows={!placing}
      dpr={[1, placing ? 1.25 : 2]}
      camera={{ position: [9, 6, 11], fov: 40 }}
      gl={{ antialias: false, toneMapping: THREE.NoToneMapping, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[L.bg]} />
      <fog attach="fog" args={L.fog} />

      {L.sky && (
        <Sky turbidity={L.sky.turbidity} rayleigh={L.sky.rayleigh} mieCoefficient={0.005} mieDirectionalG={0.85} sunPosition={L.sky.sun} />
      )}

      {!placing && <SoftShadows size={22} samples={14} focus={0.65} />}
      <ambientLight intensity={L.ambient} />
      <hemisphereLight args={[night ? '#1a2a44' : '#dff0ff', night ? '#1a1510' : '#b8a98c', L.hemi]} />
      <directionalLight
        position={L.sun.pos}
        intensity={L.sun.intensity}
        color={L.sun.color}
        castShadow={!placing}
        shadow-mapSize-width={placing ? 1024 : 2048}
        shadow-mapSize-height={placing ? 1024 : 2048}
        shadow-bias={-0.0002}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={50}
      />
      {!night && (
        <directionalLight position={[-8, 6, -6]} intensity={0.35} color="#a8c8e8" />
      )}

      <Suspense fallback={null}>
        <Environment preset={L.env} environmentIntensity={L.envIntensity} background={false} />
        <Deck length={length} width={width} shape={shape} deck={deck} />
        {scene === 'indoor' && <Indoor poolLength={length} poolWidth={width} />}
        <Surroundings poolLength={length} poolWidth={width} scene={scene} />
        <Pool length={length} width={width} depth={depth} material={material} shape={shape} />
        {!options.rolladen && !placing && (
          <Caustics length={length} width={width} depth={depth} shape={shape} led={ledOn} night={night} />
        )}
        {!options.rolladen && (
          <Water length={length} width={width} shape={shape} led={ledOn} night={night} pickable={!placing} />
        )}
        {stairItem.visual && !placingStairs && (
          <Stairs type={stairItem.visual} steps={stairItem.steps} wall={stairWall} corner={stairCorner} {...acc} />
        )}
        {ledOn && <LedStrip {...acc} night={night} />}
        {options.rolladen && <Cover {...acc} />}
        <PlacedItems placements={placements} depth={depth} />
        {placing && (
          <PlacementLayer
            length={length}
            width={width}
            depth={depth}
            placing={placing}
            stairWall={stairWall}
            stairCorner={stairCorner}
          />
        )}
        {!placing && scene === 'outdoor' && (
          <ContactShadows
            position={[0, -0.12, 0]}
            opacity={night ? 0.35 : 0.55}
            scale={Math.max(18, length + 12)}
            blur={2.4}
            far={8}
          />
        )}
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

      <EffectComposer multisampling={0} enabled={!placing}>
        <Bloom mipmapBlur luminanceThreshold={bloomThreshold} luminanceSmoothing={0.28} intensity={bloomIntensity} />
        <SMAA />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.2} darkness={night ? 0.65 : 0.45} />
      </EffectComposer>
    </Canvas>
  )
}
