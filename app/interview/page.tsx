'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function InterviewContent() {
  const params    = useSearchParams()
  const sessionId = params.get('session')

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-3">No session found.</p>
          <a href="/welcome" className="text-sm underline"
             style={{ color: 'var(--cue-purple)' }}>
            ← Back to welcome
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full flex items-center justify-center
                        mx-auto mb-4 pulse-ring"
             style={{ background: 'var(--cue-purple)' }}>
          <span className="text-white text-2xl font-bold">P</span>
        </div>
        <p className="font-semibold text-gray-800 mb-1">Priya is ready</p>
        <p className="text-sm text-gray-500 mb-2">
          Session: <code className="font-mono text-xs bg-gray-100 px-1 rounded">
            {sessionId}
          </code>
        </p>
        <p className="text-xs text-gray-400">
          Full voice interview UI — coming Day 3.
        </p>
      </div>
    </div>
  )
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-gray-200
                        border-t-purple-500 animate-spin" />
      </div>
    }>
      <InterviewContent />
    </Suspense>
  )
}