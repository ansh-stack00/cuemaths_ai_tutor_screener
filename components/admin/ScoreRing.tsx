interface Props {
  score: number   // 0–5
  size?:  number  // px, default 72
}

export function ScoreRing({ score, size = 72 }: Props) {
  const radius      = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const pct         = score / 5
  const dashOffset  = circumference * (1 - pct)

  const color = score >= 4 ? '#059669'
              : score >= 3 ? '#D97706'
              : '#DC2626'

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#F3F4F6" strokeWidth="4"
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold leading-none"
              style={{ color }}>
          {score.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400 leading-none mt-0.5">/ 5</span>
      </div>
    </div>
  )
}