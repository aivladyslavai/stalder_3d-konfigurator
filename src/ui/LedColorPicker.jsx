import React, { useEffect, useRef } from 'react'
import { LED_COLORS, findLedColor } from '../data/config'

export default function LedColorPicker({ value, onChange }) {
  const current = findLedColor(value)
  const rootRef = useRef(null)

  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  return (
    <div ref={rootRef} className="led-remote">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stalder-taupe">Lichtfarbe</span>
        <span className="text-[11px] font-medium text-stalder-ink">{current.label}</span>
      </div>
      <div className="led-remote-row" role="radiogroup" aria-label="Lichtfarbe">
        {LED_COLORS.map((c) => {
          const on = current.id === c.id
          const wechsel = c.swatch === 'wechsel'
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={c.label}
              title={c.label}
              onClick={() => onChange(c.id)}
              className="led-chip"
            >
              <span
                className={`led-dot${wechsel ? ' led-dot-wechsel' : ''}${c.id === 'weiss' ? ' led-dot-weiss' : ''}${on ? ' is-on' : ''}`}
                style={
                  wechsel
                    ? { '--glow': '#7a6cff' }
                    : c.id === 'weiss'
                      ? { '--glow': '#c5cdd6' }
                      : { background: c.swatch, '--glow': c.swatch }
                }
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
