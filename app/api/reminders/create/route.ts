import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { sendReminderEmail } from '@/lib/email'
import type { Application } from '@/types'
import { normalizeReminderInput, readJsonObject } from '@/lib/api-validation'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const body = await readJsonObject(req)
  if (body.error) return body.error

  const normalized = normalizeReminderInput(body.data)
  if (normalized.error) return normalized.error

  let application: Application | undefined
  if (normalized.data.application_id) {
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', normalized.data.application_id)
      .eq('user_id', user.id)
      .single()

    if (appError || !app) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    }
    application = app as Application
  }

  const { data: reminder, error } = await supabase
    .from('reminders')
    .insert({ ...normalized.data, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('email_digest')
    .eq('id', user.id)
    .single()

  if (profileError) console.error('[reminders/create] Profile lookup failed:', profileError)

  const emailDigest = profile?.email_digest ?? 'daily'
  if (emailDigest !== 'never' && user.email) {
    sendReminderEmail({
      to: user.email,
      reminder,
      application,
    })?.catch((err) => {
      console.error('[reminders/create] Email send failed:', err)
    })
  }

  return NextResponse.json(reminder)
}
