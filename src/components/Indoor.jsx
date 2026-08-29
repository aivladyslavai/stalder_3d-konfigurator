import React, { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SCENERY_LAYER, FLOAT_LAYER } from '../three/layers'

export const INDOOR_DECK_MARGIN = 3.6

export function indoorHallSize(length, width) {
  return {
    x: Math.max(20, length + 14),
    z: Math.max(16.5, width + 12),
    h: 4.8,
  }
}

export function indoorOrbit(length, width) {
  const hall = indoorHallSize(length, width)
  const toWall = Math.min(hall.x, hall.z) / 2 - 0.4
  return {
    hall,
    minDistance: 3.4,
    maxDistance: toWall,
  }
}

const WALL = 0.28

function ringGeometry(outerX, outerZ, innerX, innerZ) {
  const shape = new THREE.Shape()
  shape.moveTo(-outerX, -outerZ)
  shape.lineTo(outerX, -outerZ)
  shape.lineTo(outerX, outerZ)
  shape.lineTo(-outerX, outerZ)
  shape.lineTo(-outerX, -outerZ)
  const hole = new THREE.Path()
  hole.moveTo(-innerX, -innerZ)
  hole.lineTo(innerX, -innerZ)
  hole.lineTo(innerX, innerZ)
  hole.lineTo(-innerX, innerZ)
  hole.lineTo(-innerX, -innerZ)
  shape.holes.push(hole)
  const geo = new THREE.ShapeGeometry(shape)
  geo.rotateX(-Math.PI / 2)
  return geo
}

/**
 * Innenpool-Halle: Wände, Decke und Fenster sitzen um Terrasse und Becken.
 * Das Loft-GLB bleibt draussen — es ist ein Wohnzimmer und schwebt über dem Wasser.
 *
 * Props: { poolLength, poolWidth }
 */
