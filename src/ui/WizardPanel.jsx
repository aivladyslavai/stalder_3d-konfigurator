import React from 'react'
import { STEPS } from '../data/config'
import { usePoolConfig } from '../hooks/usePoolConfig'

import StepPoolType from './steps/StepPoolType'
import StepShape from './steps/StepShape'
import StepSize from './steps/StepSize'
import StepStairs from './steps/StepStairs'
import StepEquipment from './steps/StepEquipment'
import StepMaterial from './steps/StepMaterial'
import StepSummary from './steps/StepSummary'
import LeadForm from './steps/LeadForm'

// Titel + Beschreibung je Schritt
const META = {
  type: { title: 'Pooltyp wählen', desc: 'Wählen Sie den Beckentyp, der am besten zu Ihrem Projekt passt.' },
  shape: { title: 'Form wählen', desc: 'Wählen Sie die Form Ihres Pools.' },
  size: { title: 'Grösse definieren', desc: 'Definieren Sie die gewünschten Masse Ihres Pools.' },
  stairs: { title: 'Treppe auswählen', desc: 'Wählen Sie die Treppenvariante, die am besten zu Ihrem Pool passt.' },
  equipment: { title: 'Ausstattung', desc: 'Bestimmen Sie die Ausstattung, die Ihren Pool noch komfortabler macht.' },
  material: { title: 'Material und Farbe', desc: 'Wählen Sie das Material und die Farbe Ihres Pools.' },
  summary: { title: 'Ihre Konfiguration', desc: 'Überprüfen Sie Ihre Auswahl. Ihr Pool wird live rechts dargestellt.' },
}

const STEP_COMPONENTS = {
  type: StepPoolType,
  shape: StepShape,
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

  // Lead-Formular ist eine Unteransicht des letzten Schritts
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
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#32B4E6]">{`Schritt ${step + 1} / ${STEPS.length}`}</div>
        <h2 className="text-xl font-bold text-gray-900">{meta.title}</h2>
        <p className="mb-6 mt-1 text-sm text-gray-500">{meta.desc}</p>
        <StepComp />
      </div>
      {/* Auf dem Übersichts-Schritt liegt die Aktion im Step selbst */}
      {!isLast && <Footer onNext={next} onBack={prev} hideBack={step === 0} />}
    </div>
  )
}

function Footer({ onNext, onBack, hideBack, hideNext, backLabel = 'Zurück' }) {
  return (
    <div className="flex flex-none items-center gap-4 border-t border-gray-100 px-5 py-4 sm:px-8">
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
  )
}
