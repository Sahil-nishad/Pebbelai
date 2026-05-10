import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  let body: { currentPassword?: string; newPassword?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }

  const { currentPassword, newPassword } = body

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  if (userData.password_hash) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required.' }, { status: 400 })
    }
    const valid = await bcrypt.compare(currentPassword, userData.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    }
  }

  const password_hash = await bcrypt.hash(newPassword, 12)
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
