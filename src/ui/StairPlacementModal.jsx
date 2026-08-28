import React, { useMemo } from 'react'
import { findStair, shortWallPlacementSpots, stairPlacementSpots } from '../data/config'
import { usePoolConfig } from '../hooks/usePoolConfig'

const PAD = 34

function poolBox(length, width) {
  const maxW = 176
  const maxH = 236
  if (length >= width) {
    let h = maxH
    let w = h * (width / length)
    if (w > maxW) {
      w = maxW
      h = w * (length / width)
    }
    return { innerW: w, innerH: h, portrait: true }
  }
  let w = maxW
  let h = w * (width / length)
  if (h > maxH) {
    h = maxH
    w = h * (length / width)
  }
  return { innerW: w, innerH: h, portrait: false }
}

function spotXY(id, innerW, innerH, portrait) {
  const map = portrait
    ? {
        west: [0.5, 0],
        east: [0.5, 1],
        north: [0, 0.5],
        south: [1, 0.5],
        nw: [0, 0],
        sw: [1, 0],
        ne: [0, 1],
        se: [1, 1],
      }
    : {
        west: [0, 0.5],
        east: [1, 0.5],
        north: [0.5, 0],
        south: [0.5, 1],
        nw: [0, 0],
        ne: [1, 0],
        sw: [0, 1],
        se: [1, 1],
      }
  const [u, v] = map[id] || [0.5, 0.5]
  return { x: PAD + u * innerW, y: PAD + v * innerH }
}

export default function StairPlacementModal() {
  const placing = usePoolConfig((s) => s.placing)
  const type = usePoolConfig((s) => s.type)
  const stair = usePoolConfig((s) => s.stair)
  const length = usePoolConfig((s) => s.length)
  const width = usePoolConfig((s) => s.width)
  const stairWall = usePoolConfig((s) => s.stairWall)
  const stairCorner = usePoolConfig((s) => s.stairCorner)
  const cancelPlacing = usePoolConfig((s) => s.cancelPlacing)
  const previewStairAnchor = usePoolConfig((s) => s.previewStairAnchor)
  const setStairAnchor = usePoolConfig((s) => s.setStairAnchor)
  const previewWallPlacement = usePoolConfig((s) => s.previewWallPlacement)
  const confirmWallPlacement = usePoolConfig((s) => s.confirmWallPlacement)

  const isStair = placing?.kind === 'stair'
  const isJet = placing?.kind === 'countercurrent'
  const stairItem = findStair(type, stair)
  const spots = useMemo(() => {
    if (isJet) return shortWallPlacementSpots()
    if (isStair) return stairPlacementSpots(stairItem.visual)
    return []
  }, [isJet, isStair, stairItem.visual])
  const { innerW, innerH, portrait } = useMemo(() => poolBox(length, width), [length, width])
  const svgW = innerW + PAD * 2
  const svgH = innerH + PAD * 2
  const rx = Math.min(10, innerW * 0.08, innerH * 0.08)

  if (!isStair && !isJet) return null

  const activeWall = isJet ? placing.preview?.wall : stairWall
  const isActive = (spot) => {
    if (spot.kind === 'corner') return stairCorner === spot.corner
    return activeWall === spot.wall
  }

  const revertPreview = () => {
    if (isStair && placing.restore) previewStairAnchor(placing.restore)
    if (isJet) {
      const wall = placing.restorePlacement?.wall || 'west'
      previewWallPlacement(wall)
    }
  }

  const onPreview = (spot) => {
    if (isStair) previewStairAnchor(spot)
    else previewWallPlacement(spot.wall)
  }

  const onConfirm = (spot) => {
    if (isStair) setStairAnchor(spot)
    else confirmWallPlacement(spot.wall)
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#0b1f33]/25 backdrop-blur-[2px]"
        aria-label="Abbrechen"
        onClick={cancelPlacing}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-title"
        className="stair-place-card relative w-[min(100%,300px)] rounded-[28px] bg-white px-6 pb-6 pt-5 shadow-[0_24px_60px_rgba(11,31,51,0.22)]"
      >
        <button
          type="button"
          onClick={cancelPlacing}
          className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Schliessen"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>

        <h2 id="place-title" className="pr-8 text-[17px] font-bold leading-snug text-[#002B6F]">
          Bitte platzieren Sie das Element:
        </h2>
        <p className="mt-1 text-[12px] font-medium text-gray-400">{placing.label}</p>

        <div className="mt-5 flex justify-center" onMouseLeave={revertPreview}>
          <div className="relative" style={{ width: svgW, height: svgH }}>
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} aria-hidden className="block">
              <defs>
                <linearGradient id="place-water" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8fd4f0" />
                  <stop offset="45%" stopColor="#4aa4d4" />
                  <stop offset="100%" stopColor="#2f7eb8" />
                </linearGradient>
              </defs>
              <rect x={PAD - 7} y={PAD - 7} width={innerW + 14} height={innerH + 14} rx={rx + 4} fill="#d8dee4" />
              <rect x={PAD - 4} y={PAD - 4} width={innerW + 8} height={innerH + 8} rx={rx + 2} fill="#b7c0c8" />
              <rect x={PAD} y={PAD} width={innerW} height={innerH} rx={rx} fill="url(#place-water)" />
              <ellipse
                cx={PAD + innerW * 0.5}
                cy={PAD + innerH * 0.28}
                rx={innerW * 0.32}
                ry={innerH * 0.12}
                fill="white"
                opacity="0.14"
              />
            </svg>

            {spots.map((spot) => {
              const { x, y } = spotXY(spot.id, innerW, innerH, portrait)
              const active = isActive(spot)
              return (
                <button
                  key={spot.id}
                  type="button"
                  aria-label={spot.label}
                  aria-pressed={active}
                  onMouseEnter={() => onPreview(spot)}
                  onFocus={() => onPreview(spot)}
                  onClick={() => onConfirm(spot)}
                  className={`stair-place-dot absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] transition-all duration-150 ${
                    active
                      ? 'border-[#002B6F] bg-[#002B6F] shadow-[0_0_0_6px_rgba(0,43,111,0.16)]'
                      : 'border-[#1a1a1a] bg-white hover:scale-110 hover:border-[#32B4E6] hover:shadow-[0_0_0_6px_rgba(50,180,230,0.22)]'
                  }`}
                  style={{ left: x, top: y }}
                >
                  {active && <span className="block h-2.5 w-2.5 rounded-full bg-white" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
