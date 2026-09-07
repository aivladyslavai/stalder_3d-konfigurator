import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'

const WATER =
  'M131.4,85.5 Q138.7,88.7 141.7,87.4 L178.6,71.5 Q181.6,70.2 174.3,67.0 L84.5,28.3 Q77.2,25.2 74.2,26.5 L37.3,42.4 Q34.3,43.7 41.6,46.8 Z'
const HOLE = 'M138.7,88.7 L110.7,74.8 L166.7,74.8 Z'
const FLOOR_GROUT =
  'M77.3,53.8 L34.3,72.3 M87.7,58.3 L44.8,76.8 M98.1,62.8 L55.2,81.3 M108.6,67.3 L65.7,85.8 M119.0,71.8 L76.1,90.3 M129.5,76.3 L86.5,94.8 M139.9,80.8 L97.0,99.3 M150.3,85.3 L107.4,103.8 M160.8,89.8 L117.9,108.3 M171.2,94.3 L128.3,112.8 M181.7,98.8 L138.7,117.3 M77.3,53.8 L181.7,98.8 M70.1,56.8 L174.5,101.8 M63.0,59.9 L167.4,104.9 M55.8,63.0 L160.2,108.0 M48.6,66.1 L153.0,111.1 M41.5,69.2 L145.9,114.2 M34.3,72.3 L138.7,117.3'
const WALL_COURSES =
  'M34.3,49.0 L138.7,94.0 M181.7,75.5 L138.7,94.0 M34.3,55.0 L138.7,100.0 M181.7,81.5 L138.7,100.0 M34.3,61.1 L138.7,106.1 M181.7,87.6 L138.7,106.1 M34.3,67.1 L138.7,112.1 M181.7,93.6 L138.7,112.1'
const LED = 'M138.7,87.1 181.6,68.6 M138.7,87.1 34.3,42.1 M34.3,42.1 77.2,23.6 M181.6,68.6 77.2,23.6'
const COPING_INNER =
  'M131.4,83.1 Q138.7,86.2 141.7,85.0 L178.6,69.0 Q181.6,67.8 174.3,64.6 L84.5,25.9 Q77.2,22.8 74.2,24.0 L37.3,40.0 Q34.3,41.2 41.6,44.4 Z'

const STEPS = [
  ['138.7,88.7 143.4,86.4 134.0,86.4', '134.0,86.4 143.4,86.4 143.4,87.6 134.0,87.6'],
  ['134.0,86.4 143.4,86.4 148.0,84.1 129.4,84.1', '134.0,86.4 143.4,86.4 143.4,87.6 134.0,87.6'],
  ['129.4,84.1 148.0,84.1 152.7,81.8 124.7,81.8', '129.4,84.1 148.0,84.1 148.0,85.3 129.4,85.3'],
  ['124.7,81.8 152.7,81.8 157.4,79.4 120.0,79.4', '124.7,81.8 152.7,81.8 152.7,83.0 124.7,83.0'],
  ['120.0,79.4 157.4,79.4 162.0,77.1 115.4,77.1', '120.0,79.4 157.4,79.4 157.4,80.6 120.0,80.6'],
  ['115.4,77.1 162.0,77.1 166.7,74.8 110.7,74.8', '115.4,77.1 162.0,77.1 162.0,78.3 115.4,78.3'],
]

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

function smootherstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function setStyle(el, prop, next, cache, key) {
  if (!el) return
  if (cache[key] === next) return
  cache[key] = next
  el.style[prop] = next
}

