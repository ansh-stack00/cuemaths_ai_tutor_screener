import { createServerClient } from './server'
import type {
  Session, Message, Assessment,
  AssessmentRubric, MessageRole, SessionSummary,
} from '@/types'



export async function createSession(
  candidateName:  string,
  candidateEmail: string
): Promise<Session> {
  const db = createServerClient()
  const { data, error } = await db
    .from('sessions')
    .insert({ candidate_name: candidateName, candidate_email: candidateEmail })
    .select()
    .single()
  if (error) throw new Error(`createSession: ${error.message}`)
  return data
}

export async function completeSession(
  sessionId:       string,
  durationSeconds: number
): Promise<void> {
  const db = createServerClient()
  const { error } = await db
    .from('sessions')
    .update({
      status:           'completed',
      completed_at:     new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq('id', sessionId)
  if (error) throw new Error(`completeSession: ${error.message}`)
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const db = createServerClient()
  const { data } = await db
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  return data
}

export async function getAllSessions(): Promise<SessionSummary[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from('session_summary')
    .select('*')
    .order('started_at', { ascending: false })
  if (error) throw new Error(`getAllSessions: ${error.message}`)
  return data || []
}



export async function saveMessage(
  sessionId: string,
  role:      MessageRole,
  content:   string
): Promise<Message> {
  const db = createServerClient()
  const { data, error } = await db
    .from('messages')
    .insert({ session_id: sessionId, role, content })
    .select()
    .single()
  if (error) throw new Error(`saveMessage: ${error.message}`)
  return data
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`getMessages: ${error.message}`)
  return data || []
}



export async function saveAssessment(
  sessionId: string,
  rubric:    AssessmentRubric
): Promise<Assessment> {
  const db = createServerClient()
  const { data, error } = await db
    .from('assessments')
    .insert({
      session_id:             sessionId,
      rubric,
      overall_recommendation: rubric.overall_recommendation,
      overall_score:          rubric.overall_score,
    })
    .select()
    .single()
  if (error) throw new Error(`saveAssessment: ${error.message}`)
  return data
}

export async function getAssessment(sessionId: string): Promise<Assessment | null> {
  const db = createServerClient()
  const { data } = await db
    .from('assessments')
    .select('*')
    .eq('session_id', sessionId)
    .single()
  return data
}