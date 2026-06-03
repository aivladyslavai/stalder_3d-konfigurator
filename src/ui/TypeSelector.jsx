import React from 'react'
import { usePoolConfig } from '../hooks/usePoolConfig'

// Becken-Typen zur Auswahl
const TYPES = [
  { id: 'Edelstahl', label: 'Edelstahl', sub: 'Premium · langlebig' },
  { id: 'PP', label: 'PP-Becken', sub: 'Polypropylen · günstig' },
]

/**
 * Typ-Auswahl (oben links) – zwei Karten zum Umschalten zwischen Edelstahl und PP.
 */
function TypeSelector() {
  const type = usePoolConfig((s) => s.type)
  const setType = usePoolConfig((s) => s.setType)

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-3">
      {TYPES.map((t) => {
        const active = type === t.id
        return (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`w-36 rounded-xl border-2 px-4 py-3 text-left backdrop-blur-md transition-all ${
              active
                ? 'border-[#0A4F8C] bg-blue-50/80 shadow-lg'
                : 'border-transparent bg-white/60 hover:bg-white/80'
            }`}
          >
            <div className="text-sm font-bold text-gray-800">{t.label}</div>
            <div className="text-xs text-gray-500">{t.sub}</div>
          </button>
        )
      })}
    </div>
  )
}

export default React.memo(TypeSelector)
