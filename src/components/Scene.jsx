import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Sky, SoftShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ToneMapping, SMAA } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

import Pool from './Pool'
import Water from './Water'
import Caustics from './Caustics'
import Deck from './Deck'
import Ground from './Ground'
import Indoor, { indoorOrbit } from './Indoor'
import Surroundings from './Surroundings'
import Vegetation, { HEDGE_RADIUS } from './Vegetation'
import DayClouds from './DayClouds'
import Stairs from './Accessories/Stairs'
import LedStrip from './Accessories/LedStrip'
import Cover from './Accessories/Cover'
import OverflowFlow from './Accessories/Overflow'
import HeatPump from './Accessories/HeatPump'
import CounterCurrent from './Accessories/CounterCurrent'
import Jet from './Accessories/Jets'
import SchwallDusche from './Accessories/SchwallDusche'
import Liege, { Bank } from './Accessories/Liege'
import Robot from './Accessories/Robot'
import { usePoolConfig, getPoolMaterial } from '../hooks/usePoolConfig'
import { visualShapeForSystem, findStair } from '../data/config'
import { jetFlowFromPlacement, resolveSnap } from '../three/placement'
import { waterLevelFor } from '../three/footprint'
import DimensionLabels from './DimensionLabels'
import { FLOAT_LAYER, SCENERY_LAYER, applyLayer } from '../three/layers'

function lighting(scene, time) {
  if (scene === 'indoor') {
    return {
      env: 'apartment',
      envIntensity: 0.82,
      bg: '#1c1916',
      sky: false,
      fog: ['#1c1916', 42, 90],
      ambient: 0.42,
      sun: { pos: [5, 10, 6], intensity: 0.88, color: '#ffe8c8' },
      hemi: 0.32,
    }
  }
  if (time === 'dusk') {
    return {
      env: 'sunset',
      envIntensity: 0.42,
      bg: '#2b3950',
      sky: false,
      fog: ['#2b3950', 24, 52],
      ambient: 0.18,
      sun: { pos: [-7, 5, -4], intensity: 1.05, color: '#ffb27a' },
      hemi: 0.24,
    }
  }
  return {
    env: 'park',
      envIntensity: 0.52,
    bg: '#8ebdd8',
    sky: false,
    fog: ['#c5d8e8', 42, 95],
    ambient: 0.24,
    sun: { pos: [9, 12, 6], intensity: 1.22, color: '#fff3e0' },
    hemi: 0.34,
  }
}

const CAM_TARGET = new THREE.Vector3(0, -0.5, 0)
const CAM_TARGET_IN = new THREE.Vector3(0, 0.32, -0.15)

