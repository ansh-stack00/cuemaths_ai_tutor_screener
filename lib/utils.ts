import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

export function getRecommendationColor(rec: string | null): string {
  switch (rec) {
    case 'Advance': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    case 'Hold':    return 'text-amber-700 bg-amber-50 border-amber-200'
    case 'Reject':  return 'text-red-700 bg-red-50 border-red-200'
    default:        return 'text-gray-500 bg-gray-50 border-gray-200'
  }
}

export function scoreToLabel(score: number): string {
  if (score >= 4.5) return 'Exceptional'
  if (score >= 3.5) return 'Strong'
  if (score >= 2.5) return 'Average'
  if (score >= 1.5) return 'Below par'
  return 'Poor'
}