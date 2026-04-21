'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

const BAR_COUNT = 5

interface UseWaveformReturn {
  barHeights:   number[]   // values 0–1 for each bar
  attachStream: (stream: MediaStream) => void
  detach:       () => void
}

export function useWaveform(): UseWaveformReturn {
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(BAR_COUNT).fill(0.15)
  )

  const audioCtxRef   = useRef<AudioContext | null>(null)
  const analyserRef   = useRef<AnalyserNode | null>(null)
  const sourceRef     = useRef<MediaStreamAudioSourceNode | null>(null)
  const animFrameRef  = useRef<number | null>(null)

  const detach = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    sourceRef.current?.disconnect()
    analyserRef.current?.disconnect()
    audioCtxRef.current?.close()
    audioCtxRef.current  = null
    analyserRef.current  = null
    sourceRef.current    = null
    setBarHeights(Array(BAR_COUNT).fill(0.15))
  }, [])

  const attachStream = useCallback((stream: MediaStream) => {
    detach()

    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize        = 64
    analyser.smoothingTimeConstant = 0.7

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    audioCtxRef.current  = audioCtx
    analyserRef.current  = analyser
    sourceRef.current    = source

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(dataArray)

      // Map frequency bins to BAR_COUNT bars with slight variation
      const heights = Array.from({ length: BAR_COUNT }, (_, i) => {
        const binIndex = Math.floor((i / BAR_COUNT) * dataArray.length * 0.6)
        const raw = dataArray[binIndex] / 255
        // Add subtle random wobble so silent bars don't look frozen
        const wobble = 0.05 * Math.sin(Date.now() / 200 + i)
        return Math.max(0.1, Math.min(1, raw + wobble))
      })

      setBarHeights(heights)
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
  }, [detach])

  // Cleanup on unmount
  useEffect(() => () => { detach() }, [detach])

  return { barHeights, attachStream, detach }
}