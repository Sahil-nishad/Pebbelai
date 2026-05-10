import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { normalizeNotificationSettings, readJsonObject } from '@/lib/api-validation'

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const body = await readJsonObject(req)
  if (body.error) return body.error

  const settings = normalizeNotificationSettings(body.data)
  if (settings.error) return settings.error

  const { error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      ...settings.data,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
