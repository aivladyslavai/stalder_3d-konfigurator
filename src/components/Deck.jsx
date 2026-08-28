import React, { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import {
  makeStoneNormalTexture,
  makePaverTexture,
  makeWoodTexture,
  makeConcreteTexture,
} from '../three/textures'
import { cornerRadiusFor, roundedRectShape, deckOpeningFor } from '../three/footprint'
import { findDeckMaterial } from '../data/config'

const DECK_THICKNESS = 0.14
const LIP_THICKNESS = 0.012
const PAVER_SIZE = 1.2
const WOOD_TILE_L = 4.0
const WOOD_TILE_W = 1.6

function meterUVs(geo) {
  const pos = geo.attributes.position
  const uv = []
  for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i), pos.getZ(i))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return geo
}

/**
 * Terrassen-Podest rund um das Becken. Skimmer liegt bündig: die dicke
 * Aussparung folgt der Beckenaussenkante, ein dünner Belag reicht bis
 * an die schmale Einfassung. Überlauf lässt Platz für die Rinne.
 *
 * Props: { length, width, shape, deck, margin }
 */
function Deck({ length, width, shape: poolShape, deck, margin = 3.6 }) {
  const mat = findDeckMaterial(deck)
  const isInfinity = poolShape === 'Infinity'
  const r = cornerRadiusFor(poolShape)

  const geometry = useMemo(() => {
    const outerL = length + margin * 2
    const outerW = width + margin * 2
    const shape = new THREE.Shape()
    shape.moveTo(-outerL / 2, -outerW / 2)
    shape.lineTo(outerL / 2, -outerW / 2)
    shape.lineTo(outerL / 2, outerW / 2)
    shape.lineTo(-outerL / 2, outerW / 2)
    shape.lineTo(-outerL / 2, -outerW / 2)
    const opening = isInfinity ? deckOpeningFor(length, width, poolShape) : { length, width, radius: r }
    shape.holes.push(roundedRectShape(opening.length, opening.width, opening.radius))

    const geo = new THREE.ExtrudeGeometry(shape, { depth: DECK_THICKNESS, bevelEnabled: false })
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, -DECK_THICKNESS, 0)
    return meterUVs(geo)
  }, [length, width, r, margin, poolShape, isInfinity])

  const lipGeo = useMemo(() => {
    if (isInfinity) return null
    const opening = deckOpeningFor(length, width, poolShape)
    const ring = roundedRectShape(length, width, r)
    ring.holes.push(roundedRectShape(opening.length, opening.width, opening.radius))
    const geo = new THREE.ExtrudeGeometry(ring, { depth: LIP_THICKNESS, bevelEnabled: false })
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, -LIP_THICKNESS, 0)
    return meterUVs(geo)
  }, [length, width, r, poolShape, isInfinity])

  const colorMap = useMemo(() => {
    let tex
    if (mat.kind === 'wood') {
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

  const normalMap = useMemo(() => {
    if (mat.kind === 'wood') return null
    const tex = makeStoneNormalTexture(256, 20)
    tex.repeat.set(0.4, 0.4)
    return tex
  }, [mat.kind])

  useEffect(() => {
    return () => {
      geometry.dispose()
      lipGeo?.dispose()
      colorMap.dispose()
      normalMap?.dispose()
    }
  }, [geometry, lipGeo, colorMap, normalMap])

  const matProps = {
    map: colorMap,
    color: mat.color,
    roughness: mat.roughness,
    metalness: 0,
    normalMap,
    normalScale: [0.35, 0.35],
    envMapIntensity: 0.5,
  }

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial {...matProps} />
      </mesh>
      {lipGeo && (
        <mesh geometry={lipGeo} receiveShadow>
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
    </group>
  )
}

export default React.memo(Deck)
