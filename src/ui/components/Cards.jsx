import React from 'react'

/**
 * Auswahl-Karte mit Radio-Verhalten (für Pooltyp, Form, Treppe).
 */
export function RadioCard({ active, onClick, title, desc, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-lg border-2 p-4 text-left transition-all ${
        active
          ? 'border-[#32B4E6] bg-[#32B4E6]/10 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
            active ? 'border-[#32B4E6]' : 'border-gray-300'
          }`}
        >
          {active && <span className="h-2 w-2 rounded-full bg-[#32B4E6]" />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-900">{title}</span>
          {desc && <span className="mt-1 block text-xs leading-snug text-gray-500">{desc}</span>}
          {children}
        </span>
      </div>
    </button>
  )
}

/**
 * Auswahl-Karte mit Checkbox-Verhalten (für Ausstattung).
 */
export function CheckCard({ active, onClick, title, desc, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
        active
          ? 'border-[#32B4E6] bg-[#32B4E6]/10 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border-2 ${
          active ? 'border-[#32B4E6] bg-[#32B4E6] text-white' : 'border-gray-300 bg-white'
        }`}
      >
        {active && (
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M7.5 13.5 4 10l1.4-1.4 2.1 2.1 5.1-5.1L14 7z" />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">{title}</span>
        {desc && <span className="mt-1 block text-xs leading-snug text-gray-500">{desc}</span>}
      </span>
    </button>
  )
}