function CameraRig({ scene, length, width, topView }) {
  const { camera, controls } = useThree()
  const indoor = scene === 'indoor'
  const orbit = indoor ? indoorOrbit(length, width) : null
  const span = Math.max(length, width)
  const fitDistance = indoor
    ? orbit.maxDistance * 0.88
    : Math.min(HEDGE_RADIUS - 3, Math.max(11, span * 1.4 + 5.5))
  const lookAt = indoor ? CAM_TARGET_IN : CAM_TARGET

  // Ansicht wechseln setzt die Kamera neu
  useEffect(() => {
    if (topView) {
      camera.position.set(0.01, Math.max(14, length + 5), 0.01)
      camera.lookAt(0, 0, 0)
    } else if (indoor) {
      const { hall } = orbit
      camera.fov = 52
      camera.updateProjectionMatrix()
      camera.position.set(
        Math.min(length * 0.12, 1.15),
        1.85,
        Math.min(width / 2 + 3.4, hall.z / 2 - 0.75),
      )
    } else {
      camera.fov = 44
      camera.updateProjectionMatrix()
      // flacherer Blickwinkel, damit Hecke und Baumreihe im Bild bleiben
      camera.position.set(length + 2, 3.8, width + 8)
    }
    if (controls) {
      controls.target.copy(topView ? CAM_TARGET : lookAt)
      controls.update()
    }
    // Absichtlich ohne length/width: beim Ziehen der Massregler soll die vom
    // Nutzer gewählte Perspektive erhalten bleiben.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, topView, camera, controls])

  // Massänderung: Blickrichtung behalten, nur den Abstand ans Becken anpassen
  useEffect(() => {
    if (topView) {
      camera.position.set(0.01, Math.max(14, length + 5), 0.01)
      camera.lookAt(0, 0, 0)
    } else if (indoor) {
      const dir = camera.position.clone().sub(lookAt)
      const len = dir.length()
      if (len > orbit.maxDistance) {
        camera.position.copy(lookAt).add(dir.multiplyScalar(orbit.maxDistance / len))
      }
      camera.position.y = Math.max(1.58, Math.min(2.7, camera.position.y))
    } else {
      const dir = camera.position.clone().sub(lookAt)
      if (dir.lengthSq() < 1e-6) return
      camera.position.copy(lookAt).add(dir.normalize().multiplyScalar(fitDistance))
    }
    if (controls) controls.update()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitDistance, length, topView, camera, controls, indoor])

  return null
}

function IndoorOrbitClamp({ hall, enabled }) {
  const { camera, controls } = useThree()
  useFrame(() => {
    if (!enabled || !controls || !hall) return
    const maxX = hall.x / 2 - 0.45
    const maxZ = hall.z / 2 - 0.45
    const minY = 1.52
    const maxY = Math.min(3.55, hall.h - 1.15)
    const p = camera.position
    if (p.x <= maxX && p.x >= -maxX && p.z <= maxZ && p.z >= -maxZ && p.y >= minY && p.y <= maxY) return
    if (p.x > maxX) p.x = maxX
    else if (p.x < -maxX) p.x = -maxX
    if (p.z > maxZ) p.z = maxZ
    else if (p.z < -maxZ) p.z = -maxZ
    if (p.y < minY) p.y = minY
    else if (p.y > maxY) p.y = maxY
    controls.update()
  })
  return null
}

function EnableSceneLayers({ children }) {
  const { camera } = useThree()
  const root = useRef()

  useLayoutEffect(() => {
    camera.layers.enable(FLOAT_LAYER)
    camera.layers.enable(SCENERY_LAYER)
    root.current?.traverse((o) => {
      if (o.isLight) {
        o.layers.enable(FLOAT_LAYER)
        o.layers.enable(SCENERY_LAYER)
      }
    })
  }, [camera])

  return <group ref={root}>{children}</group>
}

function Scenery({ children }) {
  const ref = useRef()
  useLayoutEffect(() => {
    applyLayer(ref.current, SCENERY_LAYER)
  }, [])
  return <group ref={ref}>{children}</group>
}

// Halbtransparentes Grau für die Vorschau des zu platzierenden Produkts.
// depthTest aus, damit die Vorschau auch unter der Wasseroberfläche sichtbar
// bleibt, solange platziert wird.
const GHOST_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#9fa8b0',
  roughness: 0.5,
  metalness: 0.15,
  transparent: true,
  opacity: 0.62,
  depthWrite: false,
  depthTest: false,
})

function GhostModel({ placing, length, width, depth, anchor, stairItem, waterY }) {
  const ref = useRef()

  useLayoutEffect(() => {
    if (!ref.current) return
    ref.current.traverse((o) => {
      if (!o.isMesh) return
      o.material = GHOST_MATERIAL
      o.castShadow = false
      o.receiveShadow = false
      o.renderOrder = 999
    })
  })

  let body = null
  switch (placing.kind) {
    case 'stair':
      body = (
        <Stairs
          type={stairItem.visual}
          steps={stairItem.steps}
          wall={anchor.wall}
          corner={anchor.corner}
          poolLength={length}
          poolWidth={width}
          poolDepth={depth}
          material={null}
          waterY={waterY}
        />
      )
      break
    case 'jet':
      body = <Jet position={[0, -depth / 2, 0]} rotation={[0, 0, 0]} />
      break
    case 'schwall':
      body = <SchwallDusche position={[0, 0, 0]} rotation={[0, 0, 0]} />
      break
    case 'liege':
      body = <Liege position={[0, 0, 0]} rotation={[0, 0, 0]} poolDepth={depth} />
      break
    case 'bank':
      body = <Bank position={[0, 0, 0]} rotation={[0, 0, 0]} poolDepth={depth} />
      break
    case 'robot':
      body = <Robot position={[0, 0, 0]} variant={placing.variant} poolDepth={depth} />
      break
    case 'countercurrent':
      body = <CounterCurrent position={[0, 0, 0]} rotation={[0, 0, 0]} waterY={waterY} />
      break
    case 'heatpump':
      body = <HeatPump position={[0, 0, 0]} rotation={[0, 0, 0]} />
      break
    default:
      body = null
  }

  return <group ref={ref}>{body}</group>
}

