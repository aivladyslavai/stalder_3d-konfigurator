import React, { useState } from 'react'
import { usePoolConfig } from '../../hooks/usePoolConfig'

function Field({ label, required, type = 'text', value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label} {required && <span className="text-[#32B4E6]">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#32B4E6] focus:ring-1 focus:ring-[#32B4E6]/30"
      />
    </label>
  )
}

const TRUST = [
  { title: 'Swiss Quality', desc: 'Höchste Qualität und Präzision.' },
  { title: 'Persönliche Beratung', desc: 'Individuelle Beratung durch unsere Experten.' },
  { title: 'Custom Engineering', desc: 'Massgefertigte Lösungen für Ihr Projekt.' },
]

export default function LeadForm() {
  const lead = usePoolConfig((s) => s.lead)
  const setLead = usePoolConfig((s) => s.setLead)
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center">
        <div className="text-lg font-semibold text-gray-900">Vielen Dank, {lead.firstName || 'für Ihre Anfrage'}!</div>
        <p className="mt-1 text-sm text-gray-600">
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
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">Nachricht</span>
        <textarea
          rows={3}
          value={lead.message}
          onChange={(e) => setLead({ message: e.target.value })}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#32B4E6] focus:ring-1 focus:ring-[#32B4E6]/30"
        />
      </label>

      <button
        type="submit"
        className="rounded-full bg-[#32B4E6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1f9fd1]"
      >
        Offerte anfordern
      </button>

      <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
        {TRUST.map((t) => (
          <div key={t.title} className="text-center">
            <div className="text-sm font-semibold text-[#002B6F]">{t.title}</div>
            <div className="mt-0.5 text-xs text-gray-500">{t.desc}</div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400">
        Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
      </p>
    </form>
  )
}