const LoaderPoolMark = forwardRef(function LoaderPoolMark({ prefix = 'lp' }, ref) {
  const clip = `${prefix}-water`
  const fill = `${prefix}-water-fill`
  const sheen = `${prefix}-sheen`
  const wallZ = `${prefix}-wall-z`
  const wallX = `${prefix}-wall-x`
  const cache = useRef({})
  const shadowRef = useRef(null)
  const floorRef = useRef(null)
  const wallsRef = useRef(null)
  const linerRef = useRef(null)
  const copingRef = useRef(null)
  const ledRef = useRef(null)
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const wellRef = useRef(null)
  const stepRefs = useRef([])
  const linesRef = useRef(null)
  const waterGroupRef = useRef(null)
  const sheenRef = useRef(null)
  const wavesRef = useRef(null)
  const svgRef = useRef(null)

  const paint = (progress) => {
    const p = clamp01(progress)
    const prev = cache.current._p
    if (prev != null && Math.abs(p - prev) < 0.0008 && p < 0.995) return
    cache.current._p = p
    const c = cache.current
    const op = (el, a, b, key) => {
      const t = smootherstep(a, b, p)
      setStyle(el, 'opacity', t < 0.004 ? '0' : t.toFixed(3), c, key)
      return t
    }

    op(shadowRef.current, 0, 0.18, 'shadow')
    op(floorRef.current, 0.02, 0.2, 'floor')
    const wall = smootherstep(0.05, 0.38, p)
    setStyle(wallsRef.current, 'opacity', wall.toFixed(3), c, 'wallO')
    setStyle(wallsRef.current, 'transform', `scaleY(${(0.18 + wall * 0.82).toFixed(4)})`, c, 'wallT')
    op(linerRef.current, 0.16, 0.38, 'liner')
    op(copingRef.current, 0.2, 0.44, 'cope')
    op(ledRef.current, 0.34, 0.52, 'led')
    const outer = smootherstep(0.16, 0.5, p)
    setStyle(outerRef.current, 'strokeDashoffset', (720 * (1 - outer)).toFixed(2), c, 'outer')
    const inner = smootherstep(0.24, 0.56, p)
    setStyle(innerRef.current, 'strokeDashoffset', (720 * (1 - inner)).toFixed(2), c, 'inner')
    op(wellRef.current, 0.38, 0.56, 'well')
    stepRefs.current.forEach((el, i) => {
      op(el, 0.4 + i * 0.042, 0.58 + i * 0.042, `st${i}`)
    })
    op(linesRef.current, 0.42, 0.72, 'lines')
    const water = smootherstep(0.46, 0.82, p)
    setStyle(waterGroupRef.current, 'opacity', water.toFixed(3), c, 'water')
    const rise = 1 - water
    setStyle(
      waterGroupRef.current,
      'transform',
      rise < 0.02 ? 'none' : `translate3d(${(rise * 1.2).toFixed(2)}px, ${(rise * 2.4).toFixed(2)}px, 0)`,
      c,
      'waterT',
    )
    op(sheenRef.current, 0.68, 0.92, 'sheen')
    const waves = 0.7 * smootherstep(0.6, 0.92, p)
    setStyle(wavesRef.current, 'opacity', waves.toFixed(3), c, 'waves')

    if (p >= 0.985 && svgRef.current && !c.built) {
      c.built = true
      svgRef.current.classList.add('is-built')
      if (outerRef.current) outerRef.current.style.strokeDashoffset = ''
      if (wallsRef.current) wallsRef.current.style.willChange = 'auto'
    }
  }

  useImperativeHandle(ref, () => ({ paint }), [])

  useLayoutEffect(() => {
    paint(0.03)
  }, [])

  return (
    <svg ref={svgRef} className="scene-loader-pool" viewBox="0 0 216 140" aria-hidden>
      <defs>
        <linearGradient id={fill} x1="0.08" y1="0.02" x2="0.92" y2="0.98">
          <stop offset="0%" stopColor="#eaf6f2" />
          <stop offset="28%" stopColor="#9ec4bc" />
          <stop offset="62%" stopColor="#5e8f88" />
          <stop offset="100%" stopColor="#3e6460" />
        </linearGradient>
        <linearGradient id={sheen} x1="0.18" y1="0" x2="0.88" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="32%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#cfe3de" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={wallZ} gradientUnits="userSpaceOnUse" x1="34" y1="42" x2="139" y2="117">
          <stop offset="0%" stopColor="#f3efe7" />
          <stop offset="55%" stopColor="#d8d2c6" />
          <stop offset="100%" stopColor="#b9b3a6" />
        </linearGradient>
        <linearGradient id={wallX} gradientUnits="userSpaceOnUse" x1="139" y1="70" x2="182" y2="117">
          <stop offset="0%" stopColor="#e8e3d9" />
          <stop offset="100%" stopColor="#aea89b" />
        </linearGradient>
        <clipPath id={clip} clipPathUnits="userSpaceOnUse">
          <path d={WATER} />
        </clipPath>
        <radialGradient id={`${prefix}-shadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#191923" stopOpacity="0.18" />
          <stop offset="62%" stopColor="#191923" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#191923" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse ref={shadowRef} className="scene-loader-shadow" cx="108" cy="114" rx="86" ry="20" fill={`url(#${prefix}-shadow)`} />

      <g ref={floorRef} className="scene-loader-floor-g">
        <polygon className="scene-loader-floor" points="138.7,117.2 181.6,98.7 77.2,53.7 34.3,72.2" />
        <path className="scene-loader-floor-grout" d={FLOOR_GROUT} />
      </g>

      <g ref={wallsRef} className="scene-loader-walls">
        <polygon className="scene-loader-wall scene-loader-wall-z" fill={`url(#${wallZ})`} points="138.7,88.7 34.3,43.7 34.3,72.2 138.7,117.2" />
        <polygon className="scene-loader-wall scene-loader-wall-x" fill={`url(#${wallX})`} points="138.7,88.7 181.6,70.2 181.6,98.7 138.7,117.2" />
        <g className="scene-loader-grout">
          <path d="M170.9,74.8 V103.3 M160.2,79.4 V108 M149.4,84 V112.6" />
          <path d="M57.3,53.6 V82.1 M80.2,63.5 V92 M103.2,73.4 V101.9 M126.2,83.3 V111.8" />
        </g>
        <path className="scene-loader-wall-courses" d={WALL_COURSES} />
      </g>

      <g ref={linerRef} className="scene-loader-liner">
        <polygon points="138.7,86.2 181.6,67.8 181.6,70.2 138.7,88.7" />
        <polygon points="138.7,86.2 34.3,41.2 34.3,43.7 138.7,88.7" />
      </g>

      <g ref={waterGroupRef} className="scene-loader-water" clipPath={`url(#${clip})`}>
        <path className="scene-loader-water-body" fill={`url(#${fill})`} fillRule="evenodd" d={`${WATER} ${HOLE}`} />
        <ellipse className="scene-loader-caustic" cx="118" cy="58" rx="38" ry="12" />
        <ellipse className="scene-loader-caustic scene-loader-caustic-b" cx="148" cy="70" rx="18" ry="6" />
        <path ref={sheenRef} className="scene-loader-water-sheen" fill={`url(#${sheen})`} fillRule="evenodd" d={`${WATER} ${HOLE}`} />
        <g ref={wavesRef} className="scene-loader-waves">
          <g>
            <path d="M67.4,29.4 Q82.3,34.6 104.6,44.4 Q127.0,55.8 149.4,66.1 T171.8,74.4" />
            <path d="M59.8,31.7 Q74.7,37.5 97.1,48.5 Q119.5,59.8 141.8,68.8 T164.2,76.6" />
            <path d="M51.7,34.6 Q66.6,41.4 89.0,52.9 Q111.4,63.4 133.7,71.4 T156.1,79.6" />
          </g>
          <g className="scene-loader-waves-dup">
            <path d="M67.4,29.4 Q82.3,34.6 104.6,44.4 Q127.0,55.8 149.4,66.1 T171.8,74.4" />
            <path d="M59.8,31.7 Q74.7,37.5 97.1,48.5 Q119.5,59.8 141.8,68.8 T164.2,76.6" />
            <path d="M51.7,34.6 Q66.6,41.4 89.0,52.9 Q111.4,63.4 133.7,71.4 T156.1,79.6" />
          </g>
        </g>
      </g>

      <g ref={copingRef} className="scene-loader-coping">
        <path
          className="scene-loader-coping-fill"
          fillRule="evenodd"
          d="M128.0,90.1 Q139.3,95.0 144.9,92.6 L196.3,70.4 Q201.9,68.0 190.6,63.1 L87.9,18.9 Q76.6,14.0 71.0,16.4 L19.6,38.6 Q14.0,41.0 25.3,45.9 Z M131.4,83.1 Q138.7,86.2 141.7,85.0 L178.6,69.0 Q181.6,67.8 174.3,64.6 L84.5,25.9 Q77.2,22.8 74.2,24.0 L37.3,40.0 Q34.3,41.2 41.6,44.4 Z"
        />
        <path className="scene-loader-coping-inner" d={COPING_INNER} />
      </g>
      <g ref={ledRef} className="scene-loader-led">
        <path className="scene-loader-led-glow" d={LED} />
        <path className="scene-loader-led-line" d={LED} />
      </g>

      <g className="scene-loader-stairs" clipPath={`url(#${clip})`}>
        <polygon ref={wellRef} className="scene-loader-well" points="138.7,88.7 110.7,74.8 166.7,74.8" />
        {STEPS.map(([top, front], i) => (
          <g
            key={top}
            ref={(node) => {
              stepRefs.current[i] = node
            }}
            className="scene-loader-step"
          >
            <polygon className="scene-loader-step-front" points={front} />
            <polygon className="scene-loader-step-top" points={top} />
          </g>
        ))}
        <path
          ref={linesRef}
          className="scene-loader-stair-lines"
          d="M134.0,86.4 143.4,86.4 M129.4,84.1 148.0,84.1 M124.7,81.8 152.7,81.8 M120.0,79.4 157.4,79.4 M115.4,77.1 162.0,77.1 M110.7,74.8 166.7,74.8"
        />
      </g>

      <path
        ref={outerRef}
        className="scene-loader-trace scene-loader-trace-outer"
        d="M128.0,90.1 Q139.3,95.0 144.9,92.6 L196.3,70.4 Q201.9,68.0 190.6,63.1 L87.9,18.9 Q76.6,14.0 71.0,16.4 L19.6,38.6 Q14.0,41.0 25.3,45.9 Z"
      />
      <path
        ref={innerRef}
        className="scene-loader-trace scene-loader-trace-inner"
        d={COPING_INNER}
      />
    </svg>
  )
})

LoaderPoolMark.displayName = 'LoaderPoolMark'

export default LoaderPoolMark
