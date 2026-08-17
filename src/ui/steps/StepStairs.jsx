import React from 'react'
import { NO_STAIR, getStairsForType } from '../../data/config'
import { usePoolConfig, formatCHF } from '../../hooks/usePoolConfig'
import { RadioCard } from '../components/Cards'

export default function StepStairs() {
  const { type, stair } = usePoolConfig()
  const setStair = usePoolConfig((s) => s.setStair)
  const stairs = [...getStairsForType(type), NO_STAIR]

  return (
    <div className="grid grid-cols-1 gap-3">
      {stairs.map((s) => (
        <RadioCard
          key={s.id}
          active={stair === s.id}
          onClick={() => setStair(s.id)}
          title={s.label}
          desc={s.price > 0 ? `+ ${formatCHF(s.price)}` : 'Im Preis nicht enthalten'}
        />
      ))}
    </div>
  )
}
