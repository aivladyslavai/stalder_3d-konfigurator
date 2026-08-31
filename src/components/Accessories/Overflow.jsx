import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../../data/config'
import {
  GRATE_BAR_H,
  GRATE_BAR_W,
  GRATE_PITCH,
  overflowGrateLayout,
  roundedRectShape,
} from '../../three/footprint'

/**
 * Wasser in der Überlaufrinne: fliesst unter den Lamellen,
 * Kaustik und Schwall an der Wehrkante. Kein weisser Schaum.
 */

const CHANNEL_KEY = 7
const FLOOR_KEY = 3
const SLAT_KEY = 2

const NOISE_GLSL = /* glsl */ `
float chHash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float chNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = chHash12(i);
  float b = chHash12(i + vec2(1.0, 0.0));
  float c = chHash12(i + vec2(0.0, 1.0));
  float d = chHash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float chFbm(vec2 p) {
  return 0.5 * chNoise(p) + 0.25 * chNoise(p * 2.07) + 0.125 * chNoise(p * 4.19);
}
`

function patchCompile(mat, key, inject) {
  if (!mat || mat.userData.overflowKey === key) return
  const prev = mat.onBeforeCompile
  mat.onBeforeCompile = (shader, renderer) => {
    if (typeof prev === 'function') prev.call(mat, shader, renderer)
    inject(shader)
    mat.userData.shader = shader
  }
  const prevKey = mat.customProgramCacheKey?.bind(mat)
  mat.customProgramCacheKey = () => (prevKey ? prevKey() : '') + '|ovf' + key
  mat.userData.overflowKey = key
  mat.needsUpdate = true
}

function injectChannelWater(mat, layout) {
  patchCompile(mat, CHANNEL_KEY, (shader) => {
    shader.uniforms.uTime = shader.uniforms.uTime || { value: 0 }
    shader.uniforms.uPoolHalf = shader.uniforms.uPoolHalf || { value: new THREE.Vector2() }
    shader.uniforms.uGap = shader.uniforms.uGap || { value: layout.gap }
    shader.uniforms.uGrateW = shader.uniforms.uGrateW || { value: layout.g }
    shader.uniforms.uPitch = shader.uniforms.uPitch || { value: GRATE_PITCH }
    shader.uniforms.uBarW = shader.uniforms.uBarW || { value: GRATE_BAR_W }

    const uniforms = /* glsl */ `
      uniform float uTime;
      uniform vec2 uPoolHalf;
      uniform float uGap;
      uniform float uGrateW;
      uniform float uPitch;
      uniform float uBarW;
    `

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      ${uniforms}
      varying vec3 vChanW;
      varying float vAcross;
      varying float vAlong;
      ${NOISE_GLSL}
      `,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `
      #include <begin_vertex>
      {
        vec4 wp = modelMatrix * vec4(transformed, 1.0);
        vChanW = wp.xyz;
        vec2 q = abs(wp.xz);
        float ax = q.x - uPoolHalf.x - uGap;
        float az = q.y - uPoolHalf.y - uGap;
        vAcross = clamp(max(ax, az) / max(uGrateW, 0.05), 0.0, 1.0);
        vAlong = ax > az ? wp.z : wp.x;
        float pour = exp(-vAcross * 4.8);
        float waves = sin(vAlong * 16.0 - uTime * 5.1 + vAcross * 7.0) * 0.0056;
        waves += sin(vAlong * 37.0 - uTime * 8.2) * 0.0028;
        waves += sin(vAlong * 7.4 - uTime * 2.05) * 0.0038;
        waves += (chFbm(vec2(vAlong * 4.2 - uTime * 1.1, vAcross * 6.0)) - 0.5) * 0.0048;
        waves += pour * sin(vAlong * 22.0 - uTime * 6.4) * 0.0036;
        transformed.y += waves;
      }
      `,
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      ${uniforms}
      varying vec3 vChanW;
      varying float vAcross;
      varying float vAlong;
      ${NOISE_GLSL}
      `,
    )

    const tail = /* glsl */ `
      {
        float pour = exp(-vAcross * 5.2);
        float deep = smoothstep(0.05, 0.82, vAcross);
        float cell = fract(vAlong / max(uPitch, 0.001));
        float halfBar = 0.5 * uBarW / max(uPitch, 0.001);
        float under = 1.0 - smoothstep(halfBar * 0.65, halfBar + 0.14, abs(cell - 0.5));

        vec2 flowUv = vec2(vAlong * 4.6 - uTime * 1.35, vAcross * 8.4 + uTime * 0.18);
        float c1 = chFbm(flowUv);
        float c2 = chFbm(flowUv * 1.9 + vec2(2.7, -uTime * 0.38));
        float caus = pow(max(0.0, 1.0 - abs(c1 - c2) * 2.05), 3.6);
        float streak = chFbm(vec2(vAlong * 1.8 - uTime * 2.1, vAcross * 9.5));
        float ripple = 0.5 + 0.5 * sin(vAlong * 12.0 - uTime * 5.2 + vAcross * 8.0);

        vec3 deepCol = vec3(0.008, 0.07, 0.11);
        vec3 midCol = vec3(0.018, 0.2, 0.28);
        vec3 lipCol = vec3(0.07, 0.42, 0.5);
        vec3 body = mix(lipCol, midCol, smoothstep(0.0, 0.3, vAcross));
        body = mix(body, deepCol, deep * 0.8);
        body += vec3(0.28, 0.82, 0.9) * caus * (0.48 + pour * 0.55);
        body += vec3(0.05, 0.24, 0.3) * streak * 0.32;
        body += vec3(0.09, 0.36, 0.42) * ripple * pour * 0.22;
        body *= mix(1.0, 0.42, under);
        body = mix(body, body * vec3(0.7, 1.05, 1.1), pour * 0.35);

        vec3 spec = gl_FragColor.rgb;
        gl_FragColor.rgb = body * 0.82 + spec * 0.38;
        gl_FragColor.rgb += spec * spec * vec3(0.12, 0.2, 0.24);
      }
    `
    if (shader.fragmentShader.includes('#include <opaque_fragment>')) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>\n${tail}`,
      )
    } else {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <output_fragment>',
        `#include <output_fragment>\n${tail}`,
      )
    }
  })
}

