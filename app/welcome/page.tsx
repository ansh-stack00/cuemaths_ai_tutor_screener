'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const router = useRouter()
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [micStatus, setMicStatus] = useState<'idle'|'testing'|'ok'|'denied'>('idle')

  async function testMic() {
    setMicStatus('testing')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setMicStatus('ok')
    } catch {
      setMicStatus('denied')
    }
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Please fill in both fields.')
      return
    }
    if (micStatus !== 'ok') {
      setError('Please test your microphone first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/session/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const { sessionId } = await res.json()
      router.push(`/interview?session=${sessionId}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-100">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ background: 'var(--cue-purple)' }}>
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="font-semibold text-gray-800 text-sm">Cuemath</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md fade-in-up">

          {/* Hero */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
                 style={{ background: 'var(--cue-purple-light)', color: 'var(--cue-purple)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              Tutor Screening Interview
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome to Cuemath
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              You&apos;ll have a short 8–10 minute voice conversation with Priya,
              our AI interviewer. Speak naturally — there are no trick questions.
            </p>
          </div>

          {/* What to expect */}
          <div className="mb-6 p-4 rounded-xl border border-gray-100 bg-gray-50">
            <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
              What to expect
            </p>
            <div className="space-y-2">
              {[
                ['~10 min',    'Voice conversation, no typing needed'],
                ['5 questions','About your teaching style & approach'],
                ['Rubric',     'Scored on 5 dimensions by our team'],
              ].map(([label, desc]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded"
                        style={{ background: 'var(--cue-purple-light)', color: 'var(--cue-purple)' }}>
                    {label}
                  </span>
                  <span className="text-sm text-gray-600">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ravi Sharma"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm
                           outline-none focus:ring-2 focus:ring-purple-200
                           focus:border-purple-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ravi@example.com"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm
                           outline-none focus:ring-2 focus:ring-purple-200
                           focus:border-purple-400 transition-all"
              />
            </div>

            {/* Mic test row */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-colors ${
                  micStatus === 'ok'      ? 'bg-emerald-500' :
                  micStatus === 'denied'  ? 'bg-red-500'     :
                  micStatus === 'testing' ? 'bg-amber-400 animate-pulse' :
                  'bg-gray-300'
                }`} />
                <span className="text-sm text-gray-600">
                  {micStatus === 'idle'    ? 'Test your microphone before starting' :
                   micStatus === 'testing' ? 'Checking access...' :
                   micStatus === 'ok'      ? 'Microphone ready' :
                   'Access denied — allow mic in browser settings'}
                </span>
              </div>
              {micStatus !== 'ok' && (
                <button
                  type="button"
                  onClick={testMic}
                  className="text-xs font-medium px-3 py-1 rounded-lg border
                             border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Test mic
                </button>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || micStatus !== 'ok'}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--cue-purple)' }}
            >
              {loading ? 'Starting interview...' : 'Begin interview with Priya →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            By continuing you agree to your conversation being recorded for evaluation.
          </p>
        </div>
      </main>
    </div>
  )
}