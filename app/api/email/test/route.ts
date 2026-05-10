/**
 * POST /api/email/test
 * Sends a test reminder email to the logged-in user.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { sendReminderEmail } from '@/lib/email'
import type { Reminder } from '@/types'
import { getClientIp, rateLimit } from '@/lib/api-validation'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user } = auth
  if (!user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!rateLimit(`email-test:${getClientIp(req)}:${user.id}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many test emails. Please try again later.' }, { status: 429 })
  }

  const fakeReminder: Reminder = {
    id: 'test-id',
    user_id: user.id,
    application_id: 'test-app-id',
    title: 'Follow up with recruiter',
    description: 'Check in on the status of your application and ask about next steps.',
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_done: false,
    reminder_type: 'follow_up',
    created_at: new Date().toISOString(),
  }

  try {
    const result = await sendReminderEmail({
      to: user.email,
      reminder: fakeReminder,
    })
    return NextResponse.json({
      ok: true,
      sent_to: user.email,
      provider: 'smtp',
      message_id: result.id,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[email/test]', msg)
    return NextResponse.json({ error: 'Failed to send test email.' }, { status: 500 })
  }
}
