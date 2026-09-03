import React from 'react'

import Scene from './components/Scene'
import Header from './ui/Header'
import ConfigSidebar from './ui/ConfigSidebar'
import SummarySidebar from './ui/SummarySidebar'
import LeadForm from './ui/steps/LeadForm'
import StairPlacementModal from './ui/StairPlacementModal'
import { usePoolConfig } from './hooks/usePoolConfig'

export default function App() {
  const placing = usePoolConfig((s) => s.placing)
  const cancelPlacing = usePoolConfig((s) => s.cancelPlacing)
  const topView = usePoolConfig((s) => s.topView)
  const setTopView = usePoolConfig((s) => s.setTopView)
  const showLeadForm = usePoolConfig((s) => s.showLeadForm)
  const closeLeadForm = usePoolConfig((s) => s.closeLeadForm)

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-stalder-paper">
      <Header />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="max-h-[42vh] overflow-hidden lg:max-h-none lg:h-full">
          <ConfigSidebar />
        </div>

        <div className="relative min-h-[38vh] flex-1 bg-gradient-to-b from-[#eaeaea] to-[#d4d2cc] lg:min-h-0">
          <Scene />

          <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setTopView(!topView)}
              className="pointer-events-auto border-2 border-stalder-ink bg-stalder-paper/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-brand text-stalder-ink backdrop-blur"
            >
              {topView ? 'Perspektive' : 'Top Ansicht'}
            </button>
          </div>

          {(placing?.kind === 'stair' || placing?.kind === 'countercurrent') && <StairPlacementModal />}

          {placing && placing.kind !== 'stair' && placing.kind !== 'countercurrent' && (
            <div className="absolute inset-x-0 top-16 z-20 flex justify-center px-4">
              <div className="flex items-center gap-3 border-2 border-stalder-ink bg-stalder-ink px-4 py-2 text-sm text-stalder-paper shadow-lg">
                <span>
                  Bitte platzieren Sie: <strong>{placing.label}</strong>
                </span>
                <button
                  type="button"
                  onClick={cancelPlacing}
                  className="border border-stalder-paper/40 px-3 py-1 text-[11px] font-bold uppercase tracking-brand hover:bg-white/10"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="max-h-[40vh] overflow-hidden lg:max-h-none lg:h-full">
          <SummarySidebar />
        </div>
      </div>

      {showLeadForm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-stalder-ink/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-stalder-paper p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold uppercase tracking-wide text-stalder-taupe">Offerte anfordern</h2>
              <button type="button" onClick={closeLeadForm} className="text-stalder-muted hover:text-stalder-ink" aria-label="Schliessen">
                ×
              </button>
            </div>
            <LeadForm />
          </div>
        </div>
      )}
    </div>
  )
}
