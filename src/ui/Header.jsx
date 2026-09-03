import React from 'react'
import { PHONE, SITE_URL } from '../data/config'

function Header() {
  return (
    <header className="flex h-[72px] flex-none items-center justify-between border-b border-stalder-line bg-stalder-paper px-4 text-stalder-ink sm:px-6">
      <a href={SITE_URL} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-4" aria-label="Stalder Schwimmbadtechnik">
        <img
          src="/brand/stalder-logo.svg"
          alt="Stalder Schwimmbadtechnik"
          className="h-8 w-auto sm:h-9"
          width={196}
          height={36}
        />
        <span className="hidden h-8 w-px bg-stalder-line sm:block" />
        <span className="kicker hidden truncate sm:inline">Pool-Konfigurator</span>
      </a>
      <div className="flex items-center gap-4 sm:gap-6">
        <a
          href={`tel:${PHONE.replace(/\s/g, '')}`}
          className="flex items-center gap-2 text-sm font-semibold text-stalder-ink hover:text-stalder-taupe"
          aria-label={PHONE}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1z" />
          </svg>
          <span className="hidden sm:inline">{PHONE}</span>
        </a>
        <a
          href={SITE_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden text-[11px] font-bold uppercase tracking-brand text-stalder-taupe hover:text-stalder-ink md:inline"
        >
          stalder-pool.ch
        </a>
      </div>
    </header>
  )
}

export default React.memo(Header)
