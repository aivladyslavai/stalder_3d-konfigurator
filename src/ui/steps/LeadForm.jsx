import React, { useMemo, useState } from 'react'
import { usePoolConfig } from '../../hooks/usePoolConfig'

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

const FIELD =
  'w-full border-2 border-stalder-ink bg-stalder-paper px-3 py-2.5 text-sm text-stalder-ink outline-none transition-colors placeholder:text-stalder-muted/80 focus:bg-[#f4f3f0]'

function Field({ label, required, type = 'text', value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-brand text-stalder-muted">
        {label} {required && <span className="text-stalder-taupe">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD}
      />
    </label>
  )
}

function Select({ label, required, value, onChange, placeholder, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-brand text-stalder-muted">
        {label} {required && <span className="text-stalder-taupe">*</span>}
      </span>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD} appearance-none bg-[length:12px_8px] bg-[right_0.75rem_center] bg-no-repeat pr-9 ${
          value ? '' : 'text-stalder-muted'
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" fill="none"><path d="M1 1.5 6 6.5 11 1.5" stroke="#191923" stroke-width="1.6" stroke-linecap="round"/></svg>',
          )}")`,
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
    </label>
  )
}

const TRUST = [
  { title: 'Ostschweiz', desc: 'Ihr Pool-Experte in der Region St. Gallen, Zürich und Schaffhausen.' },
  { title: 'Persönliche Beratung', desc: 'Von der Planung bis zur Inbetriebnahme an Ihrer Seite.' },
  { title: 'Qualität', desc: 'Polyfaser, PPool® und Chromstahl — passend zu Ihrem Garten.' },
]

export default function LeadForm() {
  const lead = usePoolConfig((s) => s.lead)
  const setLead = usePoolConfig((s) => s.setLead)
  const [sent, setSent] = useState(false)
  const years = useMemo(() => {
    const start = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => start + i)
  }, [])

  const submit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <div className="bg-[#f4f3f0] p-6 text-center">
        <div className="text-lg font-semibold text-stalder-ink">Vielen Dank, {lead.firstName || 'für Ihre Anfrage'}!</div>
        <p className="mt-1 text-sm text-stalder-muted">
          Wir haben Ihre Konfiguration erhalten und melden uns in Kürze persönlich bei Ihnen.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Vorname" required value={lead.firstName} onChange={(v) => setLead({ firstName: v })} />
        <Field label="Nachname" required value={lead.lastName} onChange={(v) => setLead({ lastName: v })} />
        <Field label="Telefon" type="tel" value={lead.phone} onChange={(v) => setLead({ phone: v })} />
        <Field label="E-Mail" required type="email" value={lead.email} onChange={(v) => setLead({ email: v })} />
        <Field label="PLZ" value={lead.zip} onChange={(v) => setLead({ zip: v })} />
      </div>

      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-brand text-stalder-muted">
          Wann wünschen Sie Ihren Pool? <span className="text-stalder-taupe">*</span>
        </div>
        <p className="mb-2 text-[11px] leading-snug text-stalder-muted">Monat und Jahr — so sehen wir, wie dringend Ihre Anfrage ist.</p>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Monat"
            required
            value={lead.wishMonth || ''}
            onChange={(v) => setLead({ wishMonth: v })}
            placeholder="Monat wählen"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select
            label="Jahr"
            required
            value={lead.wishYear || ''}
            onChange={(v) => setLead({ wishYear: v })}
            placeholder="Jahr wählen"
          >
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-brand text-stalder-muted">Nachricht</span>
        <textarea
          rows={3}
          value={lead.message}
          onChange={(e) => setLead({ message: e.target.value })}
          className={`${FIELD} min-h-[5.5rem] resize-y`}
        />
      </label>

      <button type="submit" className="btn-stalder w-auto px-8">
        Offerte anfordern
      </button>

      <div className="grid grid-cols-1 gap-4 border-t border-stalder-line pt-5 sm:grid-cols-3">
        {TRUST.map((t) => (
          <div key={t.title} className="text-center">
            <div className="text-sm font-bold uppercase tracking-wide text-stalder-taupe">{t.title}</div>
            <div className="mt-0.5 text-xs text-stalder-muted">{t.desc}</div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-stalder-muted">
        Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
      </p>
    </form>
  )
}
