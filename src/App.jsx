import React from 'react'

import Scene from './components/Scene'
import Header from './ui/Header'
import ConfigSidebar from './ui/ConfigSidebar'
import SummarySidebar from './ui/SummarySidebar'
import LeadForm from './ui/steps/LeadForm'
import { usePoolConfig } from './hooks/usePoolConfig'

export default function App() {
  const placing = usePoolConfig((s) => s.placing)
  const cancelPlacing = usePoolConfig((s) => s.cancelPlacing)
  const topView = usePoolConfig((s) => s.topView)
  const setTopView = usePoolConfig((s) => s.setTopView)
  const showLeadForm = usePoolConfig((s) => s.showLeadForm)
  const closeLeadForm = usePoolConfig((s) => s.closeLeadForm)

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-white">
      <Header />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="max-h-[42vh] overflow-hidden lg:max-h-none lg:h-full">
          <ConfigSidebar />
        </div>

        <div className="relative min-h-[38vh] flex-1 bg-gradient-to-b from-sky-100 to-sky-200 lg:min-h-0">
          <Scene />

          <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setTopView(!topView)}
              className="pointer-events-auto rounded-md border border-white/50 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#002B6F] shadow-sm backdrop-blur"
            >
              {topView ? 'Perspektive' : 'Top Ansicht'}
            </button>
          </div>

          {placing && (
            <div className="absolute inset-x-0 top-16 z-20 flex justify-center px-4">
              <div className="flex items-center gap-3 rounded-full bg-[#002B6F] px-4 py-2 text-sm text-white shadow-lg">
                <span>
                  Bitte platzieren Sie: <strong>{placing.label}</strong>
                </span>
                <button type="button" onClick={cancelPlacing} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25">
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
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900">Offerte anfordern</h2>
              <button type="button" onClick={closeLeadForm} className="text-gray-400 hover:text-gray-700">
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
