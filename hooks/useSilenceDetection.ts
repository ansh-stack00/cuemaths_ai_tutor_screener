'use client'

import { useRef, useCallback } from 'react'

interface SilenceDetectionOptions {
  onSilence:          () => void
  silenceThresholdMs: number
  maxRecordingMs:     number
  minSpeechMs:        number
  amplitudeThreshold: number
}

export function useSilenceDetection() {
  const audioCtxRef     = useRef<AudioContext | null>(null)
  const analyserRef     = useRef<AnalyserNode | null>(null)
  const sourceRef       = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafRef          = useRef<number | null>(null)
  const maxTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Silence tracking
  const silenceStartRef  = useRef<number | null>(null)  // when current silence began
  const firedRef         = useRef(false)

  // Speech tracking — accumulated total, not since-start
  const totalSpeechMsRef    = useRef(0)
  const speechSegmentStart  = useRef<number | null>(null)  // start of current speech segment
  const wasSpekingRef       = useRef(false)

  const stop = useCallback(() => {
    if (rafRef.current)      cancelAnimationFrame(rafRef.current)
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
    sourceRef.current?.disconnect()
    analyserRef.current?.disconnect()
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current      = null
    analyserRef.current      = null
    sourceRef.current        = null
    rafRef.current           = null
    maxTimerRef.current      = null
    silenceStartRef.current  = null
    speechSegmentStart.current = null
    totalSpeechMsRef.current = 0
    wasSpekingRef.current    = false
    firedRef.current         = false
  }, [])

  const start = useCallback((
    stream:  MediaStream,
    options: SilenceDetectionOptions
  ) => {
    stop()

    const {
      silenceThresholdMs = 3000,
      maxRecordingMs     = 20000,
      minSpeechMs        = 800,
      amplitudeThreshold = 30,
    } = options

    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize               = 512
    analyser.smoothingTimeConstant = 0.4

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    audioCtxRef.current = audioCtx
    analyserRef.current = analyser
    sourceRef.current   = source

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    function fire() {
      if (firedRef.current) return
      firedRef.current = true
      stop()
      options.onSilence()
    }

    // Hard cutoff
    maxTimerRef.current = setTimeout(fire, maxRecordingMs)

    const tick = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)

      // RMS amplitude across all bins
      const sum        = dataArray.reduce((a, b) => a + b * b, 0)
      const rms        = Math.sqrt(sum / dataArray.length)
      const isSpeaking = rms > amplitudeThreshold
      const now        = Date.now()

      if (isSpeaking) {
        // ── Candidate is speaking ──
        silenceStartRef.current = null   // reset silence timer

        if (!wasSpekingRef.current) {
          // Speech segment just started
          wasSpekingRef.current      = true
          speechSegmentStart.current = now
        }
      } else {
        // ── Silence ──
        if (wasSpekingRef.current) {
          // Speech segment just ended — accumulate it
          if (speechSegmentStart.current) {
            totalSpeechMsRef.current += now - speechSegmentStart.current
          }
          wasSpekingRef.current      = false
          speechSegmentStart.current = null
        }

        // Start silence timer on first silence frame
        if (!silenceStartRef.current) {
          silenceStartRef.current = now
        }

        const silenceDuration = now - silenceStartRef.current

        // Only fire if candidate actually spoke enough
        if (
          silenceDuration >= silenceThresholdMs &&
          totalSpeechMsRef.current >= minSpeechMs
        ) {
          fire()
          return
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [stop])

  // Returns 0–1 for the countdown ring
  // Resets to 0 when candidate is speaking
  const getSilenceProgress = useCallback((silenceThresholdMs: number): number => {
    // No silence started, or candidate is currently speaking → no progress
    if (!silenceStartRef.current) return 0
    // Haven't spoken enough yet → don't show countdown
    if (totalSpeechMsRef.current < 500) return 0

    const elapsed = Date.now() - silenceStartRef.current
    return Math.min(1, elapsed / silenceThresholdMs)
  }, [])

  return { start, stop, getSilenceProgress }
}