function injectGrateSlats(mat) {
  patchCompile(mat, SLAT_KEY, (shader) => {
    shader.uniforms.uPitch = shader.uniforms.uPitch || { value: GRATE_PITCH }
    shader.uniforms.uBarW = shader.uniforms.uBarW || { value: GRATE_BAR_W }
    shader.uniforms.uUsed = shader.uniforms.uUsed || { value: 1 }
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uPitch;
      uniform float uBarW;
      uniform float uUsed;
      varying float vAlong;
      varying vec3 vAxisAlong;
      `,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vAlong = position.x;
      vAxisAlong = normalize(mat3(modelMatrix) * vec3(1.0, 0.0, 0.0));
      `,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uPitch;
      uniform float uBarW;
      uniform float uUsed;
      varying float vAlong;
      varying vec3 vAxisAlong;
      `,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
      if (abs(vAlong) > uUsed * 0.5 + 0.002) discard;
      float slatX = (fract((vAlong + uUsed * 0.5) / max(uPitch, 0.001)) - 0.5) * uPitch;
      if (abs(slatX) > uBarW * 0.52) discard;
      `,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
      {
        float t = clamp(slatX / max(uBarW * 0.5, 0.0001), -1.0, 1.0);
        vec3 nW = normalize(vAxisAlong * t + vec3(0.0, sqrt(max(0.0, 1.0 - t * t)), 0.0));
        normal = normalize(transformDirection(nW, viewMatrix));
      }
      `,
    )
  })
}

function injectFloorCaustics(mat) {
  patchCompile(mat, FLOOR_KEY, (shader) => {
    shader.uniforms.uTime = shader.uniforms.uTime || { value: 0 }
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uTime;
      varying vec2 vFloor;
      `,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vFloor = position.xy;
      `,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uTime;
      varying vec2 vFloor;
      ${NOISE_GLSL}
      `,
    )
    const tail = /* glsl */ `
      {
        vec2 uv = vec2(vFloor.x * 18.0 - uTime * 0.7, vFloor.y * 7.0);
        float c1 = chFbm(uv);
        float c2 = chFbm(uv * 1.7 + vec2(uTime * 0.25, 2.4));
        float caus = pow(max(0.0, 1.0 - abs(c1 - c2) * 2.1), 4.5);
        gl_FragColor.rgb += vec3(0.08, 0.42, 0.48) * caus * 0.55;
      }
    `
    if (shader.fragmentShader.includes('#include <opaque_fragment>')) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>\n${tail}`,
      )
    } else {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <output_fragment>',
        `#include <output_fragment>\n${tail}`,
      )
    }
  })
}

function syncTime(mats, t, layout, poolHalf) {
  for (const m of mats) {
    const sh = m?.userData?.shader
    if (!sh?.uniforms) continue
    if (sh.uniforms.uTime) sh.uniforms.uTime.value = t
    if (sh.uniforms.uPoolHalf) sh.uniforms.uPoolHalf.value.copy(poolHalf)
    if (sh.uniforms.uGap) sh.uniforms.uGap.value = layout.gap
    if (sh.uniforms.uGrateW) sh.uniforms.uGrateW.value = layout.g
    if (sh.uniforms.uPitch) sh.uniforms.uPitch.value = GRATE_PITCH
    if (sh.uniforms.uBarW) sh.uniforms.uBarW.value = GRATE_BAR_W
    if (sh.uniforms.uUsed && m.userData.used) sh.uniforms.uUsed.value = m.userData.used
  }
}

