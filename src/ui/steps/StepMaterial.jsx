import React from 'react'
import { PP_COLORS, STEEL_FINISHES } from '../../data/config'
import { usePoolConfig } from '../../hooks/usePoolConfig'

// Farb-/Material-Kachel mit Vorschau-Fläche.
function Swatch({ active, onClick, label, style }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <span
        className={`h-14 w-full rounded-md border-2 transition-all ${
          active ? 'border-[#32B4E6] ring-2 ring-[#32B4E6]/30' : 'border-gray-200'
        }`}
        style={style}
      />
      <span className={`text-xs ${active ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{label}</span>
    </button>
  )
}

export default function StepMaterial() {
  const { type, ppColor, steelFinish } = usePoolConfig()
  const setPPColor = usePoolConfig((s) => s.setPPColor)
  const setSteelFinish = usePoolConfig((s) => s.setSteelFinish)

  if (type === 'PP') {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">PP Becken</h3>
        <div className="grid grid-cols-4 gap-3">
          {PP_COLORS.map((c) => (
            <Swatch
              key={c.id}
              active={ppColor === c.id}
              onClick={() => setPPColor(c.id)}
              label={c.label}
              style={{ background: c.color }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Edelstahlbecken</h3>
      <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
        {STEEL_FINISHES.map((f) => (
          <Swatch
            key={f.id}
            active={steelFinish === f.id}
            onClick={() => setSteelFinish(f.id)}
            label={f.label}
            style={{
              background:
                f.id === 'Poliert'
                  ? 'linear-gradient(135deg,#f4f6f7 0%,#c4cace 45%,#eef1f2 60%,#aab1b5 100%)'
                  : 'linear-gradient(135deg,#cdd2d5 0%,#b3b9bd 50%,#c8cdd0 100%)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
