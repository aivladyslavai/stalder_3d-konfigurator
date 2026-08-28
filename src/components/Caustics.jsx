import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WALL_THICKNESS } from '../data/config'
import { roundedRectShape, cornerRadiusFor } from '../three/footprint'

/**
 * Foto-realistisches, animiertes Kaustik-Lichtnetz auf dem Beckenboden –
 * vollständig prozedural per GLSL-Shader (gleichmässige Verteilung, weiches
 * Schimmern). Wird additiv über den Boden gelegt.
 *
 * Props: { length, width, depth, shape, led, jet }
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Caustic-Funktion nach dem bekannten "TDM Caustic"-Verfahren (Shadertoy MdlXz8),
// hier zweifach überlagert für mehr Tiefe.
const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uScale;
  uniform float uOpacity;
  uniform vec2 uInner;
  uniform float uJetOn;
  uniform vec2 uJetOrigin;
  uniform vec2 uJetDir;

  #define TAU 6.28318530718
  #define ITER 5

  float caustic(vec2 uv, float time) {
    vec2 p = mod(uv * TAU, TAU) - 250.0;
    vec2 i = vec2(p);
    float c = 1.0;
    float inten = 0.005;
    for (int n = 0; n < ITER; n++) {
      float t = time * (1.0 - (3.5 / float(n + 1)));
      i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
    }
    c /= float(ITER);
    c = 1.17 - pow(c, 1.4);
    return pow(abs(c), 6.5);
  }

  float jetEnvelope(vec2 xz) {
    if (uJetOn < 0.001) return 0.0;
    vec2 dir = normalize(uJetDir);
    vec2 lat = vec2(-dir.y, dir.x);
    vec2 toP = xz - uJetOrigin;
    float along = dot(toP, dir);
    float across = dot(toP, lat);
    float width = mix(0.08, 0.7, pow(clamp(along / 3.1, 0.0, 1.0), 0.62));
    float radial = exp(-(across * across) / max(2.0 * width * width, 1e-4));
    float stream = smoothstep(-0.03, 0.12, along) * exp(-max(along, 0.0) * 0.13);
    float travel = 0.5 + 0.5 * sin(along * 9.0 - uTime * 6.4 + across * 4.0);
    return radial * stream * travel;
  }

  void main() {
    float t = uTime * 0.42 + 23.0;
    vec2 xz = (vUv - 0.5) * uInner;
    float jet = jetEnvelope(xz);
    vec2 warp = 0.035 * vec2(
      sin(vUv.y * 9.0 + uTime * 0.21),
      cos(vUv.x * 8.0 - uTime * 0.17)
    );
    warp += uJetDir * jet * 0.045;
    float a = caustic(vUv * uScale + warp, t);
    float b = caustic(vUv * uScale * 1.85 + 3.7 + warp.yx, t * 0.73);
    float c = caustic(vUv * uScale * 3.4 + vec2(5.1, -2.4), t * 1.11);
    float v = clamp(a * 0.55 + b * 0.38 + c * 0.22, 0.0, 1.0);
    v = pow(v, 1.12);
    v *= 1.0 + jet * 1.25;
    v += jet * 0.14;
    vec2 e = smoothstep(0.0, 0.14, vUv) * smoothstep(0.0, 0.14, 1.0 - vUv);
    v *= e.x * e.y;
    gl_FragColor = vec4(uColor * v, v * uOpacity);
  }
`

function Caustics({ length, width, depth, shape, led, jet = null }) {
  const jetRef = useRef(jet)
  jetRef.current = jet
  const t = WALL_THICKNESS
  const r = cornerRadiusFor(shape)
  const innerL = Math.max(0.4, length - t * 2)
  const innerW = Math.max(0.4, width - t * 2)

  const geometry = useMemo(() => {
    const shp = roundedRectShape(length - t * 2, width - t * 2, Math.max(0, r - t))
    const g = new THREE.ShapeGeometry(shp)
    g.rotateX(-Math.PI / 2)
    // UVs auf 0..1 normieren (ShapeGeometry liefert Meter-Koordinaten)
    g.computeBoundingBox()
    const bb = g.boundingBox
    const sx = bb.max.x - bb.min.x
    const sz = bb.max.z - bb.min.z
    const pos = g.attributes.position
    const uv = []
    for (let i = 0; i < pos.count; i++) {
      uv.push((pos.getX(i) - bb.min.x) / sx, (pos.getZ(i) - bb.min.z) / sz)
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    return g
  }, [length, width, t, r])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(led ? '#cdf2ff' : '#bfe9ff') },
      uScale: { value: Math.max(1.5, Math.min(length, width) * 0.9) },
      uOpacity: { value: 0.62 },
      uInner: { value: new THREE.Vector2(innerL, innerW) },
      uJetOn: { value: 0 },
      uJetOrigin: { value: new THREE.Vector2() },
      uJetDir: { value: new THREE.Vector2(1, 0) },
    }),
    [],
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        name: 'PoolCaustics',
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        customProgramCacheKey: () => 'pool-caustics-jet-v4',
      }),
    [uniforms],
  )

  useEffect(() => {
    uniforms.uColor.value.set(led ? '#cdf2ff' : '#bfe9ff')
    uniforms.uScale.value = Math.max(1.5, Math.min(length, width) * 0.9)
    uniforms.uInner.value.set(innerL, innerW)
  }, [led, length, width, innerL, innerW, uniforms])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime
    const flow = jetRef.current
    uniforms.uJetOn.value = flow ? 1 : 0
    if (flow) {
      uniforms.uJetOrigin.value.set(flow.origin[0], flow.origin[1])
      uniforms.uJetDir.value.set(flow.dir[0], flow.dir[1])
    }
  })

  const y = -depth + t + 0.015

  return <mesh geometry={geometry} material={material} position={[0, y, 0]} renderOrder={1} />
}

export default React.memo(Caustics)
