'use client'

import { useState, useRef, useCallback } from 'react'

export type PlayerState = 'idle' | 'loading' | 'playing' | 'error'

interface UseAudioPlayerOptions {
  onPlaybackEnd?: () => void
}

interface UseAudioPlayerReturn {
  playerState:       PlayerState
  playAudioFromBlob: (blob: Blob) => Promise<void>
  playTTS:           (text: string) => Promise<void>
  stop:              () => void
}

export function useAudioPlayer(
  options: UseAudioPlayerOptions = {}
): UseAudioPlayerReturn {
  const [playerState, setPlayerState] = useState<PlayerState>('idle')
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef   = useRef<string | null>(null)
  const isPlayingRef   = useRef(false)   // ← guard against double calls
  const { onPlaybackEnd } = options

  const stop = useCallback(() => {
    isPlayingRef.current = false
    if (audioRef.current) {
      audioRef.current.onended = null   // ← remove handler before stopping
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setPlayerState('idle')
  }, [])

  const playAudioFromBlob = useCallback(async (blob: Blob): Promise<void> => {
    // Guard — if already playing, stop first and wait a tick
    if (isPlayingRef.current) {
      stop()
      await new Promise(r => setTimeout(r, 50))
    }

    return new Promise((resolve, reject) => {
      isPlayingRef.current = true
      setPlayerState('loading')

      try {
        const url            = URL.createObjectURL(blob)
        objectUrlRef.current = url

        const audio      = new Audio(url)
        audioRef.current = audio

        audio.oncanplaythrough = () => {
          setPlayerState('playing')
          audio.play().catch(reject)
        }

        audio.onended = () => {
          isPlayingRef.current = false
          URL.revokeObjectURL(url)
          objectUrlRef.current = null
          audioRef.current     = null
          setPlayerState('idle')
          onPlaybackEnd?.()
          resolve()
        }

        audio.onerror = () => {
          isPlayingRef.current = false
          setPlayerState('error')
          reject(new Error('Audio playback failed'))
        }

      } catch (err) {
        isPlayingRef.current = false
        setPlayerState('error')
        reject(err)
      }
    })
  }, [stop, onPlaybackEnd])

  const playTTS = useCallback(async (text: string): Promise<void> => {
    // Guard — don't start TTS if already playing something
    if (isPlayingRef.current) {
      console.warn('[useAudioPlayer] playTTS called while already playing — ignored')
      return
    }

    setPlayerState('loading')
    try {
      const res = await fetch('/api/speak', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'TTS request failed')
      }
      const blob = await res.blob()
      await playAudioFromBlob(blob)
    } catch (err) {
      isPlayingRef.current = false
      setPlayerState('error')
      throw err
    }
  }, [playAudioFromBlob])

  return { playerState, playAudioFromBlob, playTTS, stop }
}