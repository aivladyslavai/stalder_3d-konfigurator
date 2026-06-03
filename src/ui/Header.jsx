import React from 'react'
import { PHONE } from '../data/config'

/**
 * Kopfzeile im STALDER-Look: dunkelblauer Balken, weisses Logo
 * „STALDER · SWISS [🇨🇭] FINISH“, Telefonnummer und Schliessen-Symbol.
 */
function Header() {
  return (
    <header className="flex h-16 flex-none items-center justify-between bg-[#002B6F] px-4 text-white sm:px-6">
      <div className="flex items-center gap-3">
        <div className="leading-none">
          <div className="text-xl font-extrabold tracking-wide">STALDER</div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium tracking-[0.25em] text-white/90">
            SWISS
            <span className="inline-flex h-3 w-3 items-center justify-center rounded-[2px] bg-[#E2001A]">
              <span className="text-[8px] font-bold leading-none text-white">+</span>
            </span>
            FINISH
          </div>
        </div>
        <span className="ml-3 hidden border-l border-white/25 pl-3 text-sm text-white/80 sm:inline">
          Pool Konfigurator
        </span>
      </div>
      <div className="flex items-center gap-4">
        <a
          href={`tel:${PHONE.replace(/\s/g, '')}`}
          className="hidden items-center gap-1.5 text-sm text-white/90 hover:text-white sm:flex"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1z" />
          </svg>
          {PHONE}
        </a>
        <button className="text-white/70 hover:text-white" aria-label="Schliessen">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default React.memo(Header)
