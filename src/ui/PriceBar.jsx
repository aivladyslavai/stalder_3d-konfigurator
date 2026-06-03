import React from 'react'
import { usePoolConfig, formatCHF } from '../hooks/usePoolConfig'

/**
 * Preisleiste (unten, volle Breite) im Glasmorphismus-Stil.
 * Links: Richtpreis. Rechts: Anfrage-Button.
 */
function PriceBar() {
  const price = usePoolConfig((s) => s.price)

  return (
    <div
      className="absolute bottom-0 left-0 z-10 flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-4"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 sm:text-sm">Richtpreis exkl. MwSt.</span>
        <span className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
          {formatCHF(price)}
        </span>
      </div>

      <button
        className="rounded-lg bg-[#0A4F8C] px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#083d6e] sm:px-6 sm:text-base"
        onClick={() => alert('Vielen Dank für Ihr Interesse! Wir melden uns in Kürze.')}
      >
        Unverbindlich anfragen →
      </button>
    </div>
  )
}

export default React.memo(PriceBar)
