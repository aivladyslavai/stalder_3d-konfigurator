import React from 'react'
import { TIME_OPTIONS } from '../data/config'
import { usePoolConfig, formatCHF, listSelectedLines } from '../hooks/usePoolConfig'

function PairPills({ left, right, value, onChange }) {
  return (
    <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white">
      {[left, right].map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[12px] font-medium ${
              active ? 'text-[#1a2b48]' : 'text-gray-400'
            }`}
          >
            {active && (
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[#3b82f6]" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3.5 8.2 6.4 11 12.5 4.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const PLACEABLE_IDS = new Set(['massageduese', 'schwall', 'liege', 'bank', 'countercurrent', 'robotX60', 'robotX80', 'heatpump'])

export default function SummarySidebar() {
  const s = usePoolConfig()
  const lines = listSelectedLines(s)
  const extras = lines.filter((l) => l.id !== 'base' && l.id !== 'filter')
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

  const deckKind = s.deck === 'wood' ? 'wood' : 'stone'

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-white lg:w-[280px] lg:flex-none">
      <div className="space-y-2.5 px-5 pt-5">
        <PairPills left={TIME_OPTIONS[0]} right={TIME_OPTIONS[1]} value={s.timeOfDay} onChange={s.setTimeOfDay} />
        <PairPills
          left={{ id: 'outdoor', label: 'Aussen' }}
          right={{ id: 'indoor', label: 'Innen' }}
          value={s.scene}
          onChange={s.setScene}
        />
        <PairPills
          left={{ id: 'wood', label: 'Holzboden' }}
          right={{ id: 'stone', label: 'Steinboden' }}
          value={deckKind}
          onChange={(kind) => s.setDeck(kind === 'wood' ? 'wood' : 'stone-light')}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#1a2b48]">Ausgewählt</div>
        {extras.length === 0 ? (
          <p className="text-xs text-gray-400">Noch keine Extras gewählt.</p>
        ) : (
          <ul className="space-y-2">
            {extras.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-2 text-[13px] text-[#1a2b48]">
                <span>{line.label}</span>
                <button
                  type="button"
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[#1a2b48] hover:bg-gray-100"
                  onClick={() => removeLine(line.id)}
                  aria-label="Entfernen"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-5 pb-6 pt-2">
        <div className="text-[12px] text-gray-500">geschätzte Kosten exkl. MwSt.</div>
        <div className="mt-1 text-[28px] font-extrabold leading-none tracking-tight text-[#1a2b48]">{formatCHF(s.price)}</div>
        <button
          type="button"
          onClick={openLeadForm}
          className="mt-5 w-full rounded-xl bg-[#1a2b48] py-3.5 text-[15px] font-semibold text-white hover:bg-[#142238]"
        >
          Offerte anfordern
        </button>
        <p className="mt-3 text-[10px] leading-snug text-gray-400">
          Die angegebenen Preise gelten exkl. Montage und Transport. Wellness-Elemente als Richtpreise.
        </p>
      </div>
    </aside>
  )
}
