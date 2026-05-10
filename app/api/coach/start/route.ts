import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { getGroqClient, hasGroqKey, MODEL } from '@/lib/groq'
import { createCoachSession } from '@/lib/coach-session-store'
import { isMissingTableError } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  let reqBody: { company?: unknown; role?: unknown; sessionType?: unknown; jobDescription?: unknown }
  try { reqBody = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }
  const { company: rawCompany, role: rawRole, sessionType: rawSessionType, jobDescription: rawJobDescription } = reqBody

  // Sanitize user-controlled strings before injecting into LLM prompts
  const sanitize = (s: unknown, max: number) =>
    String(s ?? '').replace(/[`<>]/g, '').trim().slice(0, max)

  const company = sanitize(rawCompany, 100)
  const role = sanitize(rawRole, 100)
  const sessionType = sanitize(rawSessionType, 50)
  const jobDescription = rawJobDescription ? sanitize(rawJobDescription, 1000) : ''

  let questions: unknown[] = []
  try {
    if (!hasGroqKey()) throw new Error('AI service is not configured.')
    const groq = getGroqClient()
    const questionsResponse = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `Generate 10 interview questions for ${role} at ${company}. Session type: ${sessionType}. ${jobDescription ? `Job description: ${jobDescription.slice(0, 500)}` : ''}. Return ONLY valid JSON array: [{"q":"question","category":"behavioral","difficulty":"medium","tip":"what interviewer looks for"}]`,
        },
      ],
      temperature: 0.7,
    })

    questions = JSON.parse(questionsResponse.choices[0].message.content || '[]')
  } catch {
    questions = [
      {
        q: 'Tell me about yourself and why you are interested in this role.',
        category: sessionType,
        difficulty: 'easy',
        tip: 'Be concise and relevant',
      },
    ]
  }

  const systemMessage = {
    role: 'system' as const,
    content: `You are an expert interview coach. The user is preparing for:
- Company: ${company}
- Role: ${role}
- Interview type: ${sessionType}
${jobDescription ? `- Job description: ${jobDescription.slice(0, 1000)}` : ''}

Behavior rules:
1. Ask ONE interview question at a time.
2. When the user answers, respond in concise bullet points only.
3. Always include these sections when helpful:
   - Best answer: the strongest answer the user could give
   - What worked: 2-3 bullets
   - Improve: 2-3 bullets
   - Next step: one concrete action
4. Tailor the best answer to the company, role, interview type, and the user's actual answer.
5. Prefer specific, practical, high-signal guidance over generic advice.
6. Rewrite weak answers into stronger sample answers when needed.
7. Be encouraging, but do not be vague.
8. If the user asks for a sample answer, write it as bullets and keep it short.

Start by briefly introducing yourself, then ask the first question in a friendly, focused way.`,
  }

  const { data: session, error } = await supabase
    .from('coach_sessions')
    .insert({
      user_id: user.id,
      company,
      role,
      session_type: sessionType,
      messages: [systemMessage],
    })
    .select()
    .single()

  let assistantMessage = `- Best answer: Tell me about yourself and why you want this ${role} role.
- What worked: I will keep feedback short, specific, and in bullet points.
- Next step: Answer in 3 to 5 sentences, then I will help sharpen it.`

  try {
    if (!hasGroqKey()) throw new Error('AI service is not configured.')
    const groq = getGroqClient()
    const intro = await groq.chat.completions.create({
      model: MODEL,
      messages: [systemMessage as { role: 'system'; content: string }],
      temperature: 0.4,
    })
    assistantMessage = intro.choices[0].message.content || assistantMessage
  } catch {
    // Keep the session usable even if the model call blips.
  }

  if (error) {
    if (!isMissingTableError(error, 'coach_sessions')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    const fallbackSession = createCoachSession({
      user_id: user.id,
      company,
      role,
      session_type: sessionType,
      messages: [systemMessage, { role: 'assistant' as const, content: assistantMessage }],
      question_count: 0,
      avg_score: null,
    })
    return NextResponse.json({ session: fallbackSession, questions, introMessage: assistantMessage })
  }

  const { error: updateError } = await supabase
    .from('coach_sessions')
    .update({
      messages: [systemMessage, { role: 'assistant' as const, content: assistantMessage }],
    })
    .eq('id', session.id)

  if (updateError) {
    console.error('[coach/start] Failed to persist intro message:', updateError)
    return NextResponse.json({ error: 'Failed to start coach session. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ session, questions, introMessage: assistantMessage })
}
