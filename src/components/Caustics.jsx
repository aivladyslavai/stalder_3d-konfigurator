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
 * Props: { length, width, depth, shape, led }
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
    return pow(abs(c), 8.0);
  }

  void main() {
    float t = uTime * 0.5 + 23.0;
    // zwei leicht versetzte Ebenen für lebendigeres Muster
    float a = caustic(vUv * uScale, t);
    float b = caustic(vUv * uScale * 1.7 + 4.0, t * 0.8);
    float v = clamp(a * 0.7 + b * 0.5, 0.0, 1.0);
    // sanfter Rand-Fade, damit es zu den Wänden ausläuft
    vec2 e = smoothstep(0.0, 0.12, vUv) * smoothstep(0.0, 0.12, 1.0 - vUv);
    v *= e.x * e.y;
    gl_FragColor = vec4(uColor * v, v * uOpacity);
  }
`

function Caustics({ length, width, depth, shape, led }) {
  const matRef = useRef()
  const t = WALL_THICKNESS
  const r = cornerRadiusFor(shape)

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
      uOpacity: { value: 0.9 },
    }),
    [], // Werte werden unten aktualisiert
  )

  useEffect(() => {
    uniforms.uColor.value.set(led ? '#cdf2ff' : '#bfe9ff')
    uniforms.uScale.value = Math.max(1.5, Math.min(length, width) * 0.9)
  }, [led, length, width, uniforms])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime
  })

  const y = -depth + t + 0.015

  return (
    <mesh geometry={geometry} position={[0, y, 0]} renderOrder={1}>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

export default React.memo(Caustics)
