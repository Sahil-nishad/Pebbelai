import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseServer } from '@/lib/supabase'
import { hashToken, readJsonObject } from '@/lib/api-validation'

async function claimResetToken(supabase: ReturnType<typeof getSupabaseServer>, token: string) {
  const now = new Date().toISOString()
  const tokenCandidates = [hashToken(token), token]

  for (const tokenValue of tokenCandidates) {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', tokenValue)
      .eq('used', false)
      .gt('expires_at', now)
      .select('user_id')
      .maybeSingle()

    if (error) return { error }
    if (data?.user_id) return { userId: data.user_id as string }
  }

  return { userId: null }
}

export async function POST(req: NextRequest) {
  const body = await readJsonObject(req)
  if (body.error) return body.error

  const token = typeof body.data.token === 'string' ? body.data.token.trim() : ''
  const password = typeof body.data.password === 'string' ? body.data.password : ''

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const supabase = getSupabaseServer()
  const claimed = await claimResetToken(supabase, token)

  if (claimed.error) {
    console.error('[reset-password] Failed to claim reset token:', claimed.error)
    return NextResponse.json({ error: 'Failed to reset password. Please try again.' }, { status: 500 })
  }

  if (!claimed.userId) {
    return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 12)
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash })
    .eq('id', claimed.userId)

  if (updateError) {
    console.error('[reset-password] Failed to update password:', updateError)
    return NextResponse.json({ error: 'Failed to reset password. Please request a new link.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
