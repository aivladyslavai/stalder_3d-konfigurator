import React from 'react'
import {
  CHLOR_SYSTEM,
  OPTIONAL_EQUIPMENT,
  getFilterInfo,
  getSaltInfo,
  getHeatPumpInfo,
  getLedInfo,
  getRolladenPrice,
} from '../../data/config'
import { usePoolConfig, formatCHF } from '../../hooks/usePoolConfig'
import { CheckCard, RadioCard } from '../components/Cards'

function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value, price }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        {value && <div className="text-xs text-gray-500">{value}</div>}
      </div>
      <div className="font-semibold text-[#002B6F]">{formatCHF(price)}</div>
    </div>
  )
}

export default function StepEquipment() {
  const { type, sizeId, disinfection, options } = usePoolConfig()
  const setDisinfection = usePoolConfig((s) => s.setDisinfection)
  const toggleOption = usePoolConfig((s) => s.toggleOption)

  const filter = getFilterInfo(sizeId)
  const salt = getSaltInfo(sizeId)
  const heatPump = getHeatPumpInfo(sizeId)
  const led = getLedInfo(type)
  const rolladenPrice = getRolladenPrice(sizeId)

  return (
    <div className="space-y-6">
      <Section title="Filteranlage (immer enthalten)">
        <InfoRow label={filter.label} price={filter.price} />
      </Section>

      <Section title="Desinfektion">
        <div className="grid grid-cols-1 gap-2">
          <RadioCard
            active={disinfection === null}
            onClick={() => setDisinfection(null)}
            title="Keine Desinfektionsanlage"
            desc="Später ergänzbar"
          />
          <RadioCard
            active={disinfection === 'chlor'}
            onClick={() => setDisinfection('chlor')}
            title={CHLOR_SYSTEM.label}
            desc={`+ ${formatCHF(CHLOR_SYSTEM.price)} · ${CHLOR_SYSTEM.desc}`}
          />
          <RadioCard
            active={disinfection === 'salt'}
            onClick={() => setDisinfection('salt')}
            title={salt.label}
            desc={`+ ${formatCHF(salt.price)} · Salzelektrolyse`}
          />
        </div>
      </Section>

      <Section title="Zusatzausstattung">
        <div className="grid grid-cols-1 gap-3">
          <CheckCard
            active={!!options.led}
            onClick={() => toggleOption('led')}
            title={led.label}
            desc={`+ ${formatCHF(led.price)} · RGBW-Beleuchtung`}
          />
          <CheckCard
            active={!!options.rolladen}
            onClick={() => toggleOption('rolladen')}
            title="Rollladen Polycarbonat"
            desc={`+ ${formatCHF(rolladenPrice)} · Lamellen + Welle`}
          />
          <CheckCard
            active={!!options.heatpump}
            onClick={() => toggleOption('heatpump')}
            title={`Wärmepumpe ${heatPump.label}`}
            desc={`+ ${formatCHF(heatPump.price)} · passend zur Beckengrösse`}
          />
          {OPTIONAL_EQUIPMENT.map((e) => (
            <CheckCard
              key={e.id}
              active={!!options[e.id]}
              onClick={() => toggleOption(e.id)}
              title={e.label}
              desc={`+ ${formatCHF(e.price)} · ${e.desc}`}
            />
          ))}
        </div>
      </Section>
    </div>
  )
}
