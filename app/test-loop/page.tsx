'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMicrophone } from '@/hooks/useMicrophone'
import { useWaveform }   from '@/hooks/useWaveform'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'

type Phase =
  | 'idle'
  | 'priya_speaking'
  | 'user_turn'
  | 'recording'
  | 'transcribing'
  | 'thinking'
  | 'error'

interface Turn {
  role:    'priya' | 'you'
  content: string
}

const WELCOME_TEXT =
  "Hi there! I'm Priya from Cuemath. Thanks for joining today. " +
  "Before we begin, could you tell me a little bit about yourself " +
  "and your teaching experience?"

export default function TestLoopPage() {
  const [phase, setPhase]     = useState<Phase>('idle')
  const [turns, setTurns]     = useState<Turn[]>([])
  const [error, setError]     = useState('')
  const [latency, setLatency] = useState<{ stt?: number; llm?: number; tts?: number }>({})

  const historyRef          = useRef<Array<{ role: 'interviewer' | 'candidate'; content: string }>>([])
  const sessionId           = useRef<string>('')   // ← empty, filled after real session created
  const transcriptScrollRef = useRef<HTMLDivElement>(null)
  const isProcessingRef = useRef(false)

  const { micState, startRecording, stopRecording } = useMicrophone()
  const { barHeights, attachStream, detach }         = useWaveform()

  const onPlaybackEnd = useCallback(() => {
    setPhase('user_turn')
  }, [])

  const { playerState, playTTS } = useAudioPlayer({ onPlaybackEnd })

  // Auto-scroll transcript
  useEffect(() => {
    transcriptScrollRef.current?.scrollTo({
      top:      transcriptScrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [turns])

  // Wire waveform to mic stream
  useEffect(() => {
    if (micState === 'recording') {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(s => attachStream(s))
        .catch(() => {})
    } else {
      detach()
    }
  }, [micState, attachStream, detach])

  // ── Start ─────────────────────────────────────────────────
  async function handleStart() {
    setPhase('priya_speaking')
    setError('')

    // 1. Create a real Supabase session first — needed for saveMessage
    try {
      const res  = await fetch('/api/session/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: 'Test User', email: 'test@test.com' }),
      })
      const data = await res.json()
      if (!data.sessionId) throw new Error('No sessionId returned')
      sessionId.current = data.sessionId
      console.log('[test-loop] Session created:', sessionId.current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      setPhase('error')
      return
    }

    // 2. Seed history and transcript with Priya's welcome
    setTurns([{ role: 'priya', content: WELCOME_TEXT }])
    historyRef.current = [{ role: 'interviewer', content: WELCOME_TEXT }]

    // 3. Play welcome audio
    try {
      const t0 = performance.now()
      await playTTS(WELCOME_TEXT)
      setLatency(l => ({ ...l, tts: Math.round(performance.now() - t0) }))
      // onPlaybackEnd fires automatically → phase becomes 'user_turn'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TTS failed')
      setPhase('error')
    }
  }

  // ── Record ────────────────────────────────────────────────
  async function handleRecord() {
    setPhase('recording')
    setError('')
    await startRecording()
  }

  // ── Stop → STT → Claude → TTS ────────────────────────────
  async function handleStop() {
  if (isProcessingRef.current) return
  isProcessingRef.current = true

  try {
    const blob = await stopRecording()
    if (!blob) {
      setError('No audio captured — try speaking closer to the mic.')
      setPhase('user_turn')
      return
    }

    setPhase('transcribing')
    const t0Stt = performance.now()
    let transcript = ''

    try {
      const form = new FormData()
      form.append('audio', blob, 'recording.webm')
      const res  = await fetch('/api/transcribe', { method: 'POST', body: form })
      const data = await res.json()
      transcript = data.transcript?.trim() ?? ''
      setLatency(l => ({ ...l, stt: Math.round(performance.now() - t0Stt) }))
    } catch {
      setError('Transcription failed — please try again.')
      setPhase('user_turn')
      return
    }

    if (!transcript) {
      setError("Didn't catch that — please speak clearly and try again.")
      setPhase('user_turn')
      return
    }

    setTurns(t => [...t, { role: 'you', content: transcript }])
    historyRef.current.push({ role: 'candidate', content: transcript })

    setPhase('thinking')
    const t0Llm  = performance.now()
    let reply      = ''
    let isComplete = false

    try {
      const res  = await fetch('/api/respond', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sessionId:  sessionId.current,
          messages:   historyRef.current.slice(0, -1),
          newMessage: transcript,
        }),
      })
      const data = await res.json()
      reply      = data.reply      ?? ''
      isComplete = data.isComplete ?? false
      setLatency(l => ({ ...l, llm: Math.round(performance.now() - t0Llm) }))
    } catch {
      setError('Claude response failed — please try again.')
      setPhase('user_turn')
      return
    }

    if (!reply) {
      setError('Empty response from Claude.')
      setPhase('user_turn')
      return
    }

    setTurns(t => [...t, { role: 'priya', content: reply }])
    historyRef.current.push({ role: 'interviewer', content: reply })

    setPhase('priya_speaking')
    try {
      const t0Tts = performance.now()
      await playTTS(reply)
      setLatency(l => ({ ...l, tts: Math.round(performance.now() - t0Tts) }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TTS failed')
      setPhase('user_turn')
      return
    }

    if (isComplete) {
      setPhase('idle')
    }

  } finally {
    isProcessingRef.current = false
  }
}

  // ── UI helpers ────────────────────────────────────────────
  const phaseLabel = {
    idle:           'Press "Start test" to begin',
    priya_speaking: playerState === 'loading' ? 'Generating audio...' : 'Priya is speaking...',
    user_turn:      'Your turn — press Record',
    recording:      '● Recording — press Stop when done',
    transcribing:   'Transcribing...',
    thinking:       'Priya is thinking...',
    error:          'Error — see below',
  }[phase]

  const phaseColor = {
    idle:           'text-gray-400',
    priya_speaking: 'text-purple-600',
    user_turn:      'text-emerald-600',
    recording:      'text-red-600',
    transcribing:   'text-amber-600',
    thinking:       'text-blue-600',
    error:          'text-red-600',
  }[phase]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                          text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Day 3 — Full loop test
          </div>
          {sessionId.current && (
            <p className="text-xs font-mono text-gray-400 mt-1 ml-1">
              session: {sessionId.current}
            </p>
          )}
        </div>

        {/* Priya card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center
                          text-white text-xl font-bold flex-shrink-0 ${
                phase === 'priya_speaking' ? 'pulse-ring' : ''
              }`}
              style={{ background: 'var(--cue-purple)' }}
            >
              P
            </div>

            {/* Name + status */}
            <div>
              <p className="font-semibold text-gray-900">Priya</p>
              <p className={`text-sm font-medium ${phaseColor}`}>{phaseLabel}</p>
            </div>

            {/* Latency panel */}
            {(latency.stt || latency.llm || latency.tts) && (
              <div className="ml-auto text-right space-y-0.5">
                {latency.stt && (
                  <p className="text-xs font-mono text-gray-400">STT {latency.stt}ms</p>
                )}
                {latency.llm && (
                  <p className="text-xs font-mono text-gray-400">LLM {latency.llm}ms</p>
                )}
                {latency.tts && (
                  <p className="text-xs font-mono text-gray-400">TTS {latency.tts}ms</p>
                )}
              </div>
            )}
          </div>

          {/* Waveform bars */}
          <div className="flex items-center justify-center gap-1.5 h-10 mb-4">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full transition-all duration-75"
                style={{
                  height:     `${Math.max(6, h * 40)}px`,
                  background: phase === 'recording'
                    ? `hsl(${260 + i * 8}, 65%, ${50 + h * 20}%)`
                    : '#E5E7EB',
                }}
              />
            ))}
          </div>

          {/* Thinking dots */}
          {phase === 'thinking' && (
            <div className="flex items-center justify-center gap-1 mb-4">
              <div className="w-2 h-2 rounded-full bg-purple-400 typing-dot" />
              <div className="w-2 h-2 rounded-full bg-purple-400 typing-dot" />
              <div className="w-2 h-2 rounded-full bg-purple-400 typing-dot" />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* ── Buttons — one shown at a time ── */}

          {phase === 'idle' && turns.length === 0 && (
            <button
              onClick={handleStart}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white
                         transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--cue-purple)' }}
            >
              Start test
            </button>
          )}

          {phase === 'user_turn' && (
            <button
              onClick={handleRecord}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white
                         bg-emerald-600 hover:bg-emerald-700 transition-all
                         active:scale-[0.98]"
            >
              ⏺ Record response
            </button>
          )}

          {phase === 'recording' && (
            <button
              onClick={handleStop}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white
                         bg-red-500 hover:bg-red-600 transition-all
                         active:scale-[0.98]"
            >
              ⏹ Stop &amp; send
            </button>
          )}

          {(phase === 'transcribing' || phase === 'thinking' || phase === 'priya_speaking') && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-4 h-4 rounded-full border-2 border-gray-200
                              border-t-purple-500 animate-spin" />
              <span className="text-sm text-gray-500">{phaseLabel}</span>
            </div>
          )}

          {/* Reset after error */}
          {phase === 'error' && (
            <button
              onClick={() => { setPhase('idle'); setTurns([]); setError(''); sessionId.current = '' }}
              className="w-full py-3 rounded-xl font-semibold text-sm border
                         border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Start over
            </button>
          )}
        </div>

        {/* Transcript panel */}
        {turns.length > 0 && (
          <div
            ref={transcriptScrollRef}
            className="bg-white rounded-2xl border border-gray-200 p-5
                       max-h-72 overflow-y-auto"
          >
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
              Transcript
            </p>
            <div className="space-y-3">
              {turns.map((turn, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${turn.role === 'you' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center
                                justify-center text-xs font-semibold"
                    style={turn.role === 'priya'
                      ? { background: 'var(--cue-purple)', color: 'white' }
                      : { background: '#F3F4F6', color: '#374151' }
                    }
                  >
                    {turn.role === 'priya' ? 'P' : 'Y'}
                  </div>
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                    style={turn.role === 'priya'
                      ? { background: '#F9FAFB', color: '#374151' }
                      : { background: 'var(--cue-purple-light)', color: '#1F2937' }
                    }
                  >
                    {turn.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}