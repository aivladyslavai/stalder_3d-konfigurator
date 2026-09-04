import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// --- Materialpalette ---

const SHELL_TOP = {
  color: '#1a2734',
  roughness: 0.34,
  metalness: 0.28,
  envMapIntensity: 1.35,
  emissive: '#1a4860',
  emissiveIntensity: 0.32,
}

const SHELL_BOT = {
  color: '#0f171e',
  roughness: 0.52,
  metalness: 0.18,
  envMapIntensity: 0.9,
  emissive: '#0c2a3a',
  emissiveIntensity: 0.22,
}

const SHELL_ACCENT = {
  color: '#2a3e4e',
  roughness: 0.3,
  metalness: 0.25,
  envMapIntensity: 1.1,
  emissive: '#1a3848',
  emissiveIntensity: 0.2,
}

const RUBBER = {
  color: '#0e1012',
  roughness: 0.92,
  metalness: 0.02,
  envMapIntensity: 0.18,
  emissive: '#08101a',
  emissiveIntensity: 0.12,
}

const CHROME = {
  color: '#c5d2da',
  roughness: 0.12,
  metalness: 0.95,
  envMapIntensity: 2.2,
  emissive: '#1e3844',
  emissiveIntensity: 0.14,
}

const CHROME_SATIN = {
  color: '#9cabb6',
  roughness: 0.28,
  metalness: 0.88,
  envMapIntensity: 1.5,
  emissive: '#182e3a',
  emissiveIntensity: 0.12,
}

const BRUSH_CORE = {
  color: '#2e261e',
  roughness: 0.82,
  metalness: 0.06,
  envMapIntensity: 0.3,
  emissive: '#1a140c',
  emissiveIntensity: 0.1,
}

const BRUSH_BRISTLE = {
  color: '#4a3e30',
  roughness: 0.95,
  metalness: 0.02,
  envMapIntensity: 0.2,
  emissive: '#221a10',
  emissiveIntensity: 0.06,
}

const INTAKE_GRILL = {
  color: '#182028',
  roughness: 0.55,
  metalness: 0.35,
  envMapIntensity: 0.8,
  emissive: '#0e1820',
  emissiveIntensity: 0.18,
}

const LABEL_STALDER = {
  color: '#96917E',
  roughness: 0.32,
  metalness: 0.45,
  envMapIntensity: 1.0,
  emissive: '#4a4838',
  emissiveIntensity: 0.18,
}

// --- Prozedurale Texturen ---

function makeTrackTex() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#0e1012'
  ctx.fillRect(0, 0, 512, 128)
  for (let i = 0; i < 24; i++) {
    const x = i * 22
    // chevron tread
    ctx.fillStyle = i % 2 ? '#0a0b0d' : '#181b1e'
    ctx.beginPath()
    ctx.moveTo(x + 1, 8)
    ctx.lineTo(x + 14, 8)
    ctx.lineTo(x + 19, 64)
    ctx.lineTo(x + 14, 120)
    ctx.lineTo(x + 1, 120)
    ctx.lineTo(x - 4, 64)
    ctx.closePath()
    ctx.fill()
    // wear highlights
    ctx.fillStyle = 'rgba(255,255,255,0.035)'
    ctx.fillRect(x + 3, 18, 7, 14)
    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    ctx.fillRect(x + 3, 96, 7, 14)
  }
  // edge seam
  ctx.fillStyle = 'rgba(60,70,80,0.22)'
  ctx.fillRect(0, 0, 512, 2)
  ctx.fillRect(0, 126, 512, 2)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 1)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function makeFilterMeshTex() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#3a4a56'
  ctx.fillRect(0, 0, 128, 128)
  for (let y = 0; y < 128; y += 6) {
    for (let x = 0; x < 128; x += 6) {
      ctx.fillStyle = (x + y) % 12 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.12)'
      ctx.fillRect(x, y, 4, 4)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 2)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

// --- Subcomponents ---

