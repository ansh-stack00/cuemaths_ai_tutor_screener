interface Props {
  label:    string
  score:    number
  max:      number
  notes:    string
  evidence: string[]
}

export function DimensionBar({ label, score, max, notes, evidence }: Props) {
  const pct   = (score / max) * 100
  const color = score >= 4 ? '#059669'
              : score >= 3 ? '#D97706'
              : '#DC2626'

  const scoreLabel = score >= 4.5 ? 'Exceptional'
                   : score >= 3.5 ? 'Strong'
                   : score >= 2.5 ? 'Average'
                   : score >= 1.5 ? 'Below par'
                   : 'Poor'

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      {/* Label + score */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${color}18`, color }}>
            {scoreLabel}
          </span>
          <span className="text-sm font-mono font-semibold text-gray-700">
            {score}<span className="text-gray-400 font-normal">/{max}</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      {/* Notes */}
      <p className="text-xs text-gray-500 mb-2">{notes}</p>

      {/* Evidence quotes */}
      {evidence.length > 0 && (
        <div className="space-y-1.5 mt-2">
          {evidence.map((quote, i) => (
            <div key={i}
                 className="flex gap-2 pl-2 border-l-2 border-gray-200">
              <p className="text-xs text-gray-600 italic leading-relaxed">
                &ldquo;{quote}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}