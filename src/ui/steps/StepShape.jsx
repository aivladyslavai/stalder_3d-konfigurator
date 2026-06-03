import React from 'react'
import { SHAPES } from '../../data/config'
import { usePoolConfig } from '../../hooks/usePoolConfig'
import { RadioCard } from '../components/Cards'

export default function StepShape() {
  const shape = usePoolConfig((s) => s.shape)
  const setShape = usePoolConfig((s) => s.setShape)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SHAPES.map((s) => (
        <RadioCard
          key={s.id}
          active={shape === s.id}
          onClick={() => setShape(s.id)}
          title={s.label}
        />
      ))}
    </div>
  )
}
