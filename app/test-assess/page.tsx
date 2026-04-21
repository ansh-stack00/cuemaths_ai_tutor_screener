'use client'

import { useState } from 'react'

const TEST_MESSAGES = [
  { role: 'interviewer', content: 'Can you explain fractions to a 9-year-old?' },
  { role: 'candidate',   content: 'Sure! I would use a pizza. If you cut a pizza into 4 equal slices, each slice is one-fourth. I make sure every child holds the pieces so they feel what equal really means.' },
  { role: 'interviewer', content: 'A student has been stuck for 5 minutes and wants to give up. What do you do?' },
  { role: 'candidate',   content: 'First I sit next to them and say it is completely okay to feel stuck. Then I ask them to tell me what they do understand, so we find the exact gap. I never solve it for them.' },
  { role: 'interviewer', content: 'How would you make math fun for a child who hates it?' },
  { role: 'candidate',   content: 'I find what they love — cricket scores, cooking, video games — and bring math into that. A child who loves cricket already understands averages. I just show them they were doing math all along.' },
]

export default function TestAssessPage() {
  const [sessionId, setSessionId] = useState('')
  const [status, setStatus]       = useState('')
  const [result, setResult]       = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading]     = useState(false)

  // Step 1: create a real session
  async function createSession() {
    setStatus('Creating session...')
    const res  = await fetch('/api/session/create', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: 'Test Candidate', email: 'test@test.com' }),
    })
    const data = await res.json()
    setSessionId(data.sessionId)
    setStatus(`Session created: ${data.sessionId}`)
    return data.sessionId
  }

  // Step 2: run assessment
  async function runAssessment() {
    setLoading(true)
    setResult(null)

    try {
      let sid = sessionId
      if (!sid) {
        sid = await createSession()
      }

      setStatus('Calling /api/assess...')

      const res = await fetch('/api/assess', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sessionId:       sid,
          durationSeconds: 480,
          messages:        TEST_MESSAGES,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus(`Error ${res.status}: ${JSON.stringify(data)}`)
      } else {
        setStatus('Assessment generated successfully!')
        setResult(data.assessment)
      }
    } catch (err) {
      setStatus(`Exception: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-4">

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="font-semibold text-gray-900 mb-1">Assessment API tester</h1>
          <p className="text-sm text-gray-500 mb-4">
            Creates a real session, fires the assess endpoint, shows the rubric.
          </p>

          <button
            onClick={runAssessment}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white
                       disabled:opacity-50 hover:opacity-90 transition-all"
            style={{ background: 'var(--cue-purple)' }}
          >
            {loading ? 'Generating rubric...' : 'Run assessment test'}
          </button>

          {status && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-mono text-gray-600 break-all">{status}</p>
            </div>
          )}
        </div>

        {/* Rubric output */}
        {result && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Rubric output
            </p>

            {/* Overall */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <span className="text-2xl font-bold text-gray-900">
                {(result as {overall_score: number}).overall_score}/5
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                (result as {overall_recommendation: string}).overall_recommendation === 'Advance'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : (result as {overall_recommendation: string}).overall_recommendation === 'Hold'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {(result as {overall_recommendation: string}).overall_recommendation}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {(result as {summary: string}).summary}
            </p>

            {/* Dimensions */}
            <div className="space-y-3">
              {Object.entries(
                (result as {dimensions: Record<string, {score: number; max: number; notes: string; evidence: string[]}>}).dimensions
              ).map(([key, dim]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono font-semibold text-gray-600">
                      {dim.score}/{dim.max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(dim.score / dim.max) * 100}%`,
                        background: dim.score >= 4 ? '#059669'
                                  : dim.score >= 3 ? '#D97706' : '#DC2626',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{dim.notes}</p>
                  {dim.evidence.map((q, i) => (
                    <p key={i} className="text-xs text-gray-600 italic mt-1
                                          pl-2 border-l-2 border-gray-200">
                      &ldquo;{q}&rdquo;
                    </p>
                  ))}
                </div>
              ))}
            </div>

            {/* View in admin */}
            {sessionId && (
              
                <a href={`/admin/${sessionId}`}
                className="mt-4 block text-center text-sm underline"
                style={{ color: 'var(--cue-purple)' }}
              >
                View full rubric in admin →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}