import React, { useRef, useMemo, useEffect, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshTransmissionMaterial, useFBO } from '@react-three/drei'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../data/config'
import { makeSkyEnvTexture } from '../three/textures'
import { cornerRadiusFor, waterLevelFor } from '../three/footprint'
import { injectWaterWaves } from '../three/waterShader'
import { FLOAT_LAYER, setFloatsVisible } from '../three/layers'

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

function makeWaterGeometry(length, width, radius, wall) {
  const lw = Math.max(0.4, length - wall)
  const ww = Math.max(0.4, width - wall)
  const hx = lw / 2
  const hz = ww / 2
  const r = Math.max(0, Math.min(radius - wall, hx - 0.02, hz - 0.02))
  const segX = Math.max(48, Math.min(160, Math.ceil(lw * 22)))
  const segZ = Math.max(32, Math.min(120, Math.ceil(ww * 22)))
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

function patchWaveMaterial(mat) {
  if (!mat || mat.userData.wavesPatched) return
  const orig = mat.onBeforeCompile
  mat.onBeforeCompile = (shader, renderer) => {
    orig.call(mat, shader, renderer)
    injectWaterWaves(shader)
    mat.userData.shader = shader
  }
  mat.userData.wavesPatched = true
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
  samples = 8,
}) {
  const meshRef = useRef()
  const matRef = useRef()
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

  const geometry = useMemo(() => makeWaterGeometry(length, width, r, t), [length, width, r, t])

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
  }, [])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    setFloatsVisible(false)
    state.camera.layers.disable(FLOAT_LAYER)
    const hidden = []
    state.scene.traverse((o) => {
      if (o.userData?.waterFloat) {
        hidden.push(o)
        o.visible = false
      }
    })

    const prevTone = state.gl.toneMapping
    state.gl.toneMapping = THREE.NoToneMapping
    mesh.visible = false
    state.gl.setRenderTarget(fbo)
    state.gl.render(state.scene, state.camera)
    state.gl.setRenderTarget(null)
    mesh.visible = true
    state.gl.toneMapping = prevTone

    hidden.forEach((o) => {
      o.visible = true
    })
    setFloatsVisible(true)
    state.camera.layers.enable(FLOAT_LAYER)

    if (matRef.current) matRef.current.buffer = fbo.texture
  }, -1)

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    patchWaveMaterial(matRef.current)
    const shader = matRef.current?.userData?.shader
    if (shader?.uniforms?.uTime) {
      shader.uniforms.uTime.value = time
      shader.uniforms.uHalf.value.set(hx, hz)
      shader.uniforms.uCornerR.value = cornerR
    }
  })

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
        roughness={0.045}
        metalness={0}
        chromaticAberration={0}
        anisotropicBlur={0.018}
        distortion={0}
        distortionScale={0}
        temporalDistortion={0}
        attenuationDistance={absorption}
        attenuationColor={led ? '#8fe4fb' : '#57b3cf'}
        color="#dceef5"
        envMap={skyEnv}
        envMapIntensity={envMode === 'day' ? 0.78 : 0.7}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

export default React.memo(Water)
