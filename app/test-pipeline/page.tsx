'use client'

import { useState, useRef, useEffect } from 'react'
import { useMicrophone } from '@/hooks/useMicrophone'
import { useWaveform }   from '@/hooks/useWaveform'

type Step =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'done'
  | 'error'

export default function TestPipelinePage() {
  const [step, setStep]             = useState<Step>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError]           = useState('')
  const [latency, setLatency]       = useState<number | null>(null)

  const { micState, startRecording, stopRecording } = useMicrophone()
  const { barHeights, attachStream, detach }        = useWaveform()

  // Track whether we have an active stream for waveform
  const streamRef = useRef<MediaStream | null>(null)

  // Wire waveform to mic stream while recording
  useEffect(() => {
    if (micState === 'recording') {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          streamRef.current = stream
          attachStream(stream)
        })
        .catch(() => {})
    } else {
      detach()
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [micState, attachStream, detach])

  async function handleStartStop() {
    if (step === 'idle') {
      setTranscript('')
      setError('')
      setLatency(null)
      setStep('recording')
      await startRecording()
    } else if (step === 'recording') {
      setStep('transcribing')
      const t0   = performance.now()
      const blob = await stopRecording()

      if (!blob) {
        setError('No audio captured — try speaking louder.')
        setStep('error')
        return
      }

      try {
        const formData = new FormData()
        formData.append('audio', blob, 'recording.webm')

        const res  = await fetch('/api/transcribe', {
          method: 'POST',
          body:   formData,
        })
        const data = await res.json()

        const elapsed = Math.round(performance.now() - t0)
        setLatency(elapsed)

        if (data.transcript) {
          setTranscript(data.transcript)
          setStep('done')
        } else {
          setError(data.error || 'Empty transcript returned.')
          setStep('error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error')
        setStep('error')
      }
    }
  }

  function reset() {
    setStep('idle')
    setTranscript('')
    setError('')
    setLatency(null)
  }

  const isRecording    = step === 'recording'
  const isTranscribing = step === 'transcribing'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-8">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                          text-xs font-medium mb-3 bg-amber-50 text-amber-700 border border-amber-200">
            Day 2 — Pipeline test
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            STT Pipeline Tester
          </h1>
          <p className="text-sm text-gray-500">
            Press record, speak for 5–10 seconds, press stop.
            Your words should appear below within ~2 seconds.
          </p>
        </div>

        {/* Waveform */}
        <div className="flex items-center justify-center gap-1.5 h-16 mb-6">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="w-2 rounded-full transition-all duration-75"
              style={{
                height:     `${Math.max(8, h * 56)}px`,
                background: isRecording
                  ? `hsl(${260 + i * 10}, 70%, ${50 + h * 20}%)`
                  : '#E5E7EB',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Status label */}
        <div className="text-center mb-6">
          <span className={`text-sm font-medium ${
            isRecording    ? 'text-red-600' :
            isTranscribing ? 'text-amber-600' :
            step === 'done' ? 'text-emerald-600' :
            step === 'error' ? 'text-red-600' :
            'text-gray-400'
          }`}>
            {isRecording    ? '● Recording — speak now' :
             isTranscribing ? '◌ Sending to Sarvam...' :
             step === 'done'  ? '✓ Transcription complete' :
             step === 'error' ? '✗ Error' :
             'Ready to record'}
          </span>
          {latency && (
            <span className="ml-3 text-xs text-gray-400 font-mono">
              {latency}ms
            </span>
          )}
        </div>

        {/* Record / Stop button */}
        {(step === 'idle' || step === 'recording') && (
          <button
            onClick={handleStartStop}
            disabled={isTranscribing}
            className={`w-full py-4 rounded-xl font-semibold text-sm transition-all
                        active:scale-[0.98] ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'text-white hover:opacity-90'
            }`}
            style={!isRecording ? { background: 'var(--cue-purple)' } : {}}
          >
            {isRecording ? '⏹ Stop recording' : '⏺ Start recording'}
          </button>
        )}

        {/* Transcribing spinner */}
        {isTranscribing && (
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200
                            border-t-purple-500 animate-spin" />
            <span className="text-sm text-gray-500">
              Transcribing with Sarvam Saarika...
            </span>
          </div>
        )}

        {/* Transcript result */}
        {transcript && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Transcript
            </p>
            <p className="text-gray-800 leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Reset */}
        {(step === 'done' || step === 'error') && (
          <button
            onClick={reset}
            className="w-full mt-3 py-2.5 rounded-xl border border-gray-200
                       text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Test again
          </button>
        )}

        {/* Debug info */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-mono">
            micState: {micState} · step: {step}
          </p>
        </div>
      </div>
    </div>
  )
}