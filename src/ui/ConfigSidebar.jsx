import React, { useEffect, useState } from 'react'
import {
  POOL_TYPES,
  POOL_SYSTEMS,
  POOL_SIZES,
  NO_STAIR,
  CHLOR_SYSTEM,
  PP_COLORS,
  STEEL_FINISHES,
  PLACEABLES,
  getStairsForType,
  getFilterInfo,
  getSaltInfo,
  getHeatPumpInfo,
  getLedInfo,
  getRolladenPrice,
} from '../data/config'
import { usePoolConfig, formatCHF } from '../hooks/usePoolConfig'

const NAVY = '#1a2b48'

function CheckMark() {
  return (
    <span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow">
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke={NAVY} strokeWidth="2.4">
        <path d="M5 10.5 8.2 14 15 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function PoolTypeThumb({ kind, active }) {
  const fill = active ? '#d7e4f0' : '#eef1f4'
  const ink = active ? NAVY : '#8b93a0'
  if (kind === 'Ueberlauf') {
    return (
      <svg viewBox="0 0 160 100" className="h-full w-full">
        <rect width="160" height="100" fill={fill} />
        <rect x="18" y="28" width="92" height="48" rx="4" fill="#c5d0db" stroke={ink} strokeWidth="2.5" />
        <rect x="110" y="32" width="18" height="40" rx="2" fill="#9aabbc" stroke={ink} strokeWidth="2" />
        <rect x="128" y="38" width="10" height="28" rx="1" fill="#7d8d9c" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 160 100" className="h-full w-full">
      <rect width="160" height="100" fill={fill} />
      <rect x="28" y="26" width="104" height="50" rx="4" fill="#c5d0db" stroke={ink} strokeWidth="2.5" />
      <rect x="68" y="20" width="22" height="10" rx="2" fill={ink} />
    </svg>
  )
}

function DimCard({ label, minLabel, maxLabel, valueLabel, pct }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <div className="mb-3 text-[13px] font-semibold text-[#1a2b48]">{label}</div>
      <div className="relative h-7">
        <div className="absolute left-0 right-0 top-[11px] h-[2px] bg-gray-200" />
        <div className="absolute top-0 text-[11px] text-gray-400">{minLabel}</div>
        <div className="absolute right-0 top-0 text-[11px] text-gray-400">{maxLabel}</div>
        <div
          className="absolute top-[5px] h-[14px] w-[14px] -translate-x-1/2 rounded-full bg-[#1a2b48]"
          style={{ left: `${Math.max(8, Math.min(92, pct))}%` }}
        />
        <div
          className="absolute top-[22px] -translate-x-1/2 rounded-md bg-[#1a2b48] px-2 py-0.5 text-[11px] font-semibold text-white"
          style={{ left: `${Math.max(10, Math.min(90, pct))}%` }}
        >
          {valueLabel}
        </div>
      </div>
    </div>
  )
}

function Accordion({ id, title, openId, setOpenId, children }) {
  const open = openId === id
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpenId(open ? null : id)}
        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-left text-[15px] font-medium text-[#1a2b48] shadow-[0_1px_0_rgba(0,0,0,0.02)]"
      >
        {title}
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 text-[#1a2b48] transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M7 4.5 13 10 7 15.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="space-y-2 px-0.5 pb-1">{children}</div>}
    </div>
  )
}

function RowBtn({ active, onClick, title, price, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
        active ? 'border-[#1a2b48] bg-[#1a2b48]/5' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <span>
        <span className="block font-medium text-[#1a2b48]">{title}</span>
        {hint && <span className="mt-0.5 block text-[11px] text-gray-400">{hint}</span>}
      </span>
      {price != null && <span className="shrink-0 text-xs font-semibold text-[#1a2b48]">{formatCHF(price)}</span>}
    </button>
  )
}

function pctAlong(value, min, max) {
  if (max === min) return 50
  return ((value - min) / (max - min)) * 100
}

export default function ConfigSidebar() {
  const s = usePoolConfig()
  const cancelPlacing = usePoolConfig((st) => st.cancelPlacing)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') cancelPlacing()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancelPlacing])

  const stairs = [...getStairsForType(s.type), NO_STAIR]
  const filter = getFilterInfo(s.sizeId)
  const salt = getSaltInfo(s.sizeId)
  const hp = getHeatPumpInfo(s.sizeId)
  const led = getLedInfo(s.type)
  const countOf = (id) => s.placements.filter((p) => p.catalogId === id).length
  const has = (id) => countOf(id) > 0
  const placingId = s.placing?.catalogId

  const addOrRemove = (id) => {
    if (PLACEABLES[id].exclusive && has(id)) {
      s.removePlacementsByCatalog(id)
      return
    }
    if (PLACEABLES[id].exclusive === 'robot' && has(id)) {
      s.removePlacementsByCatalog(id)
      return
    }
    s.startPlacing(id)
  }

  const lengths = POOL_SIZES.map((x) => x.length)
  const widths = POOL_SIZES.map((x) => x.width)

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-white lg:w-[320px] lg:flex-none">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="grid grid-cols-2 gap-4">
          {POOL_SYSTEMS.map((sys) => {
            const active = s.poolSystem === sys.id
            return (
              <button key={sys.id} type="button" onClick={() => s.setPoolSystem(sys.id)} className="text-center">
                <span className="relative block overflow-hidden rounded-2xl">
                  <PoolTypeThumb kind={sys.id} active={active} />
                  {active && <CheckMark />}
                </span>
                <span className="mt-2 block text-[13px] font-medium text-[#1a2b48]">{sys.label}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 space-y-3">
          <DimCard
            label="Länge"
            minLabel={`${Math.min(...lengths)}m`}
            maxLabel={`${Math.max(...lengths)}m`}
            valueLabel={String(s.length).replace('.', ',')}
            pct={pctAlong(s.length, Math.min(...lengths), Math.max(...lengths))}
          />
          <DimCard
            label="Breite"
            minLabel={`${Math.min(...widths)}m`}
            maxLabel={`${Math.max(...widths)}m`}
            valueLabel={String(s.width).replace('.', ',')}
            pct={pctAlong(s.width, Math.min(...widths), Math.max(...widths))}
          />
          <DimCard label="Tiefe" minLabel="1,5m" maxLabel="1,5m" valueLabel="1,5" pct={50} />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {POOL_SIZES.map((size) => {
            const active = s.sizeId === size.id
            return (
              <button
                key={size.id}
                type="button"
                onClick={() => s.setSizeId(size.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  active ? 'bg-[#1a2b48] text-white' : 'bg-gray-100 text-[#1a2b48] hover:bg-gray-200'
                }`}
              >
                {size.label}
              </button>
            )
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {POOL_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => s.setType(t.id)}
              className={`rounded-2xl border px-3 py-2.5 text-[13px] font-semibold ${
                s.type === t.id ? 'border-[#1a2b48] bg-[#1a2b48] text-white' : 'border-gray-200 text-[#1a2b48]'
              }`}
            >
              {t.id === 'PP' ? 'PP' : 'Chromstahl'}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {s.type === 'PP' ? (
            <div className="grid grid-cols-4 gap-2">
              {PP_COLORS.map((c) => (
                <button key={c.id} type="button" onClick={() => s.setPPColor(c.id)} className="flex flex-col items-center gap-1">
                  <span
                    className={`h-9 w-full rounded-xl border ${s.ppColor === c.id ? 'border-[#1a2b48]' : 'border-gray-200'}`}
                    style={{ background: c.color }}
                  />
                  <span className="text-[10px] text-gray-500">{c.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {STEEL_FINISHES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => s.setSteelFinish(f.id)}
                  className={`rounded-2xl border px-3 py-2 text-[12px] ${
                    s.steelFinish === f.id ? 'border-[#1a2b48] bg-[#1a2b48]/5 text-[#1a2b48]' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {f.label.replace('Chromstahl', '').trim()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-7 mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-[#1a2b48]">Ausstattung</div>
        <div className="space-y-2.5">
          <Accordion id="einstieg" title="Einstieg" openId={openId} setOpenId={setOpenId}>
            {stairs.map((st) => (
              <RowBtn
                key={st.id}
                active={s.stair === st.id}
                onClick={() => s.setStair(st.id)}
                title={st.label}
                price={st.price || null}
                hint={st.id !== 'Keine' ? 'Anschliessend im 3D platzieren' : null}
              />
            ))}
          </Accordion>

          <Accordion id="abdeckung" title="Abdeckung" openId={openId} setOpenId={setOpenId}>
            <RowBtn
              active={s.options.rolladen}
              onClick={() => s.toggleOption('rolladen')}
              title="Rollladen Polycarbonat"
              price={getRolladenPrice(s.sizeId)}
              hint="Lamellen + Welle"
            />
          </Accordion>

          <Accordion id="licht" title="Beleuchtung" openId={openId} setOpenId={setOpenId}>
            <RowBtn active={s.options.led} onClick={() => s.toggleOption('led')} title={led.label} price={led.price} />
          </Accordion>

          <Accordion id="baenke" title="Bänke & Liegen" openId={openId} setOpenId={setOpenId}>
            {['bank', 'liege'].map((id) => (
              <RowBtn
                key={id}
                active={placingId === id || has(id)}
                onClick={() => addOrRemove(id)}
                title={`${has(id) ? `${countOf(id)}× ` : ''}${PLACEABLES[id].label}`}
                price={PLACEABLES[id].price}
                hint={placingId === id ? 'Jetzt im Becken platzieren' : 'Klicken, dann im 3D setzen'}
              />
            ))}
          </Accordion>

          <Accordion id="massage" title="Massage Elemente" openId={openId} setOpenId={setOpenId}>
            {['massageduese', 'schwall'].map((id) => (
              <RowBtn
                key={id}
                active={placingId === id || has(id)}
                onClick={() => addOrRemove(id)}
                title={`${has(id) ? `${countOf(id)}× ` : ''}${PLACEABLES[id].label}`}
                price={PLACEABLES[id].price}
                hint={placingId === id ? 'Jetzt an einer Wand platzieren' : 'Klicken, dann im 3D setzen'}
              />
            ))}
          </Accordion>

          <Accordion id="extras" title="Extras" openId={openId} setOpenId={setOpenId}>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
              <div className="font-medium text-[#1a2b48]">Filteranlage</div>
              <div className="text-[11px] text-gray-500">{filter.label}</div>
              <div className="mt-1 text-xs font-semibold text-[#1a2b48]">{formatCHF(filter.price)}</div>
            </div>
            <RowBtn
              active={s.disinfection === 'chlor'}
              onClick={() => s.setDisinfection('chlor')}
              title={CHLOR_SYSTEM.label}
              price={CHLOR_SYSTEM.price}
            />
            <RowBtn active={s.disinfection === 'salt'} onClick={() => s.setDisinfection('salt')} title={salt.label} price={salt.price} />
            <RowBtn
              active={placingId === 'heatpump' || has('heatpump')}
              onClick={() => addOrRemove('heatpump')}
              title={`Wärmepumpe ${hp.label}`}
              price={hp.price}
              hint="Auf der Terrasse platzieren"
            />
            {['countercurrent', 'robotX60', 'robotX80'].map((id) => (
              <RowBtn
                key={id}
                active={placingId === id || has(id)}
                onClick={() => addOrRemove(id)}
                title={PLACEABLES[id].label}
                price={PLACEABLES[id].price}
                hint={placingId === id ? 'Jetzt im 3D platzieren' : 'Klicken, dann im 3D setzen'}
              />
            ))}
          </Accordion>
        </div>
      </div>
    </aside>
  )
}
