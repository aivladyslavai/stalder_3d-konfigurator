import React from 'react'
import { POOL_SYSTEMS } from '../../data/config'
import { usePoolConfig } from '../../hooks/usePoolConfig'
import { RadioCard } from '../components/Cards'

export default function StepPoolSystem() {
  const poolSystem = usePoolConfig((s) => s.poolSystem)
  const setPoolSystem = usePoolConfig((s) => s.setPoolSystem)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {POOL_SYSTEMS.map((s) => (
        <RadioCard
          key={s.id}
          active={poolSystem === s.id}
          onClick={() => setPoolSystem(s.id)}
          title={s.label}
          desc={s.desc}
        />
      ))}
    </div>
  )
}