function makeLipGeometry(length, width, wall, waterY) {
  const innerL = Math.max(0.4, length - wall + 0.004)
  const innerW = Math.max(0.3, width - wall + 0.004)
  const outerL = length + 0.008
  const outerW = width + 0.008
  const shape = roundedRectShape(outerL, outerW, 0)
  shape.holes.push(roundedRectShape(innerL, innerW, 0))
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.003, bevelEnabled: false, steps: 1 })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, waterY + 0.003, 0)
  geo.computeVertexNormals()
  return geo
}

function ChannelWater({ length, width }) {
  const mats = useRef([])
  const layout = useMemo(() => overflowGrateLayout(length, width), [length, width])
  const poolHalf = useMemo(
    () => new THREE.Vector2(layout.poolHalf[0], layout.poolHalf[1]),
    [layout.poolHalf[0], layout.poolHalf[1]],
  )

  const sides = useMemo(
    () => [
      { key: 'n', pos: [0, layout.waterY, -layout.zEdge], rot: 0, along: layout.outerL },
      { key: 's', pos: [0, layout.waterY, layout.zEdge], rot: 0, along: layout.outerL },
      { key: 'w', pos: [-layout.xEdge, layout.waterY, 0], rot: Math.PI / 2, along: layout.innerW },
      { key: 'e', pos: [layout.xEdge, layout.waterY, 0], rot: Math.PI / 2, along: layout.innerW },
    ],
    [layout],
  )

  useLayoutEffect(() => {
    mats.current.forEach((m) => {
      if (!m) return
      if (m.userData.kind === 'channel') injectChannelWater(m, layout)
      else if (m.userData.kind === 'slat') injectGrateSlats(m)
      else if (m.userData.kind === 'floor') injectFloorCaustics(m)
    })
  })

  useFrame((state) => {
    syncTime(mats.current, state.clock.elapsedTime, layout, poolHalf)
  })

  const setMat = (i, kind, used) => (m) => {
    mats.current[i] = m
    if (m) {
      m.userData.kind = kind
      if (used) m.userData.used = used
      if (kind === 'channel') injectChannelWater(m, layout)
      else if (kind === 'slat') injectGrateSlats(m)
      else injectFloorCaustics(m)
    }
  }

  return (
    <group>
      {sides.map((s, i) => {
        const segs = Math.max(48, Math.ceil(s.along * 16))
        const base = i * 3
        const used = Math.max(4, Math.floor(s.along / GRATE_PITCH)) * GRATE_PITCH
        const slatY = layout.barY - layout.waterY + GRATE_BAR_H * 0.5 + 0.0008
        return (
          <group key={s.key} position={s.pos} rotation={[0, s.rot, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={1} receiveShadow>
              <planeGeometry args={[s.along, layout.g * 0.88, segs, 12]} />
              <meshPhysicalMaterial
                ref={setMat(base, 'channel')}
                color="#0d4d5c"
                roughness={0.045}
                metalness={0.08}
                envMapIntensity={2.2}
                clearcoat={1}
                clearcoatRoughness={0.05}
              />
            </mesh>
            <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0} receiveShadow>
              <planeGeometry args={[s.along, layout.g * 0.86, 8, 4]} />
              <meshPhysicalMaterial
                ref={setMat(base + 1, 'floor')}
                color="#041418"
                roughness={0.24}
                metalness={0.16}
                envMapIntensity={0.85}
              />
            </mesh>
            <mesh
              position={[0, slatY, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              renderOrder={3}
            >
              <planeGeometry args={[s.along, layout.g - 0.03]} />
              <meshPhysicalMaterial
                ref={setMat(base + 2, 'slat', used)}
                color="#f3f6f8"
                roughness={0.11}
                metalness={1}
                envMapIntensity={2.7}
                clearcoat={0.7}
                clearcoatRoughness={0.07}
                emissive="#3a4650"
                emissiveIntensity={0.2}
                polygonOffset
                polygonOffsetFactor={-2}
                polygonOffsetUnits={-2}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function OverflowFlow({ length, width, waterY = -0.004 }) {
  const t = WALL_THICKNESS
  const lipGeo = useMemo(
    () => makeLipGeometry(length, width, t, waterY),
    [length, width, t, waterY],
  )

  useEffect(() => () => lipGeo.dispose(), [lipGeo])

  return (
    <group>
      <ChannelWater length={length} width={width} />
      <mesh geometry={lipGeo} renderOrder={2}>
        <meshPhysicalMaterial
          color="#c5eef8"
          roughness={0.035}
          metalness={0.1}
          transparent
          opacity={0.22}
          envMapIntensity={2.2}
          clearcoat={1}
          clearcoatRoughness={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default React.memo(OverflowFlow)