function Track({ z, map }) {
  const wheels = useRef([])
  useFrame((_, dt) => {
    for (const w of wheels.current) if (w) w.rotation.x += dt * 2.6
  })

  const sprocketGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.036, 0.036, 0.074, 18)
    return g
  }, [])

  return (
    <group position={[0, -0.054, z]}>
      {/* belt */}
      <RoundedBox args={[0.42, 0.082, 0.062]} radius={0.028} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial {...RUBBER} map={map} />
      </RoundedBox>
      {/* sprockets */}
      {[-0.145, -0.05, 0.05, 0.145].map((x, i) => (
        <mesh
          key={x}
          ref={(el) => { wheels.current[i] = el }}
          position={[x, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          geometry={sprocketGeo}
          castShadow
        >
          <meshStandardMaterial {...CHROME_SATIN} />
        </mesh>
      ))}
      {/* axle */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.42, 8]} />
        <meshStandardMaterial {...CHROME_SATIN} />
      </mesh>
    </group>
  )
}

function BrushRoller({ x }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 5.8
  })
  return (
    <group ref={ref} position={[x, -0.038, 0]}>
      {/* core */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.32, 20]} />
        <meshStandardMaterial {...BRUSH_CORE} />
      </mesh>
      {/* bristle rows */}
      {Array.from({ length: 7 }, (_, i) => {
        const z = -0.12 + i * 0.04
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.034, 0.008, 6, 18]} />
            <meshStandardMaterial {...BRUSH_BRISTLE} />
          </mesh>
        )
      })}
      {/* end caps */}
      {[-0.162, 0.162].map((zz) => (
        <mesh key={zz} position={[0, 0, zz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.026, 0.026, 0.008, 16]} />
          <meshStandardMaterial {...CHROME_SATIN} />
        </mesh>
      ))}
    </group>
  )
}

function IntakeGrill({ y }) {
  return (
    <group position={[0, y, 0]}>
      {/* housing */}
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.016, 0.22]} />
        <meshStandardMaterial {...INTAKE_GRILL} />
      </mesh>
      {/* slats */}
      {Array.from({ length: 5 }, (_, i) => {
        const z = -0.08 + i * 0.04
        return (
          <mesh key={i} position={[0, 0.004, z]}>
            <boxGeometry args={[0.24, 0.004, 0.006]} />
            <meshStandardMaterial {...SHELL_ACCENT} />
          </mesh>
        )
      })}
    </group>
  )
}

function CablePort() {
  return (
    <group position={[-0.232, 0.04, 0]}>
      {/* port ring */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.018, 0.005, 8, 16]} />
        <meshStandardMaterial {...CHROME_SATIN} />
      </mesh>
      {/* cable stub */}
      <mesh position={[-0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.009, 0.009, 0.04, 10]} />
        <meshStandardMaterial color="#1a1e22" roughness={0.8} emissive="#0a1218" emissiveIntensity={0.12} />
      </mesh>
    </group>
  )
}

// --- Main ---

/**
 * Dolphin-ähnlicher Bodenroboter: zweiteiliges Gehäuse, Filterkorb mit
 * Mesh-Deckel, Chrom-Tragegriff, Gummiketten auf Edelstahl-Ritzeln,
 * Bürstenwalzen, Ansaugrost, Kabelanschluss und pulsierende LED.
 * Emissive sorgt dafür, dass der Roboter unter der MeshTransmission-Wasser-
 * oberfläche nicht unsichtbar wird.
 */
