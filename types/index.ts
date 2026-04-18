export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'
export type MessageRole   = 'interviewer' | 'candidate'
export type Recommendation = 'Advance' | 'Hold' | 'Reject'

export interface Session {
  id:               string
  candidate_name:   string
  candidate_email:  string
  started_at:       string
  completed_at:     string | null
  status:           SessionStatus
  duration_seconds: number | null
  created_at:       string
}

export interface Message {
  id:         string
  session_id: string
  role:       MessageRole
  content:    string
  created_at: string
}


export interface RubricDimension {
  score:    number     // 1–5
  max:      number     // always 5
  evidence: string[]   // direct quotes from candidate
  notes:    string
}

export interface AssessmentRubric {
  dimensions: {
    communication_clarity: RubricDimension
    warmth_and_patience:   RubricDimension
    ability_to_simplify:   RubricDimension
    english_fluency:       RubricDimension
    adaptability:          RubricDimension
  }
  overall_recommendation: Recommendation
  overall_score:          number
  summary:                string
  red_flags:              string[]
  standout_moments:       string[]
}

export interface Assessment {
  id:                     string
  session_id:             string
  rubric:                 AssessmentRubric
  overall_recommendation: Recommendation
  overall_score:          number
  created_at:             string
}

export interface SessionSummary {
  id:                     string
  candidate_name:         string
  candidate_email:        string
  status:                 SessionStatus
  started_at:             string
  completed_at:           string | null
  duration_seconds:       number | null
  overall_recommendation: Recommendation | null
  overall_score:          number | null
  candidate_turns:        number
}


export type InterviewPhase =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'ai_thinking'
  | 'ai_speaking'
  | 'complete'
  | 'error'

export interface ConversationMessage {
  role:    MessageRole
  content: string
}