import React, { useRef, useMemo, useEffect, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshTransmissionMaterial, useFBO } from '@react-three/drei'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../data/config'
import { makeSkyEnvTexture } from '../three/textures'
import { cornerRadiusFor, waterLevelFor } from '../three/footprint'
import { injectWaterWaves } from '../three/waterShader'
import { FLOAT_LAYER, SCENERY_LAYER, setFloatsVisible } from '../three/layers'

/**
 * Ruhige Pool-Oberfläche: dichte Tessellierung, Gerstner-Wellen (leichte Brise),
 * Kapillar-Rauschen, Meniskus an der Wand. Brechung bleibt MeshTransmission.
 *
 * Props: { length, width, depth, shape, led, envMode, pickable, resolution, samples }
 */

function clampToRoundedRect(x, z, hx, hz, r) {
  if (r <= 0.0001) {
    return {
      x: Math.max(-hx, Math.min(hx, x)),
      z: Math.max(-hz, Math.min(hz, z)),
    }
  }
  const bx = hx - r
  const bz = hz - r
  if (Math.abs(x) <= bx || Math.abs(z) <= bz) {
    return {
      x: Math.max(-hx, Math.min(hx, x)),
      z: Math.max(-hz, Math.min(hz, z)),
    }
  }
  const sx = Math.sign(x) || 1
  const sz = Math.sign(z) || 1
  const dx = x - sx * bx
  const dz = z - sz * bz
  const len = Math.hypot(dx, dz) || 1
  const k = Math.min(1, r / len)
  return { x: sx * bx + dx * k, z: sz * bz + dz * k }
}

function makeWaterGeometry(length, width, radius, wall, dense = false) {
  const lw = Math.max(0.4, length - wall)
  const ww = Math.max(0.4, width - wall)
  const hx = lw / 2
  const hz = ww / 2
  const r = Math.max(0, Math.min(radius - wall, hx - 0.02, hz - 0.02))
  const dens = dense ? 26 : 12
  const segX = Math.max(32, Math.min(120, Math.ceil(lw * dens)))
  const segZ = Math.max(20, Math.min(80, Math.ceil(ww * dens)))
  const g = new THREE.PlaneGeometry(lw, ww, segX, segZ)
  g.rotateX(-Math.PI / 2)
  if (r > 0.001) {
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const p = clampToRoundedRect(pos.getX(i), pos.getZ(i), hx, hz, r)
      pos.setXYZ(i, p.x, 0, p.z)
    }
    pos.needsUpdate = true
  }
  g.computeVertexNormals()
  return g
}

const WAVE_KEY = 'wj14'

function patchWaveMaterial(mat) {
  if (!mat || mat.userData.waveKey === WAVE_KEY) return
  if (!mat.userData.waveBaseCompile) {
    mat.userData.waveBaseCompile = mat.onBeforeCompile
  }
  const base = mat.userData.waveBaseCompile
  mat.onBeforeCompile = (shader, renderer) => {
    if (typeof base === 'function') base.call(mat, shader, renderer)
    injectWaterWaves(shader)
    mat.userData.shader = shader
  }
  const prevKey = mat.customProgramCacheKey?.bind(mat)
  mat.customProgramCacheKey = () => (prevKey ? prevKey() : '') + '|' + WAVE_KEY
  mat.userData.waveKey = WAVE_KEY
  mat.needsUpdate = true
}

function Water({
  length,
  width,
  depth = 1.5,
  shape,
  led,
  envMode = 'day',
  pickable = true,
  resolution = 512,
  samples = 2,
  jet = null,
}) {
  const meshRef = useRef()
  const matRef = useRef()
  const jetRef = useRef(jet)
  jetRef.current = jet
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const fbo = useFBO(resolution)
  const t = WALL_THICKNESS
  const r = cornerRadiusFor(shape)
  const baseY = waterLevelFor(shape)
  const isInfinity = shape === 'Infinity'
  const hx = (length - t) / 2
  const hz = (width - t) / 2
  const cornerR = Math.max(0, r - t)

  const dense = Boolean(jet)
  const geometry = useMemo(
    () => makeWaterGeometry(length, width, r, t, dense),
    [length, width, r, t, dense],
  )

  const skyEnv = useMemo(() => {
    const equirect = makeSkyEnvTexture(256, envMode)
    const pmrem = new THREE.PMREMGenerator(gl)
    pmrem.compileEquirectangularShader()
    const target = pmrem.fromEquirectangular(equirect)
    equirect.dispose()
    pmrem.dispose()
    return target.texture
  }, [gl, envMode])

  useEffect(
    () => () => {
      geometry.dispose()
    },
    [geometry],
  )

  useEffect(() => () => skyEnv.dispose(), [skyEnv])

  useLayoutEffect(() => {
    patchWaveMaterial(matRef.current)
  })

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    setFloatsVisible(false)
    state.camera.layers.disable(FLOAT_LAYER)
    state.camera.layers.disable(SCENERY_LAYER)

    const gl = state.gl
    const prevTone = gl.toneMapping
    const prevShadows = gl.shadowMap.enabled
    const prevAuto = gl.shadowMap.autoUpdate
    mesh.visible = false
    gl.toneMapping = THREE.NoToneMapping
    gl.shadowMap.enabled = false
    gl.shadowMap.autoUpdate = false
    try {
      gl.setRenderTarget(fbo)
      gl.render(state.scene, state.camera)
    } finally {
      gl.setRenderTarget(null)
      mesh.visible = true
      gl.shadowMap.enabled = prevShadows
      gl.shadowMap.autoUpdate = prevAuto
      gl.toneMapping = prevTone
      setFloatsVisible(true)
      state.camera.layers.enable(FLOAT_LAYER)
      state.camera.layers.enable(SCENERY_LAYER)
    }

    const mat = matRef.current
    if (mat) {
      patchWaveMaterial(mat)
      mat.buffer = fbo.texture
      const shader = mat.userData?.shader
      if (shader?.uniforms?.uTime) {
        shader.uniforms.uTime.value = state.clock.elapsedTime
        shader.uniforms.uHalf.value.set(hx, hz)
        shader.uniforms.uCornerR.value = cornerR
      }
      if (shader?.uniforms?.uJetOn) {
        const flow = jetRef.current
        const zOff = isInfinity ? t / 2 : 0
        shader.uniforms.uJetOn.value = flow ? 1 : 0
        if (flow) {
          shader.uniforms.uJetOrigin.value.set(flow.origin[0], flow.origin[1] - zOff)
          shader.uniforms.uJetDir.value.set(flow.dir[0], flow.dir[1])
        }
      }
    }
  }, -1)

  useEffect(() => () => {
    camera.layers.enable(FLOAT_LAYER)
    setFloatsVisible(true)
  }, [camera])

  const zOffset = isInfinity ? t / 2 : 0
  const thickness = Math.min(depth, 2.2) * 0.32
  const absorption = led ? 0.85 : envMode === 'day' ? 0.62 : 0.9

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, baseY, zOffset]}
      raycast={pickable ? undefined : () => {}}
    >
      <MeshTransmissionMaterial
        ref={matRef}
        buffer={fbo.texture}
        resolution={8}
        samples={samples}
        transmission={1}
        thickness={thickness}
        ior={1.333}
        roughness={0.038}
        metalness={0}
        chromaticAberration={0.012}
        anisotropicBlur={0.01}
        distortion={0}
        distortionScale={0}
        temporalDistortion={0}
        attenuationDistance={absorption}
        attenuationColor={led ? '#8fe4fb' : '#57b3cf'}
        color="#dceef5"
        envMap={skyEnv}
        envMapIntensity={envMode === 'day' ? 0.88 : 0.76}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

export default React.memo(Water)
