import React from 'react'
import { STAIRS } from '../../data/config'
import { usePoolConfig } from '../../hooks/usePoolConfig'
import { RadioCard } from '../components/Cards'

export default function StepStairs() {
  const stair = usePoolConfig((s) => s.stair)
  const setStair = usePoolConfig((s) => s.setStair)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {STAIRS.map((s) => (
        <RadioCard key={s.id} active={stair === s.id} onClick={() => setStair(s.id)} title={s.label} />
      ))}
    </div>
  )
}
