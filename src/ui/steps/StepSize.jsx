import React from 'react'
import { POOL_SIZES } from '../../data/config'
import { usePoolConfig, formatCHF } from '../../hooks/usePoolConfig'
import { getBasePrice } from '../../data/config'

export default function StepSize() {
  const { type, poolSystem, sizeId } = usePoolConfig()
  const setSizeId = usePoolConfig((s) => s.setSizeId)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {POOL_SIZES.map((size) => {
        const active = sizeId === size.id
        const basePrice = getBasePrice(type, poolSystem, size.id)
        return (
          <button
            key={size.id}
            type="button"
            onClick={() => setSizeId(size.id)}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              active
                ? 'border-[#32B4E6] bg-[#32B4E6]/10 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-lg font-bold text-gray-900">{size.label}</div>
                <div className="mt-0.5 text-xs text-gray-500">{size.dimsLabel}</div>
              </div>
              <span
                className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                  active ? 'border-[#32B4E6]' : 'border-gray-300'
                }`}
              >
                {active && <span className="h-2 w-2 rounded-full bg-[#32B4E6]" />}
              </span>
            </div>
            <div className="mt-2 text-sm font-semibold text-[#002B6F]">
              ab {formatCHF(basePrice)}
            </div>
          </button>
        )
      })}
    </div>
  )
}
