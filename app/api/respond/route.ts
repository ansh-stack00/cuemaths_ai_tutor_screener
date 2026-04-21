import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { INTERVIEWER_SYSTEM_PROMPT } from '@/lib/openai/prompts/prompts'
import { saveMessage } from '@/lib/supabase/helper'

const openai = new OpenAI(
    { 
    apiKey: process.env.GROQ_API_KEY , 
    baseURL: "https://api.groq.com/openai/v1"
 })



export async function POST(req: NextRequest) {
  try {
    const { sessionId, messages, newMessage } = await req.json()

    if (!sessionId || !newMessage) {
        console.log('[respond] Missing sessionId or newMessage:', { sessionId, newMessage })
      return NextResponse.json(
        { error: 'sessionId and newMessage required' },
        { status: 400 }
      )
    }

    // Save candidate turn to DB
    await saveMessage(sessionId, 'candidate', newMessage)

    // Build history 
     const history = [
      { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
      ...(messages ?? []).map((m: { role: string; content: string }) => ({
        role: m.role === 'interviewer' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: newMessage },
    ]

     const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Groq fast model for chat
      messages: history,
      max_tokens: 300,
      temperature: 0.7,
    })

    const rawReply =
      response.choices?.[0]?.message?.content?.trim() ?? ''

    const isComplete = rawReply.startsWith('[INTERVIEW_COMPLETE]')
    const reply      = rawReply.replace('[INTERVIEW_COMPLETE]', '').trim()

    // Save Priya's reply to DB
    await saveMessage(sessionId, 'interviewer', reply)

    return NextResponse.json({ reply, isComplete })
  } catch (error) {
    console.error('[respond]', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}