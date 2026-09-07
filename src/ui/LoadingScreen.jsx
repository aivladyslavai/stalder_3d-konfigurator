import React, { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'

import LoaderPoolMark from './LoaderPoolMark'

const MIN_MS = 3800
const MAX_MS = 14000
const BUILD_MS = 3200
const TAU_POS = 1.05
const TAU_POS_FINISH = 0.52
const POOL_TAU = 0.18

function smooth01(u) {
  const t = u < 0 ? 0 : u > 1 ? 1 : u
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export default function LoadingScreen({ sceneReady }) {
  const active = useProgress((s) => s.active)
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const started = useRef(0)
  const done = useRef(false)
  const fillRef = useRef(null)
  const pctRef = useRef(null)
  const poolRef = useRef(null)
  const lastPct = useRef(-1)
  const leavingRef = useRef(false)

  leavingRef.current = leaving

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let aim = 0.08
    let pos = 0.08
    let poolPos = 0.04
    let last = performance.now()
    let lastDrawn = -1
    let poolDone = false
    let bootCleared = false
    if (!started.current) started.current = last

    const applyBar = (value) => {
      const v = Math.round(value * 10000) / 10000
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
      poolRef.current?.paint(1)
      return undefined
    }

    const tick = (now) => {
      let dt = (now - last) / 1000
      if (dt > 0.033) dt = 0.033
      if (dt < 0.001) dt = 0.001
      last = now

      if (!bootCleared) {
        document.getElementById('boot-screen')?.remove()
        bootCleared = true
      }

      const elapsed = now - started.current
      const crawl = 0.08 + (1 - Math.exp(-elapsed / 4200)) * 0.8
      const target = leavingRef.current ? 1 : crawl
      const tauPos = leavingRef.current ? TAU_POS_FINISH : TAU_POS
      aim += (target - aim) * (1 - Math.exp(-dt / tauPos))
      let next = pos + (aim - pos) * (1 - Math.exp(-dt / tauPos))
      if (!leavingRef.current && next < pos) next = pos
      pos = next
      if (pos < 0.08) pos = 0.08
      if (pos > 1) pos = 1
      if (leavingRef.current && pos > 0.997) pos = 1
      applyBar(pos)

      const poolTarget = leavingRef.current ? 1 : smooth01(Math.min(elapsed / BUILD_MS, 1))
      const pooled = poolPos + (poolTarget - poolPos) * (1 - Math.exp(-dt / POOL_TAU))
      poolPos = pooled < poolPos ? poolPos : pooled
      if (leavingRef.current && poolPos > 0.997) poolPos = 1
      if (!poolDone) {
        poolRef.current?.paint(poolPos)
        if (poolPos >= 0.995) poolDone = true
      } else if (leavingRef.current && poolPos < 1) {
        poolRef.current?.paint(1)
        poolPos = 1
      }

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

    const elapsed = performance.now() - (started.current || performance.now())
    if (elapsed >= MAX_MS) {
      finish()
      return undefined
    }

    if (sceneReady) {
      const extra = active ? 180 : 0
      const t = setTimeout(finish, Math.max(MIN_MS - elapsed, 700) + extra)
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
    const t = setTimeout(() => setVisible(false), 1180)
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
            8%
          </span>
        </p>
      </div>
    </div>
  )
}
