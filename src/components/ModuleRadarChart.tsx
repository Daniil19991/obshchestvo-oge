import type { ModuleMastery } from '../types'

interface ModuleRadarChartProps {
  data: ModuleMastery[]
  size?: number
}

function wrapTitleToLines(title: string): string[] {
  const words = title.split(' ')
  if (words.length <= 2) return [title]
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

export function ModuleRadarChart({ data, size = 420 }: ModuleRadarChartProps) {
  const center = size / 2
  const maxRadius = size * 0.3
  const count = data.length
  const angleStep = (2 * Math.PI) / count
  const startAngle = -Math.PI / 2

  const pointAt = (index: number, value: number) => {
    const angle = startAngle + index * angleStep
    const radius = (value / 100) * maxRadius
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  }

  const axisEnd = (index: number) => pointAt(index, 100)

  const gridLevels = [25, 50, 75, 100]
  const polygonPoints = data
    .map((item, i) => {
      const p = pointAt(i, item.value)
      return `${p.x},${p.y}`
    })
    .join(' ')

  return (
    <div className="flex flex-col items-center w-full">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible max-w-full h-auto"
      >
        {gridLevels.map((level) => {
          const points = data
            .map((_, i) => {
              const p = pointAt(i, level)
              return `${p.x},${p.y}`
            })
            .join(' ')
          return (
            <polygon
              key={level}
              points={points}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={level === 100 ? 1.5 : 1}
            />
          )
        })}

        {data.map((_, i) => {
          const end = axisEnd(i)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          )
        })}

        <polygon
          points={polygonPoints}
          fill="rgba(51, 102, 255, 0.2)"
          stroke="#3366ff"
          strokeWidth={2}
          strokeLinejoin="round"
          className="transition-all duration-700"
        />

        {data.map((item, i) => {
          const p = pointAt(i, item.value)
          return (
            <circle
              key={item.moduleId}
              cx={p.x}
              cy={p.y}
              r={5}
              fill="#3366ff"
              stroke="white"
              strokeWidth={2}
              className="transition-all duration-700"
            />
          )
        })}

        {data.map((item, i) => {
          const labelRadius = maxRadius + 52
          const angle = startAngle + i * angleStep
          const x = center + labelRadius * Math.cos(angle)
          const y = center + labelRadius * Math.sin(angle)
          const anchor =
            Math.abs(Math.cos(angle)) < 0.2 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'

          const lines = wrapTitleToLines(item.title)
          const titleLineHeight = 15
          const titleBlockHeight = lines.length * titleLineHeight
          const iconOffset = lines.length > 1 ? 20 : 14
          const percentOffset = titleBlockHeight + 10

          return (
            <g key={`label-${item.moduleId}`}>
              <text
                x={x}
                y={y - iconOffset}
                textAnchor={anchor}
                fontSize={18}
                className="fill-slate-500"
              >
                {item.icon}
              </text>
              <text
                x={x}
                y={y + 4}
                textAnchor={anchor}
                fontSize={13}
                fontWeight={500}
                className="fill-slate-700"
              >
                {lines.map((line, lineIndex) => (
                  <tspan key={lineIndex} x={x} dy={lineIndex === 0 ? 0 : titleLineHeight}>
                    {line}
                  </tspan>
                ))}
              </text>
              <text
                x={x}
                y={y + 4 + percentOffset}
                textAnchor={anchor}
                fontSize={14}
                fontWeight={700}
                className="fill-brand-600"
              >
                {item.value}%
              </text>
            </g>
          )
        })}

        <circle cx={center} cy={center} r={3} fill="#3366ff" />
      </svg>
    </div>
  )
}
