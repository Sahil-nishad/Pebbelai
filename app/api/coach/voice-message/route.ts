import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { chatCompletion, hasGroqKey, hasGeminiKey } from '@/lib/groq'
import { getCoachSession, updateCoachSession } from '@/lib/coach-session-store'
import { isMissingTableError } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  let reqBody: { sessionId?: string; message?: unknown }
  try { reqBody = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }
  const { sessionId = '', message: rawMessage } = reqBody
  const message = String(rawMessage ?? '').trim().slice(0, 2000)

  const { data: session, error } = await supabase
    .from('coach_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  const fallbackSession = getCoachSession(sessionId, user.id)
  const activeSession = session || fallbackSession
  if (!activeSession) {
    if (error && !isMissingTableError(error, 'coach_sessions')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const allMessages = [...(activeSession.messages || []), { role: 'user', content: message }]
  const systemMsg = allMessages.find(m => m.role === 'system')
  const chatHistory = allMessages.filter(m => m.role !== 'system').slice(-12)

  // Voice-optimized system prompt: short, conversational, no bullet points
  const voiceSystemPrompt = `You are a voice-based interview coach having a spoken conversation. You are warm, encouraging, and CONCISE.

CRITICAL RULES FOR VOICE:
1. Keep responses to 2-3 SHORT sentences maximum. This is a spoken conversation, not a written one.
2. NEVER use bullet points, dashes, asterisks, or formatting. Speak naturally.
3. Ask ONE follow-up question or give ONE piece of feedback, then stop.
4. Sound like a real human coach talking — use contractions, casual phrasing.
5. After the user answers, give brief feedback then immediately ask the next question.
6. If the answer was good, say so in one sentence then move on.
7. If the answer needs work, give ONE specific tip then ask them to try again or move to next question.

Context: ${activeSession.company || 'a company'}, ${activeSession.role || 'a role'}, ${activeSession.session_type || 'general'} interview.

Example good response: "That's a solid answer — you clearly showed impact with numbers. Let me throw you a tougher one. Tell me about a time you disagreed with your manager. How did you handle it?"

Example bad response (TOO LONG): "Great answer! Here are some things that worked well: 1. You used the STAR method 2. You quantified your impact..." — NEVER do this in voice mode.`

  const messages_for_llm = systemMsg
    ? [{ role: 'system' as const, content: voiceSystemPrompt }, ...chatHistory]
    : [{ role: 'system' as const, content: voiceSystemPrompt }, ...chatHistory]

  let assistantMessage = "Sorry, I'm having a moment. Could you repeat that?"

  try {
    if (!hasGroqKey() && !hasGeminiKey()) throw new Error('AI service is not configured.')
    assistantMessage = await chatCompletion(
      messages_for_llm,
      { temperature: 0.5, maxTokens: 150 }
    ) || assistantMessage
  } catch {
    // Keep fallback
  }

  const updatedMessages = [...allMessages, { role: 'assistant', content: assistantMessage }]

  if (session) {
    await supabase
      .from('coach_sessions')
      .update({ messages: updatedMessages, question_count: (session.question_count || 0) + 1 })
      .eq('id', sessionId)
  } else {
    updateCoachSession(sessionId, user.id, {
      messages: updatedMessages,
      question_count: (activeSession.question_count || 0) + 1,
    })
  }

  return NextResponse.json({ message: assistantMessage })
}
