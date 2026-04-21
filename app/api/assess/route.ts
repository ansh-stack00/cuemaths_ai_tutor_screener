import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildAssessmentPrompt } from '@/lib/openai/prompts/prompts'
import { saveAssessment, completeSession } from '@/lib/supabase/helper'
import type { AssessmentRubric } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
})

// Validate rubric shape so we never save malformed data
function validateRubric(rubric: unknown): rubric is AssessmentRubric {
  if (!rubric || typeof rubric !== 'object') return false
  const r = rubric as Record<string, any>

  const requiredDims = [
    'communication_clarity',
    'warmth_and_patience',
    'ability_to_simplify',
    'english_fluency',
    'adaptability',
  ]

  if (!r.dimensions || typeof r.dimensions !== 'object') return false
  const dims = r.dimensions as Record<string, any>

  for (const dim of requiredDims) {
    const d = dims[dim]
    if (!d) return false
    if (typeof d.score !== 'number') return false
    if (!Array.isArray(d.evidence)) return false
    if (typeof d.notes !== 'string') return false

    d.score = Math.min(5, Math.max(1, Math.round(d.score)))
    d.max = 5
  }

  if (!['Advance', 'Hold', 'Reject'].includes(r.overall_recommendation))
    return false
  if (typeof r.overall_score !== 'number') return false
  if (typeof r.summary !== 'string') return false
  if (!Array.isArray(r.red_flags)) r.red_flags = []
  if (!Array.isArray(r.standout_moments)) r.standout_moments = []

  return true
}

// Parse JSON robustly — strips markdown fences
function parseRubricJSON(raw: string): AssessmentRubric | null {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    return validateRubric(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, messages, durationSeconds } = await req.json()

    if (!sessionId || !messages?.length) {
      return NextResponse.json(
        { error: 'sessionId and messages required' },
        { status: 400 }
      )
    }

    const prompt = buildAssessmentPrompt(messages)

    let rubric: AssessmentRubric | null = null

    // Retry twice if model returns bad JSON
    for (let attempt = 1; attempt <= 2; attempt++) {
      const response = await openai.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.2, // deterministic JSON
      })

      const rawText =
        response.choices?.[0]?.message?.content ?? ''

      rubric = parseRubricJSON(rawText)

      if (rubric) break
    }

    if (!rubric) {
      return NextResponse.json(
        { error: 'Failed to generate valid rubric after 2 attempts' },
        { status: 500 }
      )
    }

    const [assessment] = await Promise.all([
      saveAssessment(sessionId, rubric),
      completeSession(sessionId, durationSeconds ?? 0),
    ])

    return NextResponse.json({ assessment: assessment.rubric })
  } catch (error) {
    console.error('[assess]', error)
    return NextResponse.json(
      { error: 'Assessment failed' },
      { status: 500 }
    )
  }
}
