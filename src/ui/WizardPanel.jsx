import React from 'react'
import { STEPS } from '../data/config'
import { usePoolConfig, formatCHF } from '../hooks/usePoolConfig'

import StepPoolType from './steps/StepPoolType'
import StepPoolSystem from './steps/StepShape'
import StepSize from './steps/StepSize'
import StepStairs from './steps/StepStairs'
import StepEquipment from './steps/StepEquipment'
import StepMaterial from './steps/StepMaterial'
import StepSummary from './steps/StepSummary'
import LeadForm from './steps/LeadForm'

const META = {
  type: {
    title: 'Material wählen',
    desc: 'Wählen Sie zwischen Chromstahl- oder PP-Becken.',
  },
  system: {
    title: 'Poolart wählen',
    desc: 'Skimmer-Becken oder Überlauf-Pool (Infinity) mit Schwallbehälter.',
  },
  size: {
    title: 'Grösse wählen',
    desc: 'Wählen Sie eine der vordefinierten Beckengrössen (S bis Family).',
  },
  stairs: {
    title: 'Treppe auswählen',
    desc: 'Wählen Sie die Treppenvariante für Ihren Pool.',
  },
  equipment: {
    title: 'Ausstattung',
    desc: 'Filter ist immer enthalten. Ergänzen Sie Desinfektion und Zusatzausstattung.',
  },
  material: {
    title: 'Farbe wählen',
    desc: 'Wählen Sie die Farbe (PP) bzw. die Oberfläche (Chromstahl).',
  },
  summary: {
    title: 'Ihre Konfiguration',
    desc: 'Überprüfen Sie Ihre Auswahl. Ihr Pool wird live rechts dargestellt.',
  },
}

const STEP_COMPONENTS = {
  type: StepPoolType,
  system: StepPoolSystem,
  size: StepSize,
  stairs: StepStairs,
  equipment: StepEquipment,
  material: StepMaterial,
  summary: StepSummary,
}

export default function WizardPanel() {
  const step = usePoolConfig((s) => s.step)
  const showLeadForm = usePoolConfig((s) => s.showLeadForm)
  const next = usePoolConfig((s) => s.next)
  const prev = usePoolConfig((s) => s.prev)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  if (showLeadForm) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <h2 className="text-xl font-bold text-gray-900">Offerte anfordern</h2>
          <p className="mt-1 text-sm text-gray-500">
            Fordern Sie jetzt Ihr individuelles Angebot an. Unsere Pool-Experten melden sich persönlich bei Ihnen.
          </p>
          <div className="mt-6">
            <LeadForm />
          </div>
        </div>
        <Footer onBack={prev} backLabel="Zurück zur Übersicht" hideNext />
      </div>
    )
  }

  const meta = META[current.key]
  const StepComp = STEP_COMPONENTS[current.key]

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#32B4E6]">
          {`Schritt ${step + 1} / ${STEPS.length}`}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{meta.title}</h2>
        <p className="mb-6 mt-1 text-sm text-gray-500">{meta.desc}</p>
        <StepComp />
      </div>
      {!isLast && <Footer onNext={next} onBack={prev} hideBack={step === 0} />}
    </div>
  )
}

function Footer({ onNext, onBack, hideBack, hideNext, backLabel = 'Zurück' }) {
  const price = usePoolConfig((s) => s.price)

  return (
    <div className="flex flex-none flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:px-8">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-gray-500">Aktueller Richtpreis (VP, exkl. MwSt.)</span>
        <span className="text-lg font-bold text-gray-900">{formatCHF(price)}</span>
      </div>
      <div className="flex items-center gap-4">
      {!hideNext && (
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-full bg-[#32B4E6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1f9fd1]"
        >
          Weiter <span aria-hidden>→</span>
        </button>
      )}
      {!hideBack && (
        <button onClick={onBack} className="text-sm font-medium text-gray-500 hover:text-gray-800">
          {backLabel}
        </button>
      )}
      </div>
    </div>
  )
}
