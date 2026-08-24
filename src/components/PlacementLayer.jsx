import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import Stairs from './Accessories/Stairs'
import { usePoolConfig } from '../hooks/usePoolConfig'
import { resolveSnap } from '../three/placement'

const GHOST = '#9aa3ab'

function GhostMat({ opacity = 0.55 }) {
  return (
    <meshStandardMaterial
      color={GHOST}
      transparent
      opacity={opacity}
      depthWrite={false}
      metalness={0.05}
      roughness={0.85}
      emissive={GHOST}
      emissiveIntensity={0.08}
    />
  )
}

function StairGhost({ placing, length, width, depth, snap }) {
  if (!placing.visual || !snap) return null
  return (
    <Stairs
      type={placing.visual}
      steps={placing.steps || 4}
      wall={snap.wall || 'west'}
      corner={snap.corner || 'nw'}
      poolLength={length}
      poolWidth={width}
      poolDepth={depth}
      ghost
    />
  )
}

function ItemGhost({ placing, depth }) {
  const mat = <GhostMat />
  const yMid = -depth / 2

  if (placing.kind === 'jet') {
    return (
      <group>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.09, 0.12, 16]} />
          {mat}
        </mesh>
        <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.04, 12]} />
          {mat}
        </mesh>
      </group>
    )
  }

  if (placing.kind === 'schwall') {
    return (
      <group>
        <mesh position={[0.08, 0.55, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 1.1, 10]} />
          {mat}
        </mesh>
        <mesh position={[0.28, 1.05, 0]} rotation={[0, 0, -1.05]}>
          <cylinderGeometry args={[0.028, 0.028, 0.45, 10]} />
          {mat}
        </mesh>
        <mesh position={[0.46, 0.92, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.04, 0.08, 12]} />
          {mat}
        </mesh>
        <mesh position={[0.62, 0.55, 0]}>
          <coneGeometry args={[0.12, 0.7, 8, 1, true]} />
          <GhostMat opacity={0.28} />
        </mesh>
      </group>
    )
  }

  if (placing.kind === 'liege') {
    return (
      <group>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0.35 + i * 0.18, -depth + 0.18 + i * 0.16, 0]}>
            <boxGeometry args={[0.38, 0.12, 2.0 - i * 0.12]} />
            {mat}
          </mesh>
        ))}
      </group>
    )
  }

  if (placing.kind === 'bank') {
    return (
      <group>
        <mesh position={[0.28, -depth + 0.42, 0]}>
          <boxGeometry args={[0.38, 0.08, 2.0]} />
          {mat}
        </mesh>
        {[-0.85, 0.85].map((z) => (
          <mesh key={z} position={[0.28, -depth + 0.22, z]}>
            <cylinderGeometry args={[0.04, 0.04, 0.36, 10]} />
            {mat}
          </mesh>
        ))}
      </group>
    )
  }

  if (placing.kind === 'countercurrent') {
    return (
      <group position={[0, yMid, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.18, 0.22, 18]} />
          {mat}
        </mesh>
        <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.1, 0.08, 14]} />
          {mat}
        </mesh>
      </group>
    )
  }

  if (placing.kind === 'robot') {
    const scale = placing.variant === 'X80' ? 1.15 : 1
    return (
      <group position={[0, -depth + 0.09, 0]} scale={scale}>
        <mesh>
          <boxGeometry args={[0.42, 0.12, 0.32]} />
          {mat}
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.13, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {mat}
        </mesh>
        {[-0.18, 0.18].map((z) => (
          <mesh key={z} position={[0, -0.04, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.38, 12]} />
            {mat}
          </mesh>
        ))}
      </group>
    )
  }

  if (placing.kind === 'heatpump') {
    return (
      <group>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.15, 0.9, 0.55]} />
          {mat}
        </mesh>
        <mesh position={[0, 0.92, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.05, 18]} />
          {mat}
        </mesh>
      </group>
    )
  }

  return (
    <mesh>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      {mat}
    </mesh>
  )
}

/**
 * Placement overlay: invisible hit plane + grey product silhouette.
 * Stair snaps only re-render when wall/corner changes (fixes lag).
 * Free items move via ref (no React re-render per pointermove).
 */
export default function PlacementLayer({ length, width, depth, placing, stairWall = 'west', stairCorner = 'nw' }) {
  const confirmPlacement = usePoolConfig((s) => s.confirmPlacement)
  const itemRef = useRef(null)
  const snapRef = useRef(null)
  const lastStairKey = useRef('')
  const isDeck = placing.place === 'deck'
  const isCorner = placing.place === 'corner'
  const isStair = placing.kind === 'stair'

  const initialStairSnap = useMemo(() => {
    if (!isStair) return null
    if (isCorner) {
      return { x: 0, z: 0, wall: null, corner: stairCorner || 'nw', rotY: 0 }
    }
    return { x: 0, z: 0, wall: stairWall || 'west', corner: null, rotY: 0 }
  }, [isStair, isCorner, stairWall, stairCorner])

  const [stairSnap, setStairSnap] = useState(initialStairSnap)

  // Reset ghost when switching product / stair type
  useEffect(() => {
    lastStairKey.current = ''
    snapRef.current = initialStairSnap
    setStairSnap(initialStairSnap)
    if (itemRef.current) itemRef.current.visible = false
  }, [placing.catalogId, placing.visual, placing.kind, initialStairSnap])

  const planeArgs = useMemo(
    () => (isDeck ? [length + 8, width + 8] : [Math.max(0.5, length - 0.28), Math.max(0.5, width - 0.28)]),
    [isDeck, length, width],
  )

  const snapPoint = (point) =>
    resolveSnap(placing.place === 'corner' ? 'wall' : placing.place, point.x, point.z, length, width, isCorner)

  const applyPointer = (point) => {
    const snap = snapPoint(point)
    snapRef.current = snap

    if (isStair) {
      const key = `${snap.wall || ''}|${snap.corner || ''}`
      if (key !== lastStairKey.current) {
        lastStairKey.current = key
        setStairSnap(snap)
      }
      return
    }

    const g = itemRef.current
    if (!g) return
    g.position.set(snap.x, 0, snap.z)
    g.rotation.set(0, snap.rotY || 0, 0)
    g.visible = true
  }

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, isDeck ? 0.04 : 0.06, 0]}
        renderOrder={30}
        onPointerMove={(e) => {
          e.stopPropagation()
          applyPointer(e.point)
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          e.nativeEvent?.preventDefault?.()
          const snap = snapRef.current || snapPoint(e.point)
          confirmPlacement(snap)
        }}
      >
        <planeGeometry args={planeArgs} />
        <meshBasicMaterial
          color="#32B4E6"
          transparent
          opacity={0.07}
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {isStair ? (
        <StairGhost placing={placing} length={length} width={width} depth={depth} snap={stairSnap} />
      ) : (
        <group ref={itemRef} visible={false}>
          <ItemGhost placing={placing} depth={depth} />
        </group>
      )}
    </>
  )
}
