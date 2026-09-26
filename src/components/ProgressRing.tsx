interface ProgressRingProps {
  value: number
  size?: number
  stroke?: number
  label?: string
}

export function ProgressRing({ value, size = 80, stroke = 6, label }: ProgressRingProps) {
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3366ff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className={`${valueClass} font-bold text-slate-900`}>{value}%</div>
        {label && <div className={`${labelClass} text-muted leading-tight`}>{label}</div>}
      </div>
    </div>
  )
}
