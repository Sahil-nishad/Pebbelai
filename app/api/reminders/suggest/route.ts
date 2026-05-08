import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { getGroqClient, hasGroqKey, MODEL } from '@/lib/groq'
import { getClientIp, rateLimit, readJsonObject } from '@/lib/api-validation'

const clean = (value: unknown, max = 120) =>
  String(value ?? '').replace(/[`<>]/g, '').trim().slice(0, max)

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  void auth

  const body = await readJsonObject(req)
  if (body.error) return body.error

  if (!rateLimit(`reminder-suggest:${getClientIp(req)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const company = clean(body.data.company)
  const role = clean(body.data.role)
  const appliedDate = clean(body.data.appliedDate, 40)

  let response
  try {
    if (!hasGroqKey()) {
      return NextResponse.json({ error: 'AI service is not configured.' }, { status: 503 })
    }
    const groq = getGroqClient()
    response = await groq.chat.completions.create({
      model: MODEL,
      messages: [{
        role: 'system',
        content: `User applied to ${company || 'a company'} for ${role || 'a role'} on ${appliedDate || 'an unknown date'}. Suggest follow-up schedule. Return ONLY valid JSON array: [{"type":"follow_up","days_from_now":5,"title":"Follow up with ${company || 'the company'}","description":"No response yet, send polite check-in"},{"type":"follow_up","days_from_now":10,"title":"Second follow up: ${company || 'the company'}"}]. Max 3 suggestions. Be realistic about hiring timelines.`,
      }],
      temperature: 0.5,
    })
  } catch (err) {
    console.error('[reminders/suggest] Groq API error:', err)
    return NextResponse.json({ error: 'AI service is temporarily unavailable.' }, { status: 503 })
  }

  let suggestions = []
  try {
    suggestions = JSON.parse(response.choices[0].message.content || '[]')
  } catch {
    suggestions = [
      { type: 'follow_up', days_from_now: 5, title: `Follow up with ${company}`, description: 'No response yet' },
      { type: 'follow_up', days_from_now: 10, title: `Second follow up: ${company}`, description: 'Still no response' },
    ]
  }

  return NextResponse.json(suggestions)
}
