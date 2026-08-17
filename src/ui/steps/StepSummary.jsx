import React from 'react'
import { usePoolConfig, formatCHF } from '../../hooks/usePoolConfig'
import {
  POOL_TYPES,
  POOL_SYSTEMS,
  CHLOR_SYSTEM,
  OPTIONAL_EQUIPMENT,
  findPoolSize,
  findStair,
  getFilterInfo,
  getSaltInfo,
  getHeatPumpInfo,
  getLedInfo,
  getRolladenPrice,
  PP_COLORS,
  STEEL_FINISHES,
} from '../../data/config'

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
  const systemLabel = POOL_SYSTEMS.find((x) => x.id === s.poolSystem)?.label
  const size = findPoolSize(s.sizeId)
  const stairItem = findStair(s.type, s.stair)
  const materialLabel =
    s.type === 'PP'
      ? PP_COLORS.find((c) => c.id === s.ppColor)?.label
      : STEEL_FINISHES.find((f) => f.id === s.steelFinish)?.label

  const extras = []
  extras.push({ label: getFilterInfo(s.sizeId).label, price: getFilterInfo(s.sizeId).price })
  if (stairItem.price > 0) extras.push({ label: stairItem.label, price: stairItem.price })
  if (s.disinfection === 'chlor') extras.push({ label: CHLOR_SYSTEM.label, price: CHLOR_SYSTEM.price })
  if (s.disinfection === 'salt') {
    const salt = getSaltInfo(s.sizeId)
    extras.push({ label: salt.label, price: salt.price })
  }
  if (s.options.led) {
    const led = getLedInfo(s.type)
    extras.push({ label: led.label, price: led.price })
  }
  if (s.options.rolladen) extras.push({ label: 'Rollladen Polycarbonat', price: getRolladenPrice(s.sizeId) })
  if (s.options.heatpump) {
    const hp = getHeatPumpInfo(s.sizeId)
    extras.push({ label: `Wärmepumpe ${hp.label}`, price: hp.price })
  }
  for (const item of OPTIONAL_EQUIPMENT) {
    if (s.options[item.id]) extras.push({ label: item.label, price: item.price })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <div className="divide-y divide-gray-100">
          <Row label="Material" value={typeLabel} />
          <Row label="Poolart" value={systemLabel} />
          <Row label="Grösse" value={`${size.label} · ${size.dimsLabel}`} />
          <Row label="Treppe" value={stairItem.label} />
          <Row label="Farbe / Finish" value={materialLabel} />
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-700">Ausstattung</h4>
          <ul className="space-y-1.5">
            {extras.map((e) => (
              <li key={e.label} className="flex justify-between gap-2 text-sm text-gray-700">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#32B4E6]" />
                  {e.label}
                </span>
                <span className="font-medium">{formatCHF(e.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <div className="text-xs uppercase tracking-wide text-gray-500">Geschätzte Investitionssumme (VP)</div>
        <div className="mt-1 text-2xl font-extrabold text-gray-900">{formatCHF(s.price)}</div>
        <div className="text-xs text-gray-400">exkl. MwSt. · inkl. Filteranlage</div>
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
