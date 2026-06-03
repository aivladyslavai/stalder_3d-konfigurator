import React from 'react'
import { usePoolConfig } from '../hooks/usePoolConfig'
import { SCENE_OPTIONS, TIME_OPTIONS, DECK_MATERIALS } from '../data/config'

// kleine Belag-Vorschaufarben für die Swatches
const SWATCH_BG = {
  'stone-light': 'repeating-linear-gradient(45deg,#d8d2c4,#d8d2c4 5px,#cdc7b8 5px,#cdc7b8 6px)',
  'stone-dark': 'repeating-linear-gradient(45deg,#5d5953,#5d5953 5px,#514d48 5px,#514d48 6px)',
  travertin: 'repeating-linear-gradient(45deg,#e7ddc6,#e7ddc6 5px,#ddd2b8 5px,#ddd2b8 6px)',
  wood: 'repeating-linear-gradient(0deg,#b6854f,#b6854f 4px,#9f6f3b 4px,#9f6f3b 5px)',
  concrete: '#bdbbb5',
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-gray-200 bg-white/70 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            value === o.id ? 'bg-[#002B6F] text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Schwebendes Steuerpanel über der 3D-Vorschau:
 * Umgebung (Terrasse/Innenraum), Tageszeit und Bodenbelag.
 */
export default function EnvControls() {
  const { scene, timeOfDay, deck } = usePoolConfig()
  const setScene = usePoolConfig((s) => s.setScene)
  const setTimeOfDay = usePoolConfig((s) => s.setTimeOfDay)
  const setDeck = usePoolConfig((s) => s.setDeck)

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-10 w-60 rounded-xl border border-white/40 bg-white/75 p-3 shadow-lg backdrop-blur-md">
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#32B4E6]">Umgebung</div>
          <Segmented options={SCENE_OPTIONS} value={scene} onChange={setScene} />
        </div>

        {scene === 'outdoor' && (
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#32B4E6]">Tageszeit</div>
            <Segmented options={TIME_OPTIONS} value={timeOfDay} onChange={setTimeOfDay} />
          </div>
        )}

        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#32B4E6]">Bodenbelag</div>
          <div className="grid grid-cols-5 gap-1.5">
            {DECK_MATERIALS.map((m) => (
              <button
                key={m.id}
                onClick={() => setDeck(m.id)}
                title={m.label}
                className={`h-8 w-full rounded-md border-2 transition-all ${
                  deck === m.id ? 'border-[#32B4E6] ring-2 ring-[#32B4E6]/30' : 'border-white/60'
                }`}
                style={{ background: SWATCH_BG[m.id] }}
              />
            ))}
          </div>
          <div className="mt-1 text-[11px] font-medium text-gray-600">
            {DECK_MATERIALS.find((m) => m.id === deck)?.label}
          </div>
        </div>
      </div>
    </div>
  )
}