export default function Robot({ position, variant = 'X60', poolDepth }) {
  const body = useRef()
  const led1 = useRef()
  const led2 = useRef()
  const scale = variant === 'X80' ? 1.14 : 1

  const trackMap = useMemo(() => makeTrackTex(), [])
  const filterMap = useMemo(() => makeFilterMeshTex(), [])
  useEffect(() => () => { trackMap.dispose(); filterMap.dispose() }, [trackMap, filterMap])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (body.current) body.current.rotation.y = Math.sin(t * 0.22) * 0.55
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.1)
    if (led1.current) led1.current.material.emissiveIntensity = 0.4 + pulse * 0.7
    if (led2.current) led2.current.material.emissiveIntensity = 0.2 + pulse * 0.5
  })

  return (
    <group
      ref={body}
      position={[position[0], -poolDepth + 0.118, position[2]]}
      scale={scale}
    >
      {/* ---- untere Hälfte (Fahrwerk-Chassis) ---- */}
      <RoundedBox args={[0.48, 0.072, 0.36]} radius={0.028} smoothness={4} position={[0, -0.008, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...SHELL_BOT} />
      </RoundedBox>

      {/* ---- obere Hälfte (Gehäuse) ---- */}
      <RoundedBox args={[0.46, 0.11, 0.34]} radius={0.042} smoothness={5} position={[0, 0.048, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...SHELL_TOP} />
      </RoundedBox>

      {/* Mittelnaht / Trennlinie */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.47, 0.004, 0.35]} />
        <meshStandardMaterial color="#0a1218" roughness={0.7} emissive="#061018" emissiveIntensity={0.1} />
      </mesh>

      {/* ---- Filterkorb-Deckel (halbtransparent) ---- */}
      <RoundedBox args={[0.34, 0.038, 0.24]} radius={0.016} smoothness={3} position={[0, 0.096, 0]} castShadow>
        <meshPhysicalMaterial
          color="#4a6070"
          roughness={0.08}
          metalness={0.12}
          transmission={0.28}
          thickness={0.05}
          transparent
          opacity={0.74}
          envMapIntensity={1.6}
          emissive="#1a3848"
          emissiveIntensity={0.24}
          map={filterMap}
        />
      </RoundedBox>

      {/* Deckel-Verriegelung */}
      <mesh position={[0, 0.116, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.055, 0.006, 8, 24]} />
        <meshStandardMaterial {...CHROME_SATIN} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.112, s * 0.06]}>
          <boxGeometry args={[0.07, 0.006, 0.016]} />
          <meshStandardMaterial {...SHELL_ACCENT} />
        </mesh>
      ))}

      {/* ---- Tragegriff (Chrom) ---- */}
      <mesh position={[0, 0.162, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.12, 0.01, 12, 28, Math.PI]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {/* Griffbefestigungen */}
      {[-0.12, 0.12].map((z) => (
        <group key={z} position={[0, 0.1, z]}>
          <mesh>
            <sphereGeometry args={[0.014, 14, 14]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
          <mesh position={[0, 0.016, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.032, 8]} />
            <meshStandardMaterial {...CHROME_SATIN} />
          </mesh>
        </group>
      ))}

      {/* ---- Front-Abschnitt ---- */}
      {/* Düsenkopf */}
      <mesh position={[0.225, 0.028, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.032, 0.038, 0.05, 22]} />
        <meshStandardMaterial {...SHELL_ACCENT} />
      </mesh>
      {/* LED-Ring */}
      <mesh position={[0.252, 0.028, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.024, 0.005, 8, 18]} />
        <meshStandardMaterial color="#70d8ff" emissive="#5ad4ff" emissiveIntensity={0.5} roughness={0.12} />
      </mesh>
      {/* LED-Hauptauge */}
      <mesh ref={led1} position={[0.258, 0.028, 0]}>
        <sphereGeometry args={[0.018, 18, 18]} />
        <meshStandardMaterial color="#a0eaff" emissive="#5ad4ff" emissiveIntensity={0.9} roughness={0.1} />
      </mesh>

      {/* ---- Seitenakzente ---- */}
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* Stalder taupe Streifen */}
          <mesh position={[0, 0.038, s * 0.172]} rotation={[s * 0.08, 0, 0]}>
            <boxGeometry args={[0.34, 0.022, 0.008]} />
            <meshStandardMaterial {...LABEL_STALDER} />
          </mesh>
          {/* Lüftungsschlitze */}
          {[-0.08, -0.04, 0, 0.04, 0.08].map((x) => (
            <mesh key={x} position={[x, 0.066, s * 0.171]}>
              <boxGeometry args={[0.022, 0.008, 0.004]} />
              <meshStandardMaterial {...INTAKE_GRILL} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ---- Ansaugrost (Unterseite) ---- */}
      <IntakeGrill y={-0.05} />

      {/* ---- Ketten ---- */}
      <Track z={0.188} map={trackMap} />
      <Track z={-0.188} map={trackMap} />

      {/* ---- Bürstenwalzen ---- */}
      <BrushRoller x={0.22} />
      <BrushRoller x={-0.22} />

      {/* ---- Kabelanschluss (Heck) ---- */}
      <CablePort />

      {/* ---- Heck-LED (X80 Variante) ---- */}
      {variant === 'X80' && (
        <mesh ref={led2} position={[-0.235, 0.06, 0]}>
          <sphereGeometry args={[0.012, 14, 14]} />
          <meshStandardMaterial color="#ffd466" emissive="#e6b800" emissiveIntensity={0.6} roughness={0.15} />
        </mesh>
      )}
    </group>
  )
}
