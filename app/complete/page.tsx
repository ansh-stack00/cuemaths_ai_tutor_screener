'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CompleteContent() {
  const params    = useSearchParams()
  const sessionId = params.get('session')

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 py-4 border-b border-gray-100">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ background: 'var(--cue-purple)' }}>
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="font-semibold text-gray-800 text-sm">Cuemath</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md fade-in-up">
          <div className="w-16 h-16 rounded-full flex items-center justify-center
                          mx-auto mb-6 bg-emerald-50">
            <svg className="w-8 h-8 text-emerald-600" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Interview complete!
          </h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Thank you for speaking with Priya. Our team will review your
            interview and be in touch within 2–3 business days.
          </p>

          {sessionId && (
            <p className="text-xs text-gray-400 mb-8">
              Reference ID:{' '}
              <code className="font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                {sessionId}
              </code>
            </p>
          )}

          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 text-left mb-6">
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              What happens next
            </p>
            <div className="space-y-1.5 text-sm text-gray-600">
              <p>→ Your responses are evaluated across 5 dimensions</p>
              <p>→ A hiring team member reviews the assessment</p>
              <p>→ You&apos;ll hear back within 2–3 business days</p>
            </div>
          </div>

          <Link href="/welcome" className="text-sm underline"
                style={{ color: 'var(--cue-purple)' }}>
            Return to home
          </Link>
        </div>
      </main>
    </div>
  )
}

export default function CompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-gray-200
                        border-t-purple-500 animate-spin" />
      </div>
    }>
      <CompleteContent />
    </Suspense>
  )
}