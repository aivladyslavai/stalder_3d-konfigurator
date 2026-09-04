import React, { useMemo, useState } from 'react'
import { findPPColor } from '../../data/config'
import { calcPrice, listSelectedLines, usePoolConfig } from '../../hooks/usePoolConfig'

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

const SITE_OPTIONS = [
  { id: 'eben', label: 'Ebenes Gelände' },
  { id: 'hanglage', label: 'Hanglage' },
  { id: 'freistehend', label: 'Freistehend' },
]

const GARDEN_OPTIONS = [
  { id: 'gesamtloesung', label: 'interessiert an einer Gesamtlösung' },
  { id: 'gartenbauer', label: 'einen bestimmten Gartenbauer nach Möglichkeit berücksichtigen' },
]

function RadioQuestion({ label, required, name, value, onChange, options }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold text-stalder-ink">
        {label} {required && <span className="text-stalder-taupe">*</span>}
      </legend>
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-start gap-2.5 text-sm text-stalder-ink">
            <input
              type="radio"
              name={name}
              required={required}
              checked={value === o.id}
              onChange={() => onChange(o.id)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-stalder-ink"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

const TRUST = [
  { title: 'Ostschweiz', desc: 'Ihr Pool-Experte in der Region St. Gallen, Zürich und Schaffhausen.' },
  { title: 'Persönliche Beratung', desc: 'Von der Planung bis zur Inbetriebnahme an Ihrer Seite.' },
  { title: 'Qualität', desc: 'Polyfaser, PPool® und Chromstahl — passend zu Ihrem Garten.' },
]

function buildOfferPayload(state) {
  return {
    website: '',
    lead: {
      firstName: state.lead.firstName.trim(),
      lastName: state.lead.lastName.trim(),
      phone: (state.lead.phone || '').trim(),
      email: (state.lead.email || '').trim(),
      zip: (state.lead.zip || '').trim(),
      wishMonth: state.lead.wishMonth,
      wishYear: state.lead.wishYear,
      poolSite: state.lead.poolSite,
      gardenWork: state.lead.gardenWork,
      gartenbauer: (state.lead.gartenbauer || '').trim(),
      message: (state.lead.message || '').trim(),
    },
    config: {
      type: state.type,
      poolSystem: state.poolSystem,
      length: state.length,
      width: state.width,
      depth: state.depth,
      color: state.type === 'PP' ? findPPColor(state.ppColor).label : '',
      lines: listSelectedLines(state).map((line) => ({ label: line.label, price: line.price })),
      price: calcPrice(state),
    },
  }
}

export default function LeadForm() {
  const lead = usePoolConfig((s) => s.lead)
  const setLead = usePoolConfig((s) => s.setLead)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const years = useMemo(() => {
    const start = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => start + i)
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const payload = buildOfferPayload(usePoolConfig.getState())
      payload.website = honeypot
      const res = await fetch('/api/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Senden fehlgeschlagen. Bitte später erneut versuchen.')
        return
      }
      setSent(true)
    } catch {
      setError('Keine Verbindung. Bitte prüfen Sie Ihr Netzwerk oder rufen Sie uns an.')
    } finally {
      setSubmitting(false)
    }
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
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>
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

      <RadioQuestion
        label="Wo soll das Becken stehen?"
        required
        name="poolSite"
        value={lead.poolSite || ''}
        onChange={(v) => setLead({ poolSite: v })}
        options={SITE_OPTIONS}
      />

      <div>
        <RadioQuestion
          label="Wie sollen die Gartenbau-Arbeiten umgesetzt werden?"
          required
          name="gardenWork"
          value={lead.gardenWork || ''}
          onChange={(v) => setLead({ gardenWork: v, gartenbauer: v === 'gartenbauer' ? lead.gartenbauer : '' })}
          options={GARDEN_OPTIONS}
        />
        {lead.gardenWork === 'gartenbauer' && (
          <div className="ml-[26px] mt-2">
            <Field label="Gartenbauer" required value={lead.gartenbauer || ''} onChange={(v) => setLead({ gartenbauer: v })} />
          </div>
        )}
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

      {error && (
        <p role="alert" className="border-2 border-stalder-ink bg-[#f4f3f0] px-3 py-2 text-sm text-stalder-ink">
          {error}
        </p>
      )}

      <button type="submit" className="btn-stalder w-auto px-8" disabled={submitting} aria-busy={submitting}>
        {submitting ? 'Wird gesendet …' : 'Offerte anfordern'}
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
