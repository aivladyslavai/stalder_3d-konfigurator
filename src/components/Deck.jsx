import React, { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import {
  makeStoneNormalTexture,
  makePaverTexture,
  makeWoodTexture,
  makeConcreteTexture,
} from '../three/textures'
import { cornerRadiusFor, roundedRectShape, overflowInsetFor } from '../three/footprint'
import { findDeckMaterial } from '../data/config'

const DECK_THICKNESS = 0.14
const PAVER_SIZE = 1.2
const WOOD_TILE_L = 4.0 // Kachellänge in Dielenrichtung (m)
const WOOD_TILE_W = 1.6 // 10 Dielen à 16 cm (m)

/**
 * Terrassen-Podest rund um das Becken (bzw. Raumboden im Innenbereich) mit
 * Aussparung für den Pool. Der Belag ist wählbar.
 *
 * Props: { length, width, shape, deck, margin }
 */
function Deck({ length, width, shape: poolShape, deck, margin = 3.6 }) {
  const r = cornerRadiusFor(poolShape)
  const mat = findDeckMaterial(deck)

  const geometry = useMemo(() => {
    const outerL = length + margin * 2
    const outerW = width + margin * 2
    const shape = new THREE.Shape()
    shape.moveTo(-outerL / 2, -outerW / 2)
    shape.lineTo(outerL / 2, -outerW / 2)
    shape.lineTo(outerL / 2, outerW / 2)
    shape.lineTo(-outerL / 2, outerW / 2)
    shape.lineTo(-outerL / 2, -outerW / 2)
    // Überlaufbecken brauchen rundum Platz für die Rinne
    const inset = overflowInsetFor(poolShape)
    shape.holes.push(roundedRectShape(length + inset, width + inset, r + inset / 2))

    const geo = new THREE.ExtrudeGeometry(shape, { depth: DECK_THICKNESS, bevelEnabled: false })
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, -DECK_THICKNESS, 0)
    // UVs in Metern (Weltkoordinaten)
    const pos = geo.attributes.position
    const uv = []
    for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i), pos.getZ(i))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    return geo
  }, [length, width, r, margin, poolShape])

  const colorMap = useMemo(() => {
    let tex
    if (mat.kind === 'wood') {
      // Kachel = 4 m lang, 10 Dielen à 16 cm
      tex = makeWoodTexture(1024, 10)
      tex.repeat.set(1 / WOOD_TILE_L, 1 / WOOD_TILE_W)
    } else if (mat.kind === 'concrete') {
      tex = makeConcreteTexture(512)
      tex.repeat.set(0.22, 0.22)
    } else {
      tex = makePaverTexture(256)
      tex.repeat.set(1 / PAVER_SIZE, 1 / PAVER_SIZE)
    }
    return tex
  }, [mat.kind])

  // Holz erhält seine Struktur aus der Farbtextur – eine zusätzliche Normalmap
  // erzeugt hier nur grossflächige Streifen.
  const normalMap = useMemo(() => {
    if (mat.kind === 'wood') return null
    const tex = makeStoneNormalTexture(256, 20)
    tex.repeat.set(0.4, 0.4)
    return tex
  }, [mat.kind])

  useEffect(() => {
    return () => {
      geometry.dispose()
      colorMap.dispose()
      normalMap?.dispose()
    }
  }, [geometry, colorMap, normalMap])

  return (
    <mesh geometry={geometry} position={[0, 0, 0]} receiveShadow castShadow>
      <meshStandardMaterial
        map={colorMap}
        color={mat.color}
        roughness={mat.roughness}
        metalness={0}
        normalMap={normalMap}
        normalScale={[0.35, 0.35]}
        envMapIntensity={0.5}
      />
    </mesh>
  )
}

export default React.memo(Deck)
