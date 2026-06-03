import React from 'react'
import { STEPS } from '../data/config'
import { usePoolConfig } from '../hooks/usePoolConfig'

/**
 * Vertikaler Schritt-Navigator (links). Bereits erreichte Schritte sind anklickbar.
 */
function Stepper() {
  const step = usePoolConfig((s) => s.step)
  const setStep = usePoolConfig((s) => s.setStep)

  return (
    <nav className="flex-none border-r border-gray-100 bg-white px-3 py-6 sm:w-52 sm:px-4">
      <ol className="flex gap-4 overflow-x-auto sm:flex-col sm:gap-1 sm:overflow-visible">
        {STEPS.map((s, i) => {
          const active = i === step
          const done = i < step
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => (done || active ? setStep(i) : null)}
                disabled={!done && !active}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-md px-2 py-2 text-left text-sm transition-colors sm:w-full ${
                  active ? 'font-semibold text-gray-900' : done ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-300'
                }`}
              >
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                    active || done ? 'bg-[#002B6F] text-white' : 'border border-gray-200 text-gray-300'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default React.memo(Stepper)
