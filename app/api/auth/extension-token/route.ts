import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Returns the raw NextAuth JWT so the Chrome extension can use it as a Bearer token.
// Only accessible to authenticated users (token is validated before returning).
export async function GET(req: NextRequest) {
  let decoded
  try {
    decoded = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET!,
      secureCookie: process.env.NODE_ENV === 'production',
    })
  } catch (err) {
    console.error('[extension-token] Token decode failed:', err)
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  if (!decoded?.dbId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let raw
  try {
    raw = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET!,
      raw: true,
      secureCookie: process.env.NODE_ENV === 'production',
    })
  } catch (err) {
    console.error('[extension-token] Raw token read failed:', err)
    return NextResponse.json({ error: 'Token unavailable' }, { status: 401 })
  }
  if (!raw) {
    return NextResponse.json({ error: 'Token unavailable' }, { status: 401 })
  }

  return NextResponse.json({ token: raw }, {
    headers: {
      // Don't cache — token changes on session refresh
      'Cache-Control': 'no-store',
    },
  })
}
