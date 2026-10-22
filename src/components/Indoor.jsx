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
    const count = 26
    const panelW = Math.min(4.8, hz * 0.42)
    const geo = new THREE.BoxGeometry(0.055, 2.15, 0.038)
    const mat = new THREE.MeshStandardMaterial({ color: '#6a4b32', roughness: 0.58, metalness: 0.05 })
    const mesh = new THREE.InstancedMesh(geo, mat, count)
    mesh.castShadow = true
    mesh.frustumCulled = false
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const z = -panelW / 2 + (i / (count - 1)) * panelW
      dummy.position.set(hx / 2 - 0.16, 1.72, z)
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
        <meshStandardMaterial color="#ddd4c6" roughness={0.82} metalness={0.02} envMapIntensity={0.22} />
      </mesh>

      {/* Aussen: Abendhimmel hinter den Fenstern */}
      <mesh position={[0, h * 0.72, -hz / 2 - 3.2]} renderOrder={-8}>
        <planeGeometry args={[hx + 12, h + 4]} />
        <meshBasicMaterial color="#1d2838" />
      </mesh>
      <mesh position={[0, 1.55, -hz / 2 - 3.05]}>
        <planeGeometry args={[hx + 10, 1.15]} />
        <meshBasicMaterial color="#c4a27a" />
      </mesh>
      <mesh position={[0, 0.55, -hz / 2 - 2.9]}>
        <planeGeometry args={[hx + 10, 1.3]} />
        <meshBasicMaterial color="#3c5344" />
      </mesh>
      {[-hx * 0.28, -hx * 0.08, hx * 0.14, hx * 0.34].map((x, i) => (
        <mesh key={`tree-${i}`} position={[x, 1.7, -hz / 2 - 2.7]}>
          <planeGeometry args={[1.1, 2.4]} />
          <meshBasicMaterial color={i % 2 ? '#2c4034' : '#24362c'} />
        </mesh>
      ))}

      {/* Wände — etwas in den Boden, damit kein Lichtspalt bleibt */}
      <mesh position={[0, h / 2 - 0.06, hz / 2 + WALL / 2]} castShadow receiveShadow>
        <boxGeometry args={[hx + WALL * 2, h + 0.12, WALL]} />
        <meshStandardMaterial color="#f3eee6" roughness={0.86} metalness={0} envMapIntensity={0.24} />
      </mesh>
      <mesh position={[-(winW / 2 + side / 2), h / 2 - 0.06, -hz / 2 - WALL / 2]} castShadow receiveShadow>
        <boxGeometry args={[side + WALL, h + 0.12, WALL]} />
        <meshStandardMaterial color="#f3eee6" roughness={0.86} metalness={0} envMapIntensity={0.24} />
      </mesh>
      <mesh position={[winW / 2 + side / 2, h / 2 - 0.06, -hz / 2 - WALL / 2]} castShadow receiveShadow>
        <boxGeometry args={[side + WALL, h + 0.12, WALL]} />
        <meshStandardMaterial color="#f3eee6" roughness={0.86} metalness={0} envMapIntensity={0.24} />
      </mesh>
      <mesh position={[0, sill / 2, -hz / 2 - WALL / 2]} receiveShadow>
        <boxGeometry args={[winW, sill, WALL]} />
        <meshStandardMaterial color="#cbbba6" roughness={0.7} metalness={0.04} />
      </mesh>
      <mesh position={[0, sill + winH + (h - sill - winH) / 2, -hz / 2 - WALL / 2]} castShadow>
        <boxGeometry args={[winW, h - sill - winH, WALL]} />
        <meshStandardMaterial color="#f3eee6" roughness={0.86} metalness={0} />
      </mesh>
      <mesh position={[-hx / 2 - WALL / 2, h / 2 - 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL, h + 0.12, hz]} />
        <meshStandardMaterial color="#f7f3ec" roughness={0.88} metalness={0} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[hx / 2 + WALL / 2, h / 2 - 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL, h + 0.12, hz]} />
        <meshStandardMaterial color="#f7f3ec" roughness={0.88} metalness={0} envMapIntensity={0.2} />
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
          color="#d5e4ee"
          transparent
          opacity={0.16}
          roughness={0.04}
          metalness={0.25}
          envMapIntensity={1.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {[-winW / 3, winW / 3].map((x) => (
        <mesh key={`mullion-v-${x}`} position={[x, sill + winH / 2, -hz / 2 - 0.02]}>
          <boxGeometry args={[0.045, winH, 0.07]} />
          <meshStandardMaterial color="#3c3834" roughness={0.42} metalness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, sill + winH * 0.52, -hz / 2 - 0.02]}>
        <boxGeometry args={[winW, 0.045, 0.07]} />
        <meshStandardMaterial color="#3c3834" roughness={0.42} metalness={0.45} />
      </mesh>

      {/* Decke + Lichtvouten */}
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[hx + 0.4, hz + 0.4]} />
        <meshStandardMaterial color="#f6f3ee" roughness={0.94} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, h - 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[hx - 2.2, hz - 2.2]} />
        <meshStandardMaterial color="#ebe4d8" roughness={0.9} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {[
        [0, h - 0.22, (hz - 2.2) / 2, hx - 2.4, 0.035],
        [0, h - 0.22, -(hz - 2.2) / 2, hx - 2.4, 0.035],
      ].map(([x, y, z, w, d], i) => (
        <mesh key={`cove-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, 0.025, d]} />
          <meshBasicMaterial color="#fff1dc" toneMapped={false} />
        </mesh>
      ))}
      {[
        [(hx - 2.2) / 2, h - 0.22, 0, 0.035, hz - 2.4],
        [-(hx - 2.2) / 2, h - 0.22, 0, 0.035, hz - 2.4],
      ].map(([x, y, z, w, d], i) => (
        <mesh key={`cove-s-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, 0.025, d]} />
          <meshBasicMaterial color="#fff1dc" toneMapped={false} />
        </mesh>
      ))}

      {[-hx * 0.16, hx * 0.16].map((x, i) => (
        <group key={`pendant${i}`} position={[x, h - 0.15, -hz * 0.06]}>
          <mesh position={[0, -0.42, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.84, 8]} />
            <meshStandardMaterial color="#2c2926" roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh position={[0, -0.92, 0]}>
            <cylinderGeometry args={[0.22, 0.34, 0.16, 24, 1, true]} />
            <meshStandardMaterial color="#f4efe6" roughness={0.72} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.9, 0]}>
            <circleGeometry args={[0.16, 20]} />
            <meshBasicMaterial color="#fff6e8" toneMapped={false} />
          </mesh>
          <pointLight position={[0, -1.15, 0]} color="#ffe7c8" intensity={3.4} distance={8} decay={2} />
        </group>
      ))}
      <pointLight position={[0, h - 0.7, hz * 0.22]} color="#fff0dc" intensity={5.5} distance={16} decay={2} />
      <pointLight position={[0, 2.6, -hz * 0.2]} color="#fff4e6" intensity={2.2} distance={12} decay={2} />

      <SpaLounge hx={hx} />
      {[
        [-hx / 2 + 0.08, 1.55, -hz * 0.08, Math.PI / 2, '#8d9a8c'],
        [hx / 2 - 0.08, 1.55, hz * 0.32, -Math.PI / 2, '#c4b5a0'],
      ].map(([x, y, pz, ry, color], i) => (
        <group key={`art-${i}`} position={[x, y, pz]} rotation={[0, ry, 0]}>
          <mesh>
            <boxGeometry args={[1.15, 0.78, 0.04]} />
            <meshStandardMaterial color="#2a2724" roughness={0.5} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.98, 0.62]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function SpaLounge({ hx }) {
  const wood = { color: '#5c4030', roughness: 0.55, metalness: 0.06 }
  const linen = { color: '#f4efe6', roughness: 0.92, metalness: 0 }
  return (
    <group position={[hx / 2 - 1.55, 0, 0.15]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.6, 2.05]} />
        <meshStandardMaterial color="#c9bfb0" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.16, 0.15]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.28, 0.92]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      <mesh position={[0, 0.34, 0.12]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.12, 0.78]} />
        <meshStandardMaterial {...linen} />
      </mesh>
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 0.52, 0.28]} castShadow>
          <boxGeometry args={[0.42, 0.28, 0.16]} />
          <meshStandardMaterial color="#e4d3c0" roughness={0.9} />
        </mesh>
      ))}
      {[-1.7, 1.7].map((x) => (
        <group key={`side-${x}`} position={[x, 0, 0.05]}>
          <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.42, 0.42]} />
            <meshStandardMaterial {...wood} />
          </mesh>
          <mesh position={[0, 0.56, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.16, 12]} />
            <meshStandardMaterial color="#9a8b78" roughness={0.45} metalness={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default React.memo(Indoor)
