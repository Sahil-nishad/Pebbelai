import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { chatCompletion, hasGroqKey, hasGeminiKey } from '@/lib/groq'
import { getClientIp, rateLimit, readJsonObject } from '@/lib/api-validation'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const body = await readJsonObject(req)
  if (body.error) return body.error

  if (!rateLimit(`coach-questions:${getClientIp(req)}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const { company: rawCompany, role: rawRole, sessionType: rawSessionType } = body.data

  const sanitize = (s: unknown, max: number) =>
    String(s ?? '').replace(/[`<>]/g, '').trim().slice(0, max)

  const company     = sanitize(rawCompany, 100)
  const role        = sanitize(rawRole, 100)
  const sessionType = sanitize(rawSessionType, 50)

  const prompt = `Generate exactly 10 interview questions with ideal answers for:
- Role: ${role || 'Software Engineer'}
- Company: ${company || 'a tech company'}
- Interview type: ${sessionType || 'general'}

Return ONLY a valid JSON array with no extra text:
[
  {
    "question": "Full interview question text",
    "answer": "Ideal 3-5 sentence answer that a strong candidate would give, specific and practical",
    "category": "${sessionType || 'general'}"
  }
]
Ensure exactly 10 items.`

  if (!hasGroqKey() && !hasGeminiKey()) {
    return NextResponse.json({ error: 'AI service is not configured.' }, { status: 503 })
  }

  try {
    const raw = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.6 }
    )
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    const parsed: { question: string; answer: string; category: string }[] = JSON.parse(jsonMatch ? jsonMatch[0] : raw)

    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid response')

    return NextResponse.json({ questions: parsed.slice(0, 10) })
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate questions. Please try again.' },
      { status: 500 }
    )
  }
}
