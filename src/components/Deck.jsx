import React, { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import {
  makeStoneNormalTexture,
  makePaverTexture,
  makeWoodTexture,
  makeConcreteTexture,
} from '../three/textures'
import { cornerRadiusFor, roundedRectShape } from '../three/footprint'
import { findDeckMaterial } from '../data/config'

const DECK_THICKNESS = 0.12
const MARGIN_X = 16 // Terrassenüberstand seitlich (m)
const MARGIN_Z = 13
const PAVER_SIZE = 1.2

/**
 * Durchgehende Boden-Platte (Terrasse / Raumboden) mit rechteckiger bzw.
 * abgerundeter Aussparung für das Becken. Der Belag (Naturstein, Holz, Beton)
 * ist wählbar.
 *
 * Props: { length, width, shape, deck }
 */
function Deck({ length, width, shape: poolShape, deck }) {
  const r = cornerRadiusFor(poolShape)
  const mat = findDeckMaterial(deck)

  const geometry = useMemo(() => {
    const outerL = length + MARGIN_X * 2
    const outerW = width + MARGIN_Z * 2
    const shape = new THREE.Shape()
    shape.moveTo(-outerL / 2, -outerW / 2)
    shape.lineTo(outerL / 2, -outerW / 2)
    shape.lineTo(outerL / 2, outerW / 2)
    shape.lineTo(-outerL / 2, outerW / 2)
    shape.lineTo(-outerL / 2, -outerW / 2)
    shape.holes.push(roundedRectShape(length, width, r))

    const geo = new THREE.ExtrudeGeometry(shape, { depth: DECK_THICKNESS, bevelEnabled: false })
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, -DECK_THICKNESS, 0)
    // UVs in Metern (Weltkoordinaten)
    const pos = geo.attributes.position
    const uv = []
    for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i), pos.getZ(i))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    return geo
  }, [length, width, r])

  // Belag-Textur je nach Art
  const colorMap = useMemo(() => {
    let tex
    if (mat.kind === 'wood') {
      tex = makeWoodTexture(512)
      tex.repeat.set(0.32, 1.0)
    } else if (mat.kind === 'concrete') {
      tex = makeConcreteTexture(512)
      tex.repeat.set(0.22, 0.22)
    } else {
      tex = makePaverTexture(256)
      tex.repeat.set(1 / PAVER_SIZE, 1 / PAVER_SIZE)
    }
    return tex
  }, [mat.kind])

  const normalMap = useMemo(() => {
    const tex = makeStoneNormalTexture(256, 20)
    tex.repeat.set(0.4, 0.4)
    return tex
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      colorMap.dispose()
      normalMap.dispose()
    }
  }, [geometry, colorMap, normalMap])

  return (
    <mesh geometry={geometry} position={[0, 0, 0]} receiveShadow castShadow>
      <meshStandardMaterial
        map={colorMap}
        color={mat.color}
        roughness={mat.roughness}
        metalness={0}
        normalMap={mat.kind === 'wood' ? null : normalMap}
        normalScale={[0.35, 0.35]}
        envMapIntensity={0.5}
      />
    </mesh>
  )
}

export default React.memo(Deck)
