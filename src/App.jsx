import React, { Component, useCallback, useEffect, useState } from 'react'

import LoadingScreen from './ui/LoadingScreen'
import Scene from './components/Scene'
import Header from './ui/Header'
import ConfigSidebar from './ui/ConfigSidebar'
import SummarySidebar from './ui/SummarySidebar'
import LeadForm from './ui/steps/LeadForm'
import StairPlacementModal from './ui/StairPlacementModal'
import { formatCHF, usePoolConfig } from './hooks/usePoolConfig'

const MOBILE_PANES = [
  { id: 'config', label: 'Konfig' },
  { id: 'view', label: 'Ansicht' },
  { id: 'summary', label: 'Übersicht' },
]

function useNarrowLayout() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const apply = () => setNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return narrow
}

export default function App() {
  const placing = usePoolConfig((s) => s.placing)
  const cancelPlacing = usePoolConfig((s) => s.cancelPlacing)
  const topView = usePoolConfig((s) => s.topView)
  const setTopView = usePoolConfig((s) => s.setTopView)
  const showDimensions = usePoolConfig((s) => s.showDimensions)
  const setShowDimensions = usePoolConfig((s) => s.setShowDimensions)
  const showLeadForm = usePoolConfig((s) => s.showLeadForm)
  const closeLeadForm = usePoolConfig((s) => s.closeLeadForm)
  const price = usePoolConfig((s) => s.price)
  const openLeadForm = usePoolConfig((s) => s.openLeadForm)
  const [sceneReady, setSceneReady] = useState(false)
  const [mobilePane, setMobilePane] = useState('config')
  const narrow = useNarrowLayout()
  const onSceneReady = useCallback(() => setSceneReady(true), [])

  useEffect(() => {
    if (placing) setMobilePane('view')
  }, [placing])

  return (
    <div className="relative flex h-dvh w-screen flex-col overflow-hidden bg-stalder-paper">
      <Header />

      {narrow && (
        <div className="flex flex-none border-b border-stalder-line bg-stalder-paper">
          {MOBILE_PANES.map((pane) => (
            <button
              key={pane.id}
              type="button"
              onClick={() => setMobilePane(pane.id)}
              className={`min-h-11 flex-1 px-1 py-3 text-[11px] font-bold uppercase tracking-brand ${
                mobilePane === pane.id
                  ? 'border-b-2 border-stalder-ink text-stalder-ink'
                  : 'text-stalder-muted'
              }`}
            >
              {pane.label}
            </button>
          ))}
        </div>
      )}

      <div className={`min-h-0 flex-1 ${narrow ? 'relative' : 'flex flex-row'}`}>
        <div
          className={
            narrow
              ? `absolute inset-0 z-10 bg-stalder-paper ${mobilePane === 'config' ? '' : 'hidden'}`
              : 'h-full'
          }
        >
          <ConfigSidebar />
        </div>

        <div
          className={`scene-stage min-h-0 bg-gradient-to-b from-[#eaeaea] to-[#d4d2cc] ${
            narrow ? 'absolute inset-0' : 'relative min-w-0 flex-1'
          }`}
        >
          <div className="scene-canvas">
            <SceneBoundary onReady={onSceneReady}>
              <Scene onReady={onSceneReady} />
            </SceneBoundary>
          </div>

          <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setTopView(!topView)}
              className="pointer-events-auto border-2 border-stalder-ink bg-stalder-paper/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-brand text-stalder-ink backdrop-blur"
            >
              {topView ? 'Perspektive' : 'Top Ansicht'}
            </button>
            <button
              type="button"
              aria-pressed={showDimensions}
              onClick={() => setShowDimensions(!showDimensions)}
              className={`pointer-events-auto flex items-center gap-2 border-2 border-stalder-ink px-3 py-1.5 text-[11px] font-bold tracking-brand backdrop-blur ${
                showDimensions
                  ? 'bg-stalder-ink text-stalder-paper'
                  : 'bg-stalder-paper/90 text-stalder-ink'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <g transform="rotate(-42 12 12)">
                  <rect x="3" y="10.2" width="18" height="4.6" stroke="currentColor" strokeWidth="1.7" />
                  <path
                    d="M6 10.2v4.6M8.6 10.2v2.4M11.2 10.2v4.6M13.8 10.2v2.4M16.4 10.2v4.6M19 10.2v2.4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </g>
              </svg>
              Masse
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

        <div
          className={
            narrow
              ? `absolute inset-0 z-10 bg-stalder-paper ${mobilePane === 'summary' ? '' : 'hidden'}`
              : 'h-full'
          }
        >
          <SummarySidebar compact={narrow} />
        </div>
      </div>

      {narrow && (
        <div className="flex flex-none items-center gap-3 border-t border-stalder-line bg-stalder-paper px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-stalder-muted">exkl. MwSt.</div>
            <div className="text-lg font-bold leading-none text-stalder-ink">{formatCHF(price)}</div>
          </div>
          <button type="button" onClick={openLeadForm} className="btn-stalder min-w-0 flex-1">
            Offerte anfordern
          </button>
        </div>
      )}

      <LoadingScreen sceneReady={sceneReady} />

      {showLeadForm && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-stalder-ink/50 sm:items-center sm:p-4">
          <div className="max-h-[100dvh] w-full max-w-lg overflow-y-auto bg-stalder-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[90vh] sm:p-6">
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

class SceneBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: false }
  }

  static getDerivedStateFromError() {
    return { error: true }
  }

  componentDidCatch() {
    this.props.onReady?.()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center px-8 text-center text-sm text-stalder-taupe">
          3D-Ansicht ist auf diesem Gerät nicht verfügbar.
        </div>
      )
    }
    return this.props.children
  }
}
