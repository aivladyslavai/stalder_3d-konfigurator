import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Sky, SoftShadows } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
  SMAA,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

import Pool from './Pool'
import Water from './Water'
import Caustics from './Caustics'
import Deck from './Deck'
import Surroundings from './Surroundings'
import Stairs from './Accessories/Stairs'
import LedStrip from './Accessories/LedStrip'
import Cover from './Accessories/Cover'
import Jets from './Accessories/Jets'
import HeatPump from './Accessories/HeatPump'
import CounterCurrent from './Accessories/CounterCurrent'
import { usePoolConfig, getPoolMaterial } from '../hooks/usePoolConfig'

/**
 * Foto-realistische Live-3D-Vorschau des konfigurierten Pools.
 */
export default function Scene() {
  const state = usePoolConfig()
  const { length, width, depth, shape, stair, options } = state
  const material = getPoolMaterial(state)
  const acc = { poolLength: length, poolWidth: width, poolDepth: depth }

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [7.5, 5, 9.5], fov: 40 }}
      gl={{
        antialias: false,
        toneMapping: THREE.NoToneMapping,
        powerPreference: 'high-performance',
      }}
    >
      <color attach="background" args={['#cfe3f2']} />
      <fog attach="fog" args={['#cfe3f2', 34, 70]} />

      <Sky turbidity={6} rayleigh={0.45} mieCoefficient={0.005} mieDirectionalG={0.85} sunPosition={[6, 4, 3]} />

      {/* Weiche Schatten (PCSS) */}
      <SoftShadows size={26} samples={16} focus={0.6} />

      <ambientLight intensity={0.22} />
      <hemisphereLight args={['#dff0ff', '#b8a98c', 0.35]} />
      <directionalLight
        position={[9, 13, 7]}
        intensity={2.0}
        color="#fff3e2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      <directionalLight position={[-8, 5, -6]} intensity={0.4} color="#bcd6ff" />

      <Suspense fallback={null}>
        <Environment preset="sunset" environmentIntensity={0.5} />

        <Deck length={length} width={width} shape={shape} />
        <Surroundings poolLength={length} poolWidth={width} />
        <Pool length={length} width={width} depth={depth} material={material} shape={shape} />
        {!options.cover && <Caustics length={length} width={width} depth={depth} shape={shape} led={options.led} />}
        {!options.cover && <Water length={length} width={width} shape={shape} led={options.led} />}
        <Stairs type={stair} {...acc} />

        {options.led && <LedStrip {...acc} />}
        {options.cover && <Cover {...acc} />}
        {options.jets && <Jets {...acc} />}
        {options.heatpump && <HeatPump {...acc} />}
        {options.countercurrent && <CounterCurrent {...acc} />}
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={24}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, -0.5, 0]}
        enableDamping
        dampingFactor={0.08}
      />

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.25} intensity={0.55} />
        <SMAA />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.22} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  )
}
