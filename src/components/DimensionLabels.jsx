import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { deckOpeningFor } from '../three/footprint'
import { applyLayer, SCENERY_LAYER } from '../three/layers'

function formatMeters(value) {
  return `${value.toFixed(2).replace('.', ',')} m`
}

function useMulishReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const done = () => {
      if (alive) setReady(true)
    }
    const fallback = setTimeout(done, 700)
    if (document.fonts?.load) {
      document.fonts
        .load('700 192px Mulish')
        .catch(() => {})
        .finally(() => {
          clearTimeout(fallback)
          done()
        })
    } else {
      done()
    }
    return () => {
      alive = false
      clearTimeout(fallback)
    }
  }, [])
  return ready
}

function makeLabelTexture(text) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const fontSize = 192
  const font = `700 ${fontSize}px Mulish, "Helvetica Neue", Arial, sans-serif`
  ctx.font = font
  const textW = Math.ceil(ctx.measureText(text).width)
  canvas.width = Math.max(256, textW + 96)
  canvas.height = 256
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  const x = canvas.width / 2
  const y = canvas.height / 2
  ctx.lineWidth = 28
  ctx.strokeStyle = 'rgba(25, 25, 35, 0.42)'
  ctx.strokeText(text, x, y)
  ctx.fillStyle = '#fefefe'
  ctx.fillText(text, x, y)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function DimLabel({ text, position, rotationY, height }) {
  const texture = useMemo(() => makeLabelTexture(text), [text])
  useEffect(() => () => texture.dispose(), [texture])

  const aspect = texture.image.width / texture.image.height
  const w = height * aspect

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={22} raycast={() => null}>
        <planeGeometry args={[w, height]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

/**
 * Länge und Breite als weisse Masse auf der Terrasse — sichtbar, wenn Masse aktiv.
 */
export default function DimensionLabels({ length, width, shape }) {
  const fontReady = useMulishReady()
  const ref = useRef()

  useLayoutEffect(() => {
    applyLayer(ref.current, SCENERY_LAYER)
  }, [fontReady, length, width, shape])

  const opening = deckOpeningFor(length, width, shape)
  const holeL = shape === 'Infinity' ? opening.length : length
  const holeW = shape === 'Infinity' ? opening.width : width
  const height = THREE.MathUtils.clamp(Math.min(length, width) * 0.145, 0.34, 0.56)
  const pad = 0.28 + height * 0.42

  return (
    <group ref={ref}>
      {fontReady && (
        <>
          <DimLabel
            text={formatMeters(length)}
            position={[0, 0.018, holeW / 2 + pad]}
            rotationY={0}
            height={height}
          />
          <DimLabel
            text={formatMeters(width)}
            position={[-(holeL / 2 + pad), 0.018, 0]}
            rotationY={Math.PI / 2}
            height={height}
          />
        </>
      )}
    </group>
  )
}
