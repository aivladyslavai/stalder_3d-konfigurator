import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../../data/config'
import { lampCountFor, lampXs, lampY, ledEnvBoost, sampleLedColors } from '../../three/ledLight'

/**
 * Unterwasser-RGBW: körperliche Lampe in der Wand, Spot ins Becken,
 * weiche Lichtkugel im Wasser. Keine Billboard-Sprites auf der Oberfläche.
 */

const CHROME = {
  color: '#f4f8fa',
  metalness: 0.98,
  roughness: 0.07,
  envMapIntensity: 2.5,
  clearcoat: 0.7,
  clearcoatRoughness: 0.06,
}

const scatterVertex = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormalW;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const scatterFragment = /* glsl */ `
  precision highp float;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uWaterY;
  void main() {
    if (vWorld.y > uWaterY - 0.008) discard;
    vec3 viewDir = normalize(cameraPosition - vWorld);
    float ndv = abs(dot(normalize(vNormalW), viewDir));
    float a = pow(ndv, 2.6) * uOpacity;
    a *= smoothstep(0.0, 0.1, uWaterY - 0.02 - vWorld.y);
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor * (0.35 + 0.65 * ndv), a);
  }
`

const volumeVertex = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vWorld;
  void main() {
    vLocal = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const volumeFragment = /* glsl */ `
  precision highp float;
  varying vec3 vLocal;
  varying vec3 vWorld;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uLength;
  uniform float uRadius;
  uniform float uWaterY;

  void main() {
    if (vWorld.y > uWaterY - 0.008) discard;
    vec3 viewDir = normalize(cameraPosition - vWorld);
    vec3 axis = normalize((modelMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
    float side = 1.0 - abs(dot(viewDir, axis));
    side = mix(0.15, 1.0, pow(clamp(side, 0.0, 1.0), 0.7));

    float z = clamp(vLocal.z / uLength, 0.0, 1.0);
    float maxR = mix(0.02, uRadius, z);
    float r = length(vLocal.xy);
    float radial = 1.0 - smoothstep(maxR * 0.02, maxR, r);
    radial = pow(max(radial, 0.0), 2.4);

    float along = pow(1.0 - z, 0.55) * smoothstep(0.0, 0.08, z) * smoothstep(1.0, 0.78, z);
    float shimmer = 0.94 + 0.06 * sin(uTime * 0.9 + vLocal.z * 3.4);

    float a = radial * along * side * uOpacity * shimmer;
    a *= smoothstep(0.0, 0.1, uWaterY - 0.02 - vWorld.y);
    if (a < 0.008) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

function makeBeamGeometry(length, radius) {
  const g = new THREE.ConeGeometry(radius, length, 40, 1, true)
  g.rotateX(-Math.PI / 2)
  g.translate(0, 0, length / 2)
  return g
}

const ADDITIVE = {
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  depthTest: true,
  toneMapped: true,
  fog: false,
  side: THREE.FrontSide,
}

function RgbwLamp({
  lensRef,
  spotRef,
  fillRef,
  beamGeo,
  beamMat,
  scatterMat,
  mistMat,
  beamLength,
}) {
  const localSpot = useRef()
  const targetRef = useRef()

  useLayoutEffect(() => {
    const light = localSpot.current
    const target = targetRef.current
    if (!light || !target) return
    light.target = target
    target.updateMatrixWorld()
  }, [])

  const setSpot = (el) => {
    localSpot.current = el
    if (typeof spotRef === 'function') spotRef(el)
  }

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.055]}>
        <cylinderGeometry args={[0.148, 0.168, 0.1, 24]} />
        <meshStandardMaterial color="#b7c2c8" metalness={0.88} roughness={0.24} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]}>
        <cylinderGeometry args={[0.168, 0.168, 0.02, 24]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <torusGeometry args={[0.112, 0.01, 8, 24]} />
        <meshStandardMaterial color="#3a4046" roughness={0.7} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <circleGeometry args={[0.1, 28]} />
        <meshStandardMaterial
          ref={lensRef}
          color="#e8eef4"
          emissive="#dce8f4"
          emissiveIntensity={2.4}
          roughness={0.22}
          metalness={0}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.048]}>
        <sphereGeometry args={[0.082, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#eef6fa" roughness={0.08} metalness={0} transparent opacity={0.22} depthWrite={false} />
      </mesh>

      <mesh
        geometry={beamGeo}
        material={beamMat}
        position={[0, 0, 0.06]}
        scale={[1, 0.42, 1]}
        frustumCulled={false}
        renderOrder={2}
      />
      <mesh material={scatterMat} position={[0, 0, 0.14]} scale={0.28} frustumCulled={false} renderOrder={2}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <mesh material={mistMat} position={[0, 0.02, 0.22]} scale={0.34} frustumCulled={false} renderOrder={2}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>

      <object3D ref={targetRef} position={[0, -0.15, Math.max(1.8, beamLength * 0.85)]} />
      <spotLight
        ref={setSpot}
        position={[0, 0, 0.12]}
        angle={0.88}
        penumbra={0.85}
        intensity={16}
        distance={beamLength * 1.15}
        decay={2}
        color="#eef4ff"
        castShadow={false}
      />
      <pointLight
        ref={fillRef}
        position={[0, -0.08, 0.38]}
        color="#eef4ff"
        intensity={3.6}
        distance={2.8}
        decay={2}
        castShadow={false}
      />
    </group>
  )
}

function LedStrip({ poolLength, poolWidth, poolDepth, colorId = 'weiss', envMode = 'day', waterY = -0.02 }) {
  const count = lampCountFor(poolLength)
  const lensRefs = useRef([])
  const spotRefs = useRef([])
  const fillRefs = useRef([])
  const colorRef = useRef(colorId)
  colorRef.current = colorId
  const envRef = useRef(envMode)
  envRef.current = envMode
  const reduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const z = -poolWidth / 2 + WALL_THICKNESS + 0.06
  const y = lampY(poolDepth)
  const xs = useMemo(() => lampXs(poolLength, count), [poolLength, count])
  const beamLength = Math.max(1.15, poolWidth - WALL_THICKNESS * 2 - 0.14)
  const beamRadius = Math.min(0.55, Math.max(0.34, poolWidth * 0.18))

  const beamGeo = useMemo(() => makeBeamGeometry(beamLength, beamRadius), [beamLength, beamRadius])

  const beamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        name: 'LedVolume',
        uniforms: {
          uColor: { value: new THREE.Color('#7ab4ff') },
          uOpacity: { value: 0.22 },
          uTime: { value: 0 },
          uLength: { value: beamLength },
          uRadius: { value: beamRadius },
          uWaterY: { value: waterY },
        },
        vertexShader: volumeVertex,
        fragmentShader: volumeFragment,
        ...ADDITIVE,
      }),
    [beamLength, beamRadius],
  )

  const scatterMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        name: 'LedScatter',
        uniforms: {
          uColor: { value: new THREE.Color('#7ab4ff') },
          uOpacity: { value: 0.28 },
          uWaterY: { value: waterY },
        },
        vertexShader: scatterVertex,
        fragmentShader: scatterFragment,
        ...ADDITIVE,
      }),
    [],
  )

  const mistMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        name: 'LedMist',
        uniforms: {
          uColor: { value: new THREE.Color('#7ab4ff') },
          uOpacity: { value: 0.14 },
          uWaterY: { value: waterY },
        },
        vertexShader: scatterVertex,
        fragmentShader: scatterFragment,
        ...ADDITIVE,
      }),
    [],
  )

  useEffect(() => {
    beamMat.uniforms.uLength.value = beamLength
    beamMat.uniforms.uRadius.value = beamRadius
    beamMat.uniforms.uWaterY.value = waterY
    scatterMat.uniforms.uWaterY.value = waterY
    mistMat.uniforms.uWaterY.value = waterY
  }, [beamMat, scatterMat, mistMat, beamLength, beamRadius, waterY])

  useEffect(
    () => () => {
      beamGeo.dispose()
      beamMat.dispose()
      scatterMat.dispose()
      mistMat.dispose()
    },
    [beamGeo, beamMat, scatterMat, mistMat],
  )

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    const { emit, glow } = sampleLedColors(colorRef.current, time)
    const boost = ledEnvBoost(envRef.current)
    const pulse = reduceMotion.current ? 1 : 1 + Math.sin(time * 0.7) * 0.04

    beamMat.uniforms.uTime.value = time
    beamMat.uniforms.uColor.value.copy(glow)
    beamMat.uniforms.uOpacity.value = boost.volume * pulse
    scatterMat.uniforms.uColor.value.copy(glow)
    scatterMat.uniforms.uOpacity.value = boost.scatter * pulse
    mistMat.uniforms.uColor.value.copy(glow)
    mistMat.uniforms.uOpacity.value = boost.mist * pulse

    for (let i = 0; i < count; i++) {
      const lens = lensRefs.current[i]
      if (lens) {
        lens.emissive.copy(emit)
        lens.color.copy(glow)
        lens.emissiveIntensity = boost.lens * pulse
      }
      const spot = spotRefs.current[i]
      if (spot) {
        spot.color.copy(emit)
        spot.intensity = boost.spot * pulse
        spot.distance = beamLength * 1.15
      }
      const fill = fillRefs.current[i]
      if (fill) {
        fill.color.copy(glow)
        fill.intensity = boost.fill * pulse
      }
    }
  })

  return (
    <group>
      {xs.map((x, i) => (
        <group key={`${count}-${i}`} position={[x, y, z]}>
          <RgbwLamp
            lensRef={(el) => {
              lensRefs.current[i] = el
            }}
            spotRef={(el) => {
              spotRefs.current[i] = el
            }}
            fillRef={(el) => {
              fillRefs.current[i] = el
            }}
            beamGeo={beamGeo}
            beamMat={beamMat}
            scatterMat={scatterMat}
            mistMat={mistMat}
            beamLength={beamLength}
          />
        </group>
      ))}
    </group>
  )
}

export default React.memo(LedStrip)