function Indoor({ poolLength, poolWidth }) {
  const hall = indoorHallSize(poolLength, poolWidth)
  const { x: hx, z: hz, h } = hall
  const root = useRef()

  const floorGeo = useMemo(
    () =>
      ringGeometry(
        hx / 2 + WALL,
        hz / 2 + WALL,
        poolLength / 2 + 0.02,
        poolWidth / 2 + 0.02,
      ),
    [hx, hz, poolLength, poolWidth],
  )
  useLayoutEffect(() => () => floorGeo.dispose(), [floorGeo])

  const slats = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.04, 3.1, 0.08)
    const mat = new THREE.MeshStandardMaterial({ color: '#8d6a45', roughness: 0.72, metalness: 0 })
    const mesh = new THREE.InstancedMesh(geo, mat, 22)
    mesh.castShadow = true
    mesh.frustumCulled = false
    const dummy = new THREE.Object3D()
    for (let i = 0; i < 22; i++) {
      dummy.position.set(-hx / 2 + 0.06, 1.55, -hz / 2 + 0.7 + (i / 21) * (hz - 1.4))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }, [hx, hz])

  useLayoutEffect(
    () => () => {
      slats.geometry.dispose()
      slats.material.dispose()
    },
    [slats],
  )

  useLayoutEffect(() => {
    const g = root.current
    if (!g) return
    g.traverse((o) => {
      if (o.isLight) {
        o.layers.enable(0)
        o.layers.enable(SCENERY_LAYER)
        o.layers.enable(FLOAT_LAYER)
        return
      }
      o.layers.set(SCENERY_LAYER)
    })
  }, [hx, hz])

  const winW = hx * 0.58
  const winH = h - 0.85
  const sill = 0.18
  const side = (hx - winW) / 2

  return (
    <group ref={root}>
      <mesh geometry={floorGeo} position={[0, -0.15, 0]} receiveShadow>
        <meshStandardMaterial color="#c4bbb0" roughness={0.9} metalness={0} envMapIntensity={0.16} />
      </mesh>

      {/* Aussen: Abendhimmel hinter den Fenstern */}
      <mesh position={[0, h * 0.45, -hz / 2 - 2.4]} renderOrder={-8}>
        <planeGeometry args={[hx + 8, h + 3]} />
        <meshBasicMaterial color="#2a3348" />
      </mesh>
      <mesh position={[0, 1.1, -hz / 2 - 2.35]}>
        <planeGeometry args={[hx + 6, 2.4]} />
        <meshBasicMaterial color="#3d4a3a" />
      </mesh>

      {/* Wände — etwas in den Boden, damit kein Lichtspalt bleibt */}
      <mesh position={[0, h / 2 - 0.06, hz / 2 + WALL / 2]} castShadow receiveShadow>
        <boxGeometry args={[hx + WALL * 2, h + 0.12, WALL]} />
        <meshStandardMaterial color="#e7dfd4" roughness={0.9} metalness={0} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[-(winW / 2 + side / 2), h / 2 - 0.06, -hz / 2 - WALL / 2]} castShadow receiveShadow>
        <boxGeometry args={[side + WALL, h + 0.12, WALL]} />
        <meshStandardMaterial color="#e7dfd4" roughness={0.9} metalness={0} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[winW / 2 + side / 2, h / 2 - 0.06, -hz / 2 - WALL / 2]} castShadow receiveShadow>
        <boxGeometry args={[side + WALL, h + 0.12, WALL]} />
        <meshStandardMaterial color="#e7dfd4" roughness={0.9} metalness={0} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[0, sill / 2, -hz / 2 - WALL / 2]} receiveShadow>
        <boxGeometry args={[winW, sill, WALL]} />
        <meshStandardMaterial color="#d9d0c4" roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[0, sill + winH + (h - sill - winH) / 2, -hz / 2 - WALL / 2]} castShadow>
        <boxGeometry args={[winW, h - sill - winH, WALL]} />
        <meshStandardMaterial color="#e7dfd4" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[-hx / 2 - WALL / 2, h / 2 - 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL, h + 0.12, hz]} />
        <meshStandardMaterial color="#efe8dd" roughness={0.9} metalness={0} envMapIntensity={0.18} />
      </mesh>
      <mesh position={[hx / 2 + WALL / 2, h / 2 - 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL, h + 0.12, hz]} />
        <meshStandardMaterial color="#efe8dd" roughness={0.9} metalness={0} envMapIntensity={0.18} />
      </mesh>
      <mesh position={[0, 0.07, hz / 2 - 0.01]} receiveShadow>
        <boxGeometry args={[hx - 0.04, 0.14, 0.05]} />
        <meshStandardMaterial color="#8f857a" roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[0, 0.07, -hz / 2 + 0.01]} receiveShadow>
        <boxGeometry args={[hx - 0.04, 0.14, 0.05]} />
        <meshStandardMaterial color="#8f857a" roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[-hx / 2 + 0.01, 0.07, 0]} receiveShadow>
        <boxGeometry args={[0.05, 0.14, hz - 0.08]} />
        <meshStandardMaterial color="#8f857a" roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[hx / 2 - 0.01, 0.07, 0]} receiveShadow>
        <boxGeometry args={[0.05, 0.14, hz - 0.08]} />
        <meshStandardMaterial color="#8f857a" roughness={0.85} metalness={0} />
      </mesh>

      <primitive object={slats} />

      {/* Glas */}
      <mesh position={[0, sill + winH / 2, -hz / 2 - 0.04]}>
        <planeGeometry args={[winW - 0.08, winH - 0.06]} />
        <meshStandardMaterial
          color="#c5d6e4"
          transparent
          opacity={0.22}
          roughness={0.08}
          metalness={0.15}
          envMapIntensity={1.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {[-winW / 3, winW / 3].map((x) => (
        <mesh key={`mullion-v-${x}`} position={[x, sill + winH / 2, -hz / 2 - 0.02]}>
          <boxGeometry args={[0.06, winH, 0.08]} />
          <meshStandardMaterial color="#d4cbbf" roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
      <mesh position={[0, sill + winH * 0.52, -hz / 2 - 0.02]}>
        <boxGeometry args={[winW, 0.06, 0.08]} />
        <meshStandardMaterial color="#d4cbbf" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Decke + Lichtvouten */}
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[hx + 0.4, hz + 0.4]} />
        <meshStandardMaterial color="#dcd4c8" roughness={0.96} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, h - 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[hx - 1.6, hz - 1.6]} />
        <meshStandardMaterial color="#cfc6b8" roughness={0.95} metalness={0} side={THREE.DoubleSide} />
      </mesh>

      {[-hx * 0.22, 0, hx * 0.22].map((x, i) => (
        <group key={`lamp${i}`}>
          <mesh position={[x, h - 0.18, hz * 0.08]}>
            <boxGeometry args={[1.35, 0.06, 0.35]} />
            <meshBasicMaterial color="#fff4e4" toneMapped={false} />
          </mesh>
          <pointLight position={[x, h - 0.55, hz * 0.08]} color="#ffe6c4" intensity={6.2} distance={12} decay={2} />
        </group>
      ))}
      <pointLight position={[0, 3.1, -hz * 0.18]} color="#fff0dc" intensity={4} distance={14} decay={2} />
      <pointLight position={[hx * 0.18, 2.4, hz * 0.22]} color="#ffe8d2" intensity={2.8} distance={10} decay={2} />
    </group>
  )
}

export default React.memo(Indoor)
