import React from 'react'
import { usePoolConfig } from '../../hooks/usePoolConfig'

// Ein einzelner Schieberegler mit Beschriftung und Wertanzeige.
function DimSlider({ label, value, min, max, step, unit, onChange }) {
  const display = unit === 'cm' ? Math.round(value * 100) : value.toFixed(value % 1 === 0 ? 0 : 2)
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-semibold text-gray-900">
          {display} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-[#32B4E6]"
      />
      <div className="mt-1 flex justify-between text-[11px] text-gray-400">
        <span>{unit === 'cm' ? min * 100 : min}</span>
        <span>{unit === 'cm' ? max * 100 : max}</span>
      </div>
    </div>
  )
}

export default function StepSize() {
  const { length, width, depth, unit } = usePoolConfig()
  const setDimensions = usePoolConfig((s) => s.setDimensions)
  const setUnit = usePoolConfig((s) => s.setUnit)

  return (
    <div className="space-y-5">
      <DimSlider label="Länge" value={length} min={3} max={15} step={0.5} unit={unit} onChange={(v) => setDimensions({ length: v })} />
      <DimSlider label="Breite" value={width} min={2} max={8} step={0.5} unit={unit} onChange={(v) => setDimensions({ width: v })} />
      <DimSlider label="Tiefe" value={depth} min={1.2} max={2.0} step={0.1} unit={unit} onChange={(v) => setDimensions({ depth: v })} />

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="inline-flex overflow-hidden rounded-md border border-gray-200">
          {['m', 'cm'].map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-1.5 text-sm font-medium ${
                unit === u ? 'bg-[#002B6F] text-white' : 'bg-white text-gray-600'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDimensions({ length: 8, width: 4, depth: 1.5 })}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Standardgrössen
        </button>
      </div>
    </div>
  )
}
