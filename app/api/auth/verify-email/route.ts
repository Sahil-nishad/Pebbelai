import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseServer } from '@/lib/supabase'
import { hashToken } from '@/lib/api-validation'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=InvalidVerificationLink', APP_URL))
  }

  const supabase = getSupabaseServer()
  const hashedToken = hashToken(token)

  const { data: record } = await supabase
    .from('email_verification_tokens')
    .select('user_id, expires_at')
    .eq('token', hashedToken)
    .maybeSingle()

  if (!record) {
    return NextResponse.redirect(new URL('/login?error=InvalidVerificationLink', APP_URL))
  }

  if (new Date(record.expires_at) < new Date()) {
    await supabase.from('email_verification_tokens').delete().eq('token', hashedToken)
    return NextResponse.redirect(new URL('/login?error=VerificationLinkExpired', APP_URL))
  }

  // Mark user as verified and remove the verification token
  await supabase.from('users').update({ email_verified: true }).eq('id', record.user_id)
  await supabase.from('email_verification_tokens').delete().eq('token', hashedToken)

  // Create a 10-minute one-time token so the user lands on the dashboard without re-entering credentials
  const ottRaw = crypto.randomBytes(32).toString('hex')
  const ottExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  await supabase.from('auto_login_tokens').insert({
    user_id: record.user_id,
    token: hashToken(ottRaw),
    expires_at: ottExpiry,
  })

  return NextResponse.redirect(new URL(`/login?ott=${ottRaw}`, APP_URL))
}