/**
 * Platzierungs-Modus: unsichtbare Klickfläche + graue Produkt-Vorschau,
 * die dem Cursor folgt. Die Vorschau wird imperativ bewegt (kein Re-Render).
 */
function PlacementLayer({ length, width, depth, placing, stairItem, waterY }) {
  const confirmPlacement = usePoolConfig((s) => s.confirmPlacement)
  const followRef = useRef()
  const markerRef = useRef()
  const pending = useRef(null)
  const lastSnap = useRef(null)
  const [anchor, setAnchor] = useState({ wall: 'west', corner: 'nw' })

  const isStair = placing.kind === 'stair'
  const isDeck = placing.place === 'deck'
  const isCorner = placing.place === 'corner'
  // Markierung immer knapp über dem Wasserspiegel, damit sie nie hinter der
  // vorderen Beckenwand verschwindet
  const markerY = isDeck ? 0.04 : 0.06

  const apply = (x, z) => {
    const snap = resolveSnap(isCorner ? 'wall' : placing.place, x, z, length, width, isCorner)
    lastSnap.current = snap
    if (isStair) {
      setAnchor((a) =>
        a.wall === (snap.wall || a.wall) && a.corner === (snap.corner || a.corner)
          ? a
          : { wall: snap.wall || a.wall, corner: snap.corner || a.corner },
      )
    } else if (followRef.current) {
      followRef.current.position.set(snap.x, 0, snap.z)
      followRef.current.rotation.y = snap.rotY || 0
    }
    if (markerRef.current) markerRef.current.position.set(snap.x, markerY, snap.z)
  }

  // höchstens ein Update pro Frame – hält den Platzierungs-Modus flüssig
  useFrame(() => {
    if (!pending.current) return
    const { x, z } = pending.current
    pending.current = null
    apply(x, z)
  })

  const planeArgs = isDeck
    ? [length + 24, width + 24]
    : [Math.max(0.5, length - 0.28), Math.max(0.5, width - 0.28)]

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, isDeck ? 0.02 : 0.05, 0]}
        renderOrder={5}
        onPointerMove={(e) => {
          e.stopPropagation()
          pending.current = { x: e.point.x, z: e.point.z }
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          if (pending.current) {
            apply(pending.current.x, pending.current.z)
            pending.current = null
          }
          const snap = lastSnap.current || resolveSnap(isCorner ? 'wall' : placing.place, e.point.x, e.point.z, length, width, isCorner)
          confirmPlacement(snap)
        }}
      >
        <planeGeometry args={planeArgs} />
        <meshBasicMaterial color="#32B4E6" transparent opacity={0.09} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {!isStair && (
        <mesh ref={markerRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, markerY, 0]} renderOrder={29}>
          <ringGeometry args={[0.22, 0.3, 32]} />
          <meshBasicMaterial color="#32B4E6" transparent opacity={0.9} depthWrite={false} />
        </mesh>
      )}

      {isStair ? (
        <GhostModel placing={placing} length={length} width={width} depth={depth} anchor={anchor} stairItem={stairItem} waterY={waterY} />
      ) : (
        <group ref={followRef}>
          <GhostModel placing={placing} length={length} width={width} depth={depth} anchor={anchor} stairItem={stairItem} waterY={waterY} />
        </group>
      )}
    </>
  )
}

const PlacedItems = React.memo(function PlacedItems({ placements, depth, waterY, hideKind }) {
  return placements.map((p) => {
    if (hideKind && p.kind === hideKind) return null
    const rot = [0, p.rotY || 0, 0]
    if (p.kind === 'jet') return <Jet key={p.id} position={[p.x, -depth / 2, p.z]} rotation={rot} />
    if (p.kind === 'schwall') return <SchwallDusche key={p.id} position={[p.x, 0, p.z]} rotation={rot} />
    if (p.kind === 'liege') return <Liege key={p.id} position={[p.x, 0, p.z]} rotation={rot} poolDepth={depth} />
    if (p.kind === 'bank') return <Bank key={p.id} position={[p.x, 0, p.z]} rotation={rot} poolDepth={depth} />
    if (p.kind === 'robot') return <Robot key={p.id} position={[p.x, 0, p.z]} variant={p.variant} poolDepth={depth} />
    if (p.kind === 'countercurrent')
      return <CounterCurrent key={p.id} position={[p.x, 0, p.z]} rotation={rot} waterY={waterY} />
    if (p.kind === 'heatpump') return <HeatPump key={p.id} position={[p.x, 0, p.z]} rotation={rot} />
    return null
  })
})

