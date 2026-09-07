import React, { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'

import LoaderPoolMark from './LoaderPoolMark'

const MIN_MS = 3600
const MAX_MS = 14000
const BAR_MS = 6800
const FINISH_MS = 880

function crawlAt(ms) {
  const u = ms <= 0 ? 0 : ms >= BAR_MS ? 1 : ms / BAR_MS
  return 0.1 + 0.78 * u * (2 - u)
}

export default function LoadingScreen({ sceneReady }) {
  const active = useProgress((s) => s.active)
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const started = useRef(0)
  const done = useRef(false)
  const fillRef = useRef(null)
  const pctRef = useRef(null)
  const lastPct = useRef(-1)
  const leavingRef = useRef(false)
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  leavingRef.current = leaving

  useEffect(() => {
    let raf = 0
    let pos = 0.1
    let leaveAt = 0
    let leaveFrom = 0.1
    let lastDrawn = -1
    let bootCleared = false
    const origin = performance.now()
    if (!started.current) started.current = origin

    const applyBar = (value) => {
      const v = Math.round(value * 1000) / 1000
      if (v === lastDrawn) return
      lastDrawn = v
      if (fillRef.current) {
        fillRef.current.style.transform = `translate3d(${((v - 1) * 100).toFixed(3)}%,0,0)`
      }
      const rounded = Math.round(v * 100)
      if (pctRef.current && rounded !== lastPct.current) {
        lastPct.current = rounded
        pctRef.current.textContent = `${rounded}%`
      }
    }

    if (reduced) {
      document.getElementById('boot-screen')?.remove()
      applyBar(1)
      return undefined
    }

    const tick = (now) => {
      if (!bootCleared) {
        document.getElementById('boot-screen')?.remove()
        bootCleared = true
      }

      const elapsed = now - started.current
      if (leavingRef.current) {
        if (!leaveAt) {
          leaveAt = now
          leaveFrom = pos
        }
        const u = Math.min((now - leaveAt) / FINISH_MS, 1)
        const s = u * u * (3 - 2 * u)
        pos = leaveFrom + (1 - leaveFrom) * s
        if (pos > 0.997) pos = 1
      } else {
        pos = crawlAt(elapsed)
      }

      applyBar(pos)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  useEffect(() => {
    if (done.current) return undefined

    const finish = () => {
      if (done.current) return
      done.current = true
      setLeaving(true)
    }

    const origin = started.current || performance.now()
    const elapsed = performance.now() - origin
    if (elapsed >= MAX_MS) {
      finish()
      return undefined
    }

    if (sceneReady) {
      const extra = active ? 160 : 0
      const t = setTimeout(finish, Math.max(MIN_MS - elapsed, 640) + extra)
      return () => clearTimeout(t)
    }

    return undefined
  }, [active, sceneReady])

  useEffect(() => {
    const t = setTimeout(() => {
      if (!done.current) {
        done.current = true
        setLeaving(true)
      }
    }, MAX_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!leaving) return undefined
    const t = setTimeout(() => setVisible(false), 1750)
    return () => clearTimeout(t)
  }, [leaving])

  if (!visible) return null

  return (
    <div
      className={`scene-loader${leaving ? ' is-leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy={!leaving}
      aria-label="3D-Szene wird geladen"
    >
      <div className="scene-loader-inner">
        <img
          src="/brand/stalder-logo.svg"
          alt="Stalder Schwimmbadtechnik"
          className="scene-loader-logo"
          width={196}
          height={36}
        />
        <div className="kicker scene-loader-kicker">Pool-Konfigurator</div>
        <LoaderPoolMark variant={reduced ? 'complete' : 'loop'} />
        <div className="scene-loader-track" aria-hidden>
          <div ref={fillRef} className="scene-loader-fill" />
        </div>
        <p className="scene-loader-copy">
          3D-Szene wird geladen
          <span ref={pctRef} className="scene-loader-pct">
            {reduced ? '100%' : '10%'}
          </span>
        </p>
      </div>
    </div>
  )
}
