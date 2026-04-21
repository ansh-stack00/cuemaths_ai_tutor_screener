'use client'

import { useReducer, useRef, useCallback } from 'react'
import type { InterviewPhase, ConversationMessage } from '@/types'

// ── State ─────────────────────────────────────────────────
interface InterviewState {
  phase:        InterviewPhase
  messages:     ConversationMessage[]   // full conversation history
  errorMessage: string | null
  isComplete:   boolean
  startTime:    number | null
}

// ── Actions ───────────────────────────────────────────────
type Action =
  | { type: 'START';            startTime: number }
  | { type: 'BEGIN_RECORDING' }
  | { type: 'BEGIN_TRANSCRIBING' }
  | { type: 'BEGIN_THINKING' }
  | { type: 'BEGIN_SPEAKING' }
  | { type: 'ADD_MESSAGE';      message: ConversationMessage }
  | { type: 'INTERVIEW_COMPLETE' }
  | { type: 'SET_ERROR';        message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_TO_USER_TURN' }

const initialState: InterviewState = {
  phase:        'idle',
  messages:     [],
  errorMessage: null,
  isComplete:   false,
  startTime:    null,
}

function reducer(state: InterviewState, action: Action): InterviewState {
  switch (action.type) {
    case 'START':
      return { ...state, phase: 'ai_speaking', startTime: action.startTime }
    case 'BEGIN_RECORDING':
      return { ...state, phase: 'recording', errorMessage: null }
    case 'BEGIN_TRANSCRIBING':
      return { ...state, phase: 'transcribing' }
    case 'BEGIN_THINKING':
      return { ...state, phase: 'ai_thinking' }
    case 'BEGIN_SPEAKING':
      return { ...state, phase: 'ai_speaking' }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }
    case 'INTERVIEW_COMPLETE':
      return { ...state, isComplete: true }
    case 'SET_ERROR':
      return { ...state, phase: 'error', errorMessage: action.message }
    case 'CLEAR_ERROR':
      return { ...state, errorMessage: null }
    case 'RESET_TO_USER_TURN':
      return { ...state, phase: 'recording', errorMessage: null }
    default:
      return state
  }
}

// ── Hook ──────────────────────────────────────────────────
export function useInterviewMachine() {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Non-reactive refs for values used in async callbacks
  const messagesRef   = useRef<ConversationMessage[]>([])
  const isCompleteRef = useRef(false)

  const addMessage = useCallback((message: ConversationMessage) => {
    messagesRef.current = [...messagesRef.current, message]
    dispatch({ type: 'ADD_MESSAGE', message })
  }, [])

  const setComplete = useCallback(() => {
    isCompleteRef.current = true
    dispatch({ type: 'INTERVIEW_COMPLETE' })
  }, [])

  return {
    state,
    dispatch,
    messagesRef,
    isCompleteRef,
    addMessage,
    setComplete,
  }
}