import React from 'react'
import { usePoolConfig, formatCHF } from '../../hooks/usePoolConfig'
import { EQUIPMENT, POOL_TYPES, SHAPES, STAIRS, PP_COLORS, STEEL_FINISHES } from '../../data/config'

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  )
}

export default function StepSummary() {
  const s = usePoolConfig()
  const openLeadForm = usePoolConfig((st) => st.openLeadForm)

  const typeLabel = POOL_TYPES.find((t) => t.id === s.type)?.label
  const shapeLabel = SHAPES.find((x) => x.id === s.shape)?.label
  const stairLabel = STAIRS.find((x) => x.id === s.stair)?.label
  const materialLabel =
    s.type === 'PP'
      ? PP_COLORS.find((c) => c.id === s.ppColor)?.label
      : STEEL_FINISHES.find((f) => f.id === s.steelFinish)?.label
  const chosenEquipment = EQUIPMENT.filter((e) => s.options[e.id])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <div className="divide-y divide-gray-100">
          <Row label="Pooltyp" value={typeLabel} />
          <Row label="Form" value={shapeLabel} />
          <Row label="Grösse" value={`${s.length.toFixed(2)} × ${s.width.toFixed(2)} × ${s.depth.toFixed(2)} m`} />
          <Row label="Treppe" value={stairLabel} />
          <Row label="Material" value={materialLabel} />
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold text-gray-700">Ausgewählte Ausstattung</h4>
          {chosenEquipment.length === 0 ? (
            <p className="text-sm text-gray-400">Keine Ausstattung gewählt.</p>
          ) : (
            <ul className="space-y-1">
              {chosenEquipment.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#32B4E6]" />
                  {e.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <div className="text-xs uppercase tracking-wide text-gray-500">Geschätzte Investitionssumme</div>
        <div className="mt-1 text-2xl font-extrabold text-gray-900">
          {formatCHF(s.priceMin)} – {formatCHF(s.priceMax).replace('CHF ', '')}
        </div>
        <div className="text-xs text-gray-400">inkl. MwSt.</div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={openLeadForm}
          className="rounded-full bg-[#32B4E6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1f9fd1]"
        >
          Angebot anfordern
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-full border border-[#002B6F]/30 px-6 py-2.5 text-sm font-medium text-[#002B6F] hover:bg-[#002B6F]/5"
        >
          Konfiguration als PDF
        </button>
      </div>
    </div>
  )
}
