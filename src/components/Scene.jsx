import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
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
import Jets from './Accessories/Jets'
import HeatPump from './Accessories/HeatPump'
import CounterCurrent from './Accessories/CounterCurrent'
import { usePoolConfig, getPoolMaterial } from '../hooks/usePoolConfig'

// Beleuchtungs-/Umgebungs-Presets je Szene & Tageszeit
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
  // outdoor / day
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

/**
 * Foto-realistische Live-3D-Vorschau – Aussen-/Innen-Szene, wählbarer Bodenbelag.
 */
export default function Scene() {
  const state = usePoolConfig()
  const { length, width, depth, shape, stair, options, scene, timeOfDay, deck } = state
  const material = getPoolMaterial(state)
  const acc = { poolLength: length, poolWidth: width, poolDepth: depth }
  const L = lighting(scene, timeOfDay)

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
        <Bloom mipmapBlur luminanceThreshold={scene === 'indoor' || timeOfDay === 'dusk' ? 0.7 : 0.9} luminanceSmoothing={0.25} intensity={scene === 'indoor' || timeOfDay === 'dusk' ? 0.9 : 0.55} />
        <SMAA />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.22} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  )
}