export default function Scene() {
  const type = usePoolConfig((s) => s.type)
  const length = usePoolConfig((s) => s.length)
  const width = usePoolConfig((s) => s.width)
  const depth = usePoolConfig((s) => s.depth)
  const poolSystem = usePoolConfig((s) => s.poolSystem)
  const stair = usePoolConfig((s) => s.stair)
  const stairWall = usePoolConfig((s) => s.stairWall)
  const stairCorner = usePoolConfig((s) => s.stairCorner)
  const ppColor = usePoolConfig((s) => s.ppColor)
  const steelFinish = usePoolConfig((s) => s.steelFinish)
  const led = usePoolConfig((s) => s.options.led)
  const rolladen = usePoolConfig((s) => s.options.rolladen)
  const scene = usePoolConfig((s) => s.scene)
  const timeOfDay = usePoolConfig((s) => s.timeOfDay)
  const deck = usePoolConfig((s) => s.deck)
  const placements = usePoolConfig((s) => s.placements)
  const placing = usePoolConfig((s) => s.placing)
  const topView = usePoolConfig((s) => s.topView)
  const showDimensions = usePoolConfig((s) => s.showDimensions)
  const [coverBlocking, setCoverBlocking] = useState(false)

  const material = useMemo(
    () => getPoolMaterial({ type, ppColor, steelFinish }),
    [type, ppColor, steelFinish],
  )
  const shape = visualShapeForSystem(poolSystem)
  const stairItem = findStair(type, stair)
  const acc = useMemo(
    () => ({ poolLength: length, poolWidth: width, poolDepth: depth }),
    [length, width, depth],
  )
  const L = useMemo(() => lighting(scene, timeOfDay), [scene, timeOfDay])
  const outdoor = scene !== 'indoor'
  const jetPlacement =
    placing?.kind === 'countercurrent' && placing.preview
      ? placing.preview
      : placements.find((p) => p.kind === 'countercurrent') || null
  const jetFlow = useMemo(
    () => jetFlowFromPlacement(jetPlacement),
    [jetPlacement?.x, jetPlacement?.z, jetPlacement?.wall],
  )
  const indoorLimits = useMemo(() => indoorOrbit(length, width), [length, width])
  const deckMargin = outdoor
    ? 2.8
    : Math.max(
        3.2,
        Math.min(
          (indoorLimits.hall.x - length) / 2 - 0.35,
          (indoorLimits.hall.z - width) / 2 - 0.35,
        ),
      )
  // Nicht über die Hecke hinaus zoomen, sonst blickt man von aussen ins Grundstück
  const maxDist = outdoor
    ? Math.min(HEDGE_RADIUS - 2, Math.max(18, length + width + 10))
    : indoorLimits.maxDistance

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      performance={{ min: 0.75, debounce: 200 }}
      camera={{ position: [11, 6, 11], fov: 44 }}
      gl={{
        antialias: false,
        toneMapping: THREE.NoToneMapping,
        powerPreference: 'high-performance',
        stencil: false,
      }}
    >
      <color attach="background" args={[L.bg]} />
      <fog attach="fog" args={L.fog} />

      {L.sky && (
        <Sky turbidity={L.sky.turbidity} rayleigh={L.sky.rayleigh} mieCoefficient={0.005} mieDirectionalG={0.85} sunPosition={L.sky.sun} />
      )}

      <SoftShadows size={16} samples={12} focus={0.68} />
      <EnableSceneLayers>
      <ambientLight intensity={L.ambient} />
        <hemisphereLight args={['#d7e6f2', '#7a8a62', L.hemi]} />
      <directionalLight
        position={L.sun.pos}
        intensity={L.sun.intensity}
        color={L.sun.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
          shadow-camera-left={outdoor ? -20 : -16}
          shadow-camera-right={outdoor ? 20 : 16}
          shadow-camera-top={outdoor ? 20 : 16}
          shadow-camera-bottom={outdoor ? -20 : -16}
        shadow-camera-near={1}
          shadow-camera-far={outdoor ? 48 : 40}
      />
      </EnableSceneLayers>

      <Suspense fallback={null}>
        <Environment preset={L.env} environmentIntensity={L.envIntensity} />
        <Scenery>
          {outdoor && (
            <DayClouds dusk={timeOfDay === 'dusk'} />
          )}
          {outdoor && (
            <Ground
              holeLength={length + deckMargin * 2}
              holeWidth={width + deckMargin * 2}
              timeOfDay={timeOfDay}
            />
          )}
          <Deck length={length} width={width} shape={shape} deck={deck} margin={deckMargin} />
          {showDimensions && <DimensionLabels length={length} width={width} shape={shape} />}
          {outdoor && <Vegetation timeOfDay={timeOfDay} />}
        </Scenery>
        {!outdoor && <Indoor poolLength={length} poolWidth={width} />}
        <Surroundings
          poolLength={length}
          poolWidth={width}
          scene={scene}
          waterY={waterLevelFor(shape)}
          showFloat
          rolladen={rolladen || coverBlocking}
          jet={jetFlow}
        />
        <Pool length={length} width={width} depth={depth} material={material} shape={shape} />
        {shape === 'Infinity' && (
          <OverflowFlow length={length} width={width} waterY={waterLevelFor(shape)} />
        )}
        <Caustics length={length} width={width} depth={depth} shape={shape} led={led} jet={jetFlow} />
        <Water
          length={length}
          width={width}
          depth={depth}
          shape={shape}
          led={led}
          envMode={scene === 'indoor' ? 'indoor' : timeOfDay}
          pickable={!placing}
          jet={jetFlow}
        />
        {stairItem.visual && (
          <Stairs
            type={stairItem.visual}
            steps={stairItem.steps}
            wall={stairWall}
            corner={stairCorner}
            material={material}
            waterY={waterLevelFor(shape)}
            {...acc}
          />
        )}
        {led && <LedStrip {...acc} />}
        <Cover rolladen={rolladen} onBlocking={setCoverBlocking} {...acc} waterY={waterLevelFor(shape)} />
        <PlacedItems
          placements={placements}
          depth={depth}
          waterY={waterLevelFor(shape)}
          hideKind={placing?.kind === 'countercurrent' ? 'countercurrent' : null}
        />
        {placing && placing.kind !== 'stair' && placing.kind !== 'countercurrent' && (
          <PlacementLayer length={length} width={width} depth={depth} placing={placing} stairItem={stairItem} waterY={waterLevelFor(shape)} />
        )}
        {placing?.kind === 'countercurrent' && placing.preview && (
          <CounterCurrent
            position={[placing.preview.x, 0, placing.preview.z]}
            rotation={[0, placing.preview.rotY || 0, 0]}
            waterY={waterLevelFor(shape)}
          />
        )}
      </Suspense>

      <CameraRig scene={scene} length={length} width={width} topView={topView} />
      <IndoorOrbitClamp hall={indoorLimits.hall} enabled={!outdoor && !topView} />
      <OrbitControls
        makeDefault
        enabled={!placing || placing.kind === 'stair' || placing.kind === 'countercurrent'}
        enablePan={false}
        minDistance={outdoor ? 6 : indoorLimits.minDistance}
        maxDistance={maxDist}
        minPolarAngle={topView || outdoor ? 0 : 0.7}
        maxPolarAngle={topView ? 0.18 : outdoor ? Math.PI / 2.15 : 1.32}
        target={outdoor ? [0, -0.5, 0] : [0, 0.32, -0.15]}
        enableDamping
        dampingFactor={0.08}
      />

      <EffectComposer multisampling={0} stencilBuffer={false}>
        {(scene === 'indoor' || timeOfDay === 'dusk') && (
          <Bloom mipmapBlur luminanceThreshold={0.75} luminanceSmoothing={0.3} intensity={0.4} />
        )}
        <SMAA />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.28} darkness={scene === 'indoor' || timeOfDay === 'dusk' ? 0.4 : 0.18} />
      </EffectComposer>
    </Canvas>
  )
}
