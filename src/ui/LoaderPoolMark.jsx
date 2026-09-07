import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'

const WATER =
  'M131.4,85.5 Q138.7,88.7 141.7,87.4 L178.6,71.5 Q181.6,70.2 174.3,67.0 L84.5,28.3 Q77.2,25.2 74.2,26.5 L37.3,42.4 Q34.3,43.7 41.6,46.8 Z'
const HOLE = 'M138.7,88.7 L120.7,80.9 L156.7,80.9 Z'

const STEPS = [
  '135.7,87.4 138.7,88.7 141.7,87.4',
  '135.7,87.4 141.7,87.4 144.7,86.1 132.7,86.1',
  '132.7,86.1 144.7,86.1 147.7,84.8 129.7,84.8',
  '129.7,84.8 147.7,84.8 150.7,83.5 126.7,83.5',
  '126.7,83.5 150.7,83.5 153.7,82.2 123.7,82.2',
  '123.7,82.2 153.7,82.2 156.7,80.9 120.7,80.9',
]

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

function setOpacity(el, value) {
  if (el) el.style.opacity = value < 0.004 ? '0' : value.toFixed(3)
}

const LoaderPoolMark = forwardRef(function LoaderPoolMark({ prefix = 'lp' }, ref) {
  const clip = `${prefix}-water`
  const fill = `${prefix}-water-fill`
  const sheen = `${prefix}-sheen`
  const floorRef = useRef(null)
  const wallsRef = useRef(null)
  const copingRef = useRef(null)
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const wellRef = useRef(null)
  const stepRefs = useRef([])
  const linesRef = useRef(null)
  const waterRef = useRef(null)
  const sheenRef = useRef(null)
  const wavesRef = useRef(null)

  const paint = (progress) => {
    const p = clamp01(progress)
    setOpacity(floorRef.current, smoothstep(0, 0.16, p))
    const wall = smoothstep(0.06, 0.36, p)
    if (wallsRef.current) {
      wallsRef.current.style.opacity = wall.toFixed(3)
      wallsRef.current.style.transform = `scaleY(${(0.18 + wall * 0.82).toFixed(4)})`
    }
    setOpacity(copingRef.current, smoothstep(0.2, 0.44, p))
    if (outerRef.current) {
      outerRef.current.style.strokeDashoffset = String(720 * (1 - smoothstep(0.22, 0.5, p)))
    }
    if (innerRef.current) {
      innerRef.current.style.strokeDashoffset = String(720 * (1 - smoothstep(0.3, 0.56, p)))
    }
    setOpacity(wellRef.current, smoothstep(0.44, 0.58, p))
    stepRefs.current.forEach((el, i) => {
      setOpacity(el, smoothstep(0.46 + i * 0.04, 0.58 + i * 0.04, p))
    })
    setOpacity(linesRef.current, smoothstep(0.48, 0.74, p))
    setOpacity(waterRef.current, smoothstep(0.64, 0.9, p))
    setOpacity(sheenRef.current, smoothstep(0.76, 0.96, p))
    setOpacity(wavesRef.current, 0.42 * smoothstep(0.82, 1, p))
  }

  useImperativeHandle(ref, () => ({ paint }), [])

  useLayoutEffect(() => {
    paint(0.04)
  }, [])

  return (
    <svg className="scene-loader-pool" viewBox="0 0 216 140" aria-hidden>
      <defs>
        <linearGradient id={fill} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#c9d6d2" />
          <stop offset="48%" stopColor="#8fa39d" />
          <stop offset="100%" stopColor="#6d817c" />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="42%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.08" />
        </linearGradient>
        <clipPath id={clip} clipPathUnits="userSpaceOnUse">
          <path d={WATER} />
        </clipPath>
      </defs>

      <g ref={floorRef} className="scene-loader-floor-g">
        <polygon className="scene-loader-floor" points="138.7,117.2 181.6,98.7 77.2,53.7 34.3,72.2" />
      </g>

      <g ref={wallsRef} className="scene-loader-walls">
        <polygon className="scene-loader-wall scene-loader-wall-z" points="138.7,88.7 34.3,43.7 34.3,72.2 138.7,117.2" />
        <polygon className="scene-loader-wall scene-loader-wall-x" points="138.7,88.7 181.6,70.2 181.6,98.7 138.7,117.2" />
        <g className="scene-loader-grout">
          <path d="M170.9,74.8 V103.3 M160.2,79.4 V108 M149.4,84 V112.6" />
          <path d="M57.3,53.6 V82.1 M80.2,63.5 V92 M103.2,73.4 V101.9 M126.2,83.3 V111.8" />
        </g>
      </g>

      <g className="scene-loader-water" clipPath={`url(#${clip})`}>
        <path
          ref={waterRef}
          className="scene-loader-water-body"
          fill={`url(#${fill})`}
          fillRule="evenodd"
          d={`${WATER} ${HOLE}`}
        />
        <path
          ref={sheenRef}
          className="scene-loader-water-sheen"
          fill={`url(#${sheen})`}
          fillRule="evenodd"
          d={`${WATER} ${HOLE}`}
        />
        <g ref={wavesRef} className="scene-loader-waves">
          <g>
            <path d="M67.4,29.4 Q82.3,34.6 104.6,44.4 Q127.0,55.8 149.4,66.1 T171.8,74.4" />
            <path d="M59.8,31.7 Q74.7,37.5 97.1,48.5 Q119.5,59.8 141.8,68.8 T164.2,76.6" />
            <path d="M51.7,34.6 Q66.6,41.4 89.0,52.9 Q111.4,63.4 133.7,71.4 T156.1,79.6" />
            <path d="M44.2,38.1 Q59.1,45.6 81.4,56.8 Q103.8,66.0 126.2,73.8 T148.6,83.1" />
          </g>
          <g className="scene-loader-waves-dup">
            <path d="M67.4,29.4 Q82.3,34.6 104.6,44.4 Q127.0,55.8 149.4,66.1 T171.8,74.4" />
            <path d="M59.8,31.7 Q74.7,37.5 97.1,48.5 Q119.5,59.8 141.8,68.8 T164.2,76.6" />
            <path d="M51.7,34.6 Q66.6,41.4 89.0,52.9 Q111.4,63.4 133.7,71.4 T156.1,79.6" />
            <path d="M44.2,38.1 Q59.1,45.6 81.4,56.8 Q103.8,66.0 126.2,73.8 T148.6,83.1" />
          </g>
        </g>
      </g>

      <path
        ref={copingRef}
        className="scene-loader-coping-fill"
        fillRule="evenodd"
        d="M128.0,90.1 Q139.3,95.0 144.9,92.6 L196.3,70.4 Q201.9,68.0 190.6,63.1 L87.9,18.9 Q76.6,14.0 71.0,16.4 L19.6,38.6 Q14.0,41.0 25.3,45.9 Z M131.4,83.1 Q138.7,86.2 141.7,85.0 L178.6,69.0 Q181.6,67.8 174.3,64.6 L84.5,25.9 Q77.2,22.8 74.2,24.0 L37.3,40.0 Q34.3,41.2 41.6,44.4 Z"
      />

      <g className="scene-loader-stairs" clipPath={`url(#${clip})`}>
        <polygon ref={wellRef} className="scene-loader-well" points="138.7,88.7 120.7,80.9 156.7,80.9" />
        {STEPS.map((points, i) => (
          <polygon
            key={points}
            ref={(node) => {
              stepRefs.current[i] = node
            }}
            className="scene-loader-step"
            points={points}
          />
        ))}
        <path
          ref={linesRef}
          className="scene-loader-stair-lines"
          d="M135.7,87.4 141.7,87.4 M132.7,86.1 144.7,86.1 M129.7,84.8 147.7,84.8 M126.7,83.5 150.7,83.5 M123.7,82.2 153.7,82.2 M120.7,80.9 156.7,80.9"
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
        d="M131.4,83.1 Q138.7,86.2 141.7,85.0 L178.6,69.0 Q181.6,67.8 174.3,64.6 L84.5,25.9 Q77.2,22.8 74.2,24.0 L37.3,40.0 Q34.3,41.2 41.6,44.4 Z"
      />
    </svg>
  )
})

LoaderPoolMark.displayName = 'LoaderPoolMark'

export default LoaderPoolMark
