import React from 'react'
import { POOL_TYPES } from '../../data/config'
import { usePoolConfig } from '../../hooks/usePoolConfig'
import { RadioCard } from '../components/Cards'

export default function StepPoolType() {
  const type = usePoolConfig((s) => s.type)
  const setType = usePoolConfig((s) => s.setType)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {POOL_TYPES.map((t) => (
        <RadioCard
          key={t.id}
          active={type === t.id}
          onClick={() => setType(t.id)}
          title={t.label}
          desc={t.desc}
        />
      ))}
    </div>
  )
}
