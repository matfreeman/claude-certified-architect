import type { CSSProperties } from 'react'
import type { StackArea } from '../types'

interface Props {
  areas: StackArea[]
  dense?: boolean
}

export default function StackBadges({ areas, dense = false }: Props) {
  if (areas.length === 0) return null

  return (
    <div className={`stack-chip-row ${dense ? 'is-dense' : ''}`}>
      {areas.map((area) => (
        <span
          key={area.key}
          className="stack-chip"
          style={{ '--stack-color': area.color, '--stack-bg': area.bgColor } as CSSProperties}
          title={area.description}
        >
          {area.label}
        </span>
      ))}
    </div>
  )
}
