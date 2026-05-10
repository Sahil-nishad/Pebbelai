import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { getGmailOAuthTokens } from '@/lib/gmail-oauth'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = auth.user.id

  if (!code) {
    return NextResponse.redirect(new URL('/careers/settings?error=no_code', req.url))
  }

  try {
    const tokens = await getGmailOAuthTokens(code)

    // Create Gmail connection on backend
    const response = await fetch(`${BACKEND_URL}/careers/gmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
      },
      body: JSON.stringify({
        email: tokens.email,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        expires_in: tokens.expires_in,
        scopes: tokens.scopes,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to create Gmail connection:', error)
      return NextResponse.redirect(new URL('/careers/settings?error=connection_failed', req.url))
    }

    return NextResponse.redirect(new URL('/careers/settings?connected=1', req.url))
  } catch (error) {
    console.error('Gmail OAuth callback error:', error)
    return NextResponse.redirect(new URL('/careers/settings?error=oauth_failed', req.url))
  }
}