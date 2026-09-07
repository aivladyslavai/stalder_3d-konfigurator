import React, { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'

import LoaderPoolMark from './LoaderPoolMark'

const MIN_MS = 700
const MAX_MS = 14000
const STIFF = 22
const DAMP = 2 * Math.sqrt(STIFF)

export default function LoadingScreen({ sceneReady }) {
  const progress = useProgress((s) => s.progress)
  const active = useProgress((s) => s.active)
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const started = useRef(typeof performance !== 'undefined' ? performance.now() : 0)
  const done = useRef(false)
  const fillRef = useRef(null)
  const pctRef = useRef(null)
  const poolRef = useRef(null)
  const lastPct = useRef(-1)
  const progressRef = useRef(progress)
  const leavingRef = useRef(false)

  progressRef.current = progress
  leavingRef.current = leaving

  useEffect(() => {
    document.getElementById('boot-screen')?.remove()
  }, [])

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let pos = 0.05
    let vel = 0
    let last = performance.now()

    const apply = (value) => {
      if (fillRef.current) {
        fillRef.current.style.transform = `translateZ(0) scaleX(${value})`
      }
      poolRef.current?.paint(value)
      const rounded = Math.round(value * 100)
      if (pctRef.current && rounded !== lastPct.current) {
        lastPct.current = rounded
        pctRef.current.textContent = `${rounded}%`
      }
    }

    if (reduced) {
      apply(1)
      return undefined
    }

    const tick = (now) => {
      const dt = Math.min(0.033, Math.max(0.008, (now - last) / 1000))
      last = now
      const elapsed = (now - started.current) / 1000
      const eased = 0.05 + (1 - Math.exp(-elapsed / 2.15)) * 0.83
      const loaded = Math.min((progressRef.current || 0) / 100, 0.96)
      const target = leavingRef.current ? 1 : Math.min(0.96, Math.max(eased, loaded))

      vel += ((target - pos) * STIFF - DAMP * vel) * dt
      pos += vel * dt
      if (pos < 0.04) pos = 0.04
      if (pos > 1) pos = 1
      if (leavingRef.current && pos > 0.995) {
        pos = 1
        vel = 0
      }

      apply(pos)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (done.current) return undefined

    const finish = () => {
      if (done.current) return
      done.current = true
      setLeaving(true)
    }

    const elapsed = performance.now() - started.current
    if (elapsed >= MAX_MS) {
      finish()
      return undefined
    }

    if (sceneReady) {
      const t = setTimeout(finish, Math.max(MIN_MS - elapsed, active ? 2400 - elapsed : 0, 0))
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
    const t = setTimeout(() => setVisible(false), 720)
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
        <LoaderPoolMark ref={poolRef} />
        <div className="scene-loader-track" aria-hidden>
          <div ref={fillRef} className="scene-loader-fill" />
        </div>
        <p className="scene-loader-copy">
          3D-Szene wird geladen
          <span ref={pctRef} className="scene-loader-pct">
            5%
          </span>
        </p>
      </div>
    </div>
  )
}
