import { NextRequest, NextResponse } from 'next/server'
import { getGroqClient, hasGroqKey, MODEL } from '@/lib/groq'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  if (!hasGroqKey()) {
    return NextResponse.json({ connected: false, reason: 'No API key' }, { status: 503 })
  }

  try {
    const groq = getGroqClient()
    await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    })
    return NextResponse.json({ connected: true, model: MODEL })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ai/status] Groq status check failed:', msg)
    return NextResponse.json({ connected: false, reason: 'AI service unavailable' }, { status: 503 })
  }
}
