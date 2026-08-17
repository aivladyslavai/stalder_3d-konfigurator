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
  getBasePrice,
} from '../data/config'
import { usePoolConfig, formatCHF } from '../hooks/usePoolConfig'

function Chevron({ open }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="currentColor">
      <path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function Accordion({ id, title, openId, setOpenId, children }) {
  const open = openId === id
  return (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={() => setOpenId(open ? null : id)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
      >
        {title}
        <Chevron open={open} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function PoolTypeIcon({ kind, active }) {
  const stroke = active ? '#002B6F' : '#9ca3af'
  if (kind === 'Ueberlauf') {
    return (
      <svg viewBox="0 0 72 48" className="h-10 w-14">
        <rect x="8" y="10" width="48" height="28" rx="2" fill="none" stroke={stroke} strokeWidth="2.2" />
        <path d="M56 14h8v20h-8" fill="none" stroke={stroke} strokeWidth="2.2" />
        <path d="M56 24h8" stroke={stroke} strokeWidth="2.2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 72 48" className="h-10 w-14">
      <rect x="12" y="10" width="48" height="28" rx="2" fill="none" stroke={stroke} strokeWidth="2.2" />
      <rect x="28" y="8" width="10" height="5" rx="1" fill={stroke} />
    </svg>
  )
}

function RowBtn({ active, onClick, title, price, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
        active ? 'border-[#32B4E6] bg-[#32B4E6]/10' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <span>
        <span className="block font-medium text-gray-900">{title}</span>
        {hint && <span className="mt-0.5 block text-[11px] text-gray-500">{hint}</span>}
      </span>
      {price != null && <span className="shrink-0 text-xs font-semibold text-[#002B6F]">{formatCHF(price)}</span>}
    </button>
  )
}

export default function ConfigSidebar() {
  const s = usePoolConfig()
  const cancelPlacing = usePoolConfig((st) => st.cancelPlacing)
  const [openId, setOpenId] = useState('einstieg')

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

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-gray-100 bg-white lg:w-[300px] lg:flex-none">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#32B4E6]">Pool Konfigurator</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 px-4 py-4">
          {POOL_SYSTEMS.map((sys) => {
            const active = s.poolSystem === sys.id
            return (
              <button
                key={sys.id}
                type="button"
                onClick={() => s.setPoolSystem(sys.id)}
                className={`relative flex flex-col items-center rounded-lg border-2 px-2 py-3 ${
                  active ? 'border-[#002B6F] bg-[#002B6F]/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {active && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#32B4E6] text-[9px] text-white">✓</span>
                )}
                <PoolTypeIcon kind={sys.id} active={active} />
                <span className="mt-1 text-xs font-semibold text-gray-800">{sys.label}</span>
              </button>
            )
          })}
        </div>

        <div className="px-4 pb-3">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Material</div>
          <div className="grid grid-cols-2 gap-2">
            {POOL_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => s.setType(t.id)}
                className={`rounded-md border px-2 py-2 text-xs font-semibold ${
                  s.type === t.id ? 'border-[#002B6F] bg-[#002B6F] text-white' : 'border-gray-200 text-gray-700'
                }`}
              >
                {t.id === 'PP' ? 'PP' : 'Chromstahl'}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Grösse</div>
          <div className="grid grid-cols-3 gap-1.5">
            {POOL_SIZES.map((size) => {
              const active = s.sizeId === size.id
              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => s.setSizeId(size.id)}
                  title={size.dimsLabel}
                  className={`rounded-md border px-1 py-2 text-center ${
                    active ? 'border-[#32B4E6] bg-[#32B4E6]/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-bold text-gray-900">{size.label}</div>
                  <div className="text-[9px] leading-tight text-gray-500">
                    {size.length}×{size.width} m
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-2 text-[11px] text-gray-500">
            {POOL_SIZES.find((x) => x.id === s.sizeId)?.dimsLabel} · ab {formatCHF(getBasePrice(s.type, s.poolSystem, s.sizeId))}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Farbe</div>
          {s.type === 'PP' ? (
            <div className="grid grid-cols-4 gap-2">
              {PP_COLORS.map((c) => (
                <button key={c.id} type="button" onClick={() => s.setPPColor(c.id)} className="flex flex-col items-center gap-1">
                  <span
                    className={`h-8 w-full rounded border-2 ${s.ppColor === c.id ? 'border-[#32B4E6]' : 'border-gray-200'}`}
                    style={{ background: c.color }}
                  />
                  <span className="text-[10px] text-gray-600">{c.label}</span>
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
                  className={`rounded-md border px-2 py-2 text-xs ${s.steelFinish === f.id ? 'border-[#32B4E6] bg-[#32B4E6]/10' : 'border-gray-200'}`}
                >
                  {f.label.replace('Chromstahl', '').trim()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
          Ausstattung
        </div>

        <Accordion id="einstieg" title="Einstieg" openId={openId} setOpenId={setOpenId}>
          <div className="space-y-2">
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
          </div>
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
          <div className="space-y-2">
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
          </div>
        </Accordion>

        <Accordion id="massage" title="Massage Elemente" openId={openId} setOpenId={setOpenId}>
          <div className="space-y-2">
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
          </div>
        </Accordion>

        <Accordion id="technik" title="Technik" openId={openId} setOpenId={setOpenId}>
          <div className="space-y-2">
            <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <div className="font-medium text-gray-900">Filteranlage</div>
              <div className="text-[11px] text-gray-500">{filter.label}</div>
              <div className="mt-1 text-xs font-semibold text-[#002B6F]">{formatCHF(filter.price)}</div>
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
          </div>
        </Accordion>

        <Accordion id="extras" title="Extras" openId={openId} setOpenId={setOpenId}>
          <div className="space-y-2">
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
          </div>
        </Accordion>
      </div>
    </aside>
  )
}
