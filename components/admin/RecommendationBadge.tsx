import type { Recommendation } from '@/types'

interface Props {
  recommendation: Recommendation
  size?: 'sm' | 'lg'
}

const CONFIG = {
  Advance: {
    bg:     '#D1FAE5',
    text:   '#065F46',
    border: '#6EE7B7',
    icon:   '✓',
  },
  Hold: {
    bg:     '#FEF3C7',
    text:   '#92400E',
    border: '#FCD34D',
    icon:   '~',
  },
  Reject: {
    bg:     '#FEE2E2',
    text:   '#991B1B',
    border: '#FCA5A5',
    icon:   '✗',
  },
}

export function RecommendationBadge({ recommendation, size = 'sm' }: Props) {
  const c = CONFIG[recommendation]

  if (size === 'lg') {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold"
        style={{ background: c.bg, color: c.text, borderColor: c.border }}
      >
        <span className="text-lg leading-none">{c.icon}</span>
        <span className="text-base">{recommendation}</span>
      </div>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                 text-xs font-semibold border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      {c.icon} {recommendation}
    </span>
  )
}