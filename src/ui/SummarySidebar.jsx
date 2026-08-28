import React from 'react'
import { SCENE_OPTIONS, TIME_OPTIONS, DECK_MATERIALS } from '../data/config'
import { usePoolConfig, formatCHF, listSelectedLines } from '../hooks/usePoolConfig'

function Pill({ options, value, onChange }) {
  return (
    <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex-1 px-2 py-1.5 text-[11px] font-semibold ${
            value === o.id ? 'bg-[#002B6F] text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function SummarySidebar() {
  const s = usePoolConfig()
  const lines = listSelectedLines(s)
  const openLeadForm = usePoolConfig((st) => st.openLeadForm)
  const removePlacementsByCatalog = usePoolConfig((st) => st.removePlacementsByCatalog)
  const setStair = usePoolConfig((st) => st.setStair)
  const toggleOption = usePoolConfig((st) => st.toggleOption)
  const setDisinfection = usePoolConfig((st) => st.setDisinfection)

  const removeLine = (id) => {
    if (id === 'stair') setStair('Keine')
    else if (id === 'led') toggleOption('led')
    else if (id === 'rolladen') toggleOption('rolladen')
    else if (id === 'chlor' || id === 'salt') setDisinfection(null)
    else if (id === 'heatpump' || PLACEABLE_IDS.has(id)) removePlacementsByCatalog(id)
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-gray-100 bg-white lg:w-[280px] lg:flex-none">
      <div className="space-y-2 border-b border-gray-100 px-4 py-3">
        <Pill options={TIME_OPTIONS} value={s.timeOfDay} onChange={s.setTimeOfDay} />
        <Pill
          options={SCENE_OPTIONS.map((o) => ({ id: o.id, label: o.id === 'outdoor' ? 'Aussen' : 'Innen' }))}
          value={s.scene}
          onChange={s.setScene}
        />
        <div className="grid grid-cols-5 gap-1">
          {DECK_MATERIALS.map((m) => (
            <button
              key={m.id}
              type="button"
              title={m.label}
              onClick={() => s.setDeck(m.id)}
              className={`h-7 rounded border-2 ${s.deck === m.id ? 'border-[#32B4E6]' : 'border-gray-200'}`}
              style={{ background: m.id === 'wood' ? '#b6854f' : m.color }}
            />
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">Ausgewählt</div>
        <ul className="space-y-1.5">
          {lines.map((line) => (
            <li key={line.id} className="flex items-start justify-between gap-2 text-xs text-gray-700">
              <span>{line.label}</span>
              {line.id !== 'base' && line.id !== 'filter' && (
                <button
                  type="button"
                  className="shrink-0 text-[10px] uppercase tracking-wide text-gray-400 hover:text-red-500"
                  onClick={() => removeLine(line.id)}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-100 px-4 py-4">
        <div className="text-[11px] uppercase tracking-wide text-gray-500">Geschätzte Kosten exkl. MwSt.</div>
        <div className="mt-1 text-3xl font-extrabold text-gray-900">{formatCHF(s.price)}</div>
        <button
          type="button"
          onClick={openLeadForm}
          className="mt-4 w-full rounded-md bg-[#002B6F] py-3 text-sm font-semibold text-white hover:bg-[#00224f]"
        >
          Offerte anfordern
        </button>
        <p className="mt-3 text-[10px] leading-snug text-gray-400">
          Preise gemäss STALDER-Preisliste, exkl. Montage und Transport. Wellness-Elemente als Richtpreise.
        </p>
      </div>
    </aside>
  )
}

const PLACEABLE_IDS = new Set(['massageduese', 'schwall', 'liege', 'bank', 'countercurrent', 'robotX60', 'robotX80', 'heatpump'])
