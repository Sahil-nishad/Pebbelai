import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, hasGroqKey, hasGeminiKey } from '@/lib/groq'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const provider = hasGeminiKey() ? 'gemini' : hasGroqKey() ? 'groq' : null

  if (!provider) {
    return NextResponse.json({ connected: false, reason: 'No API key configured' }, { status: 503 })
  }

  try {
    await chatCompletion([{ role: 'user', content: 'ping' }], { maxTokens: 1 })
    return NextResponse.json({ connected: true, provider })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ai/status] AI status check failed:', msg)
    return NextResponse.json({ connected: false, reason: 'AI service unavailable' }, { status: 503 })
  }
}
