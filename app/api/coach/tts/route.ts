import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  // If no Deepgram key, return empty — client will fall back to browser TTS
  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 })
  }

  let body: { text?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const text = String(body.text || '').trim().slice(0, 1000)
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  try {
    const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[TTS] Deepgram error:', response.status, err)
      return NextResponse.json({ error: 'TTS generation failed' }, { status: 502 })
    }

    // Stream the audio back
    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[TTS] Error:', err)
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 })
  }
}
