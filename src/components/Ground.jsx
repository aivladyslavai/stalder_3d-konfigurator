import React, { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { makeGrassTexture, makeGrassNormalTexture } from '../three/textures'

const SIZE = 52

/**
 * Rasen um die Terrasse. Ein Draw-Call, exaktes Loch, nahtlose Halm-Textur.
 * Keine extra Meshes, Lichter oder Halm-Instanzen.
 *
 * Props: { holeLength, holeWidth, timeOfDay }
 */

function patchLawnMaterial(mat, uHole) {
  if (!mat || mat.userData.lawnPatched) return
  const orig = mat.onBeforeCompile
  mat.customProgramCacheKey = () => 'lawn-v6'
  mat.onBeforeCompile = (shader, renderer) => {
    if (typeof orig === 'function') orig.call(mat, shader, renderer)
    shader.uniforms.uHole = uHole
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      /* glsl */ `
      #include <common>
      varying vec2 vLawnXZ;
      `,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `
      #include <begin_vertex>
      vLawnXZ = transformed.xz;
      `,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      /* glsl */ `
      #include <common>
      uniform vec2 uHole;
      varying vec2 vLawnXZ;
      `,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
      #include <color_fragment>
      {
        vec2 wp = vLawnXZ;
#ifdef USE_MAP
        vec3 lawnB = texture2D(map, wp.yx * 0.29 + vec2(0.41, 0.17)).rgb;
        vec3 lawnMix = mix(sampledDiffuseColor.rgb, lawnB, 0.48);
        diffuseColor.rgb *= lawnMix / max(sampledDiffuseColor.rgb, vec3(0.02));
#endif
        float mottled = 0.5 + 0.5 * sin(wp.x * 0.31) * sin(wp.y * 0.26);
        mottled = mix(mottled, 0.5 + 0.5 * sin(wp.x * 0.11 + wp.y * 0.08), 0.55);
        diffuseColor.rgb *= mix(vec3(0.9, 0.96, 0.9), vec3(1.06, 1.03, 0.97), mottled);
        vec2 q = abs(wp) - uHole;
        float edge = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
        float trim = 1.0 - smoothstep(0.0, 0.42, edge);
        diffuseColor.rgb *= mix(vec3(1.0), vec3(0.52, 0.64, 0.42), trim * 0.75);
      }
      `,
    )
  }
  mat.userData.lawnPatched = true
  mat.needsUpdate = true
}

function Ground({ holeLength, holeWidth, timeOfDay = 'day' }) {
  const uHole = useMemo(() => ({ value: new THREE.Vector2() }), [])
  uHole.value.set(holeLength / 2 + 0.01, holeWidth / 2 + 0.01)

  const bindLawn = (mat) => {
    patchLawnMaterial(mat, uHole)
  }

  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-SIZE / 2, -SIZE / 2)
    shape.lineTo(SIZE / 2, -SIZE / 2)
    shape.lineTo(SIZE / 2, SIZE / 2)
    shape.lineTo(-SIZE / 2, SIZE / 2)
    shape.lineTo(-SIZE / 2, -SIZE / 2)

    const hl = holeLength / 2
    const hw = holeWidth / 2
    const hole = new THREE.Path()
    hole.moveTo(-hl, -hw)
    hole.lineTo(hl, -hw)
    hole.lineTo(hl, hw)
    hole.lineTo(-hl, hw)
    hole.lineTo(-hl, -hw)
    shape.holes.push(hole)

    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    const uv = []
    for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i), pos.getZ(i))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    return geo
  }, [holeLength, holeWidth])

  const map = useMemo(() => {
    const tex = makeGrassTexture(512)
    tex.repeat.set(1 / 2.4, 1 / 2.4)
    return tex
  }, [])

  const normalMap = useMemo(() => {
    const tex = makeGrassNormalTexture(256)
    tex.repeat.set(1 / 1.5, 1 / 1.5)
    tex.anisotropy = 8
    return tex
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      map.dispose()
      normalMap.dispose()
    }
  }, [geometry, map, normalMap])

  return (
    <mesh geometry={geometry} position={[0, -0.08, 0]} receiveShadow>
      <meshStandardMaterial
        ref={bindLawn}
        map={map}
        normalMap={normalMap}
        normalScale={[0.48, 0.48]}
        color={timeOfDay === 'dusk' ? '#9eae8a' : '#ffffff'}
        roughness={0.86}
        metalness={0}
        envMapIntensity={0.38}
      />
    </mesh>
  )
}

export default React.memo(Ground)
