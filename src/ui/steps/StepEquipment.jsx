import React from 'react'
import { EQUIPMENT } from '../../data/config'
import { usePoolConfig } from '../../hooks/usePoolConfig'
import { CheckCard } from '../components/Cards'

export default function StepEquipment() {
  const options = usePoolConfig((s) => s.options)
  const toggleOption = usePoolConfig((s) => s.toggleOption)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {EQUIPMENT.map((e) => (
        <CheckCard
          key={e.id}
          active={!!options[e.id]}
          onClick={() => toggleOption(e.id)}
          title={e.label}
          desc={e.desc}
        />
      ))}
    </div>
  )
}
