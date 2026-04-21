'use client'

import { useRef, useState, useCallback } from 'react'

export type MicState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'stopping'
  | 'error'

interface UseMicrophoneReturn {
  micState:    MicState
  startRecording: () => Promise<void>
  stopRecording:  () => Promise<Blob | null>
  errorMessage:   string | null
}

const SILENCE_TIMEOUT_MS = 30_000   // auto-stop after 30s of no stop signal
const MIME_TYPE = 'audio/webm;codecs=opus'  // best browser support

export function useMicrophone(): UseMicrophoneReturn {
  const [micState, setMicState]       = useState<MicState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const streamRef        = useRef<MediaStream | null>(null)
  const silenceTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resolveRef       = useRef<((blob: Blob | null) => void) | null>(null)

  const cleanup = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [])

  const startRecording = useCallback(async () => {
    setErrorMessage(null)
    setMicState('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate:       16000,  // 16kHz is optimal for Sarvam
        },
      })

      streamRef.current = stream

      // Check which MIME type the browser supports
      const mimeType = MediaRecorder.isTypeSupported(MIME_TYPE)
        ? MIME_TYPE
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.start(250)  // collect chunks every 250ms
      setMicState('recording')

      // Safety: auto-stop after SILENCE_TIMEOUT_MS
      silenceTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording()
        }
      }, SILENCE_TIMEOUT_MS)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied'
      setErrorMessage(msg)
      setMicState('error')
      cleanup()
    }
  }, [cleanup]) // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current

      if (!recorder || recorder.state === 'inactive') {
        cleanup()
        setMicState('idle')
        resolve(null)
        return
      }

      resolveRef.current = resolve
      setMicState('stopping')

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        cleanup()
        setMicState('idle')
        resolve(blob.size > 0 ? blob : null)
      }

      recorder.stop()
    })
  }, [cleanup])

  return { micState, startRecording, stopRecording, errorMessage }
}