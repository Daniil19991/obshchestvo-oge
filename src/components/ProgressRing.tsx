import { useId } from 'react'

interface ProgressRingProps {
  value: number
  /** цвет дуги; по умолчанию — фирменный градиент */
  color?: string
  size?: number
  stroke?: number
  label?: string
}

export function ProgressRing({ value, size = 80, stroke = 6, label, color }: ProgressRingProps) {
  const gradientId = useId()
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const valueClass =
    size >= 100 ? 'text-3xl' : size >= 80 ? 'text-xl' : 'text-lg'
  const labelClass =
    size >= 100 ? 'text-sm' : size >= 80 ? 'text-xs' : 'text-[10px]'

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color ?? '#8b93ea'} />
            <stop offset="100%" stopColor={color ?? '#4a50c8'} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ecedf5"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className={`${valueClass} font-bold text-ink`}>{value}%</div>
        {label && <div className={`${labelClass} text-muted leading-tight`}>{label}</div>}
      </div>
    </div>
  )
}
