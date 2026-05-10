/**
 * GET /api/cron/send-reminders
 *
 * Runs daily to send email reminders that are due today or overdue (not yet done).
 * Secure with CRON_SECRET — call with header: Authorization: Bearer <CRON_SECRET>
 *
 * Vercel Cron: add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/send-reminders", "schedule": "0 8 * * *" }] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { sendReminderEmail, sendDailyDigestEmail } from '@/lib/email'
import type { Reminder, Application } from '@/types'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Auth check — fail closed: if secret is not configured, refuse all requests
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseServer()
  const now = new Date()
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  // Fetch all reminders due today (or overdue) that aren't done
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*, application:applications(*, contacts, interview_rounds)')
    .eq('is_done', false)
    .lte('due_date', todayEnd.toISOString())
    .order('due_date', { ascending: true })

  if (error) {
    console.error('[cron/send-reminders] DB error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No reminders due today' })
  }

  // Group reminders by user_id
  const byUser = reminders.reduce<Record<string, (Reminder & { application?: Application })[]>>(
    (acc, r) => {
      if (!acc[r.user_id]) acc[r.user_id] = []
      acc[r.user_id].push(r as Reminder & { application?: Application })
      return acc
    },
    {}
  )

  let totalSent = 0
  const errors: string[] = []

  for (const [userId, userReminders] of Object.entries(byUser)) {
    // Get user email from the public.users profile table keyed by the app UUID
    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('email, name, email_digest')
      .eq('id', userId)
      .single()

    if (profileErr || !profile?.email) {
      errors.push(`Could not get email for user ${userId}`)
      continue
    }

    const emailDigest = profile?.email_digest ?? 'daily'
    if (emailDigest === 'never') continue

    try {
      if (userReminders.length === 1) {
        // Single reminder — send individual email
        const r = userReminders[0]
        await sendReminderEmail({
          to: profile.email,
          reminder: r,
          application: r.application,
        })
      } else {
        // Multiple reminders — send digest
        await sendDailyDigestEmail({
          to: profile.email,
          reminders: userReminders,
          userName: profile?.name || undefined,
        })
      }
      totalSent++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Failed to send to ${profile.email}: ${msg}`)
      console.error('[cron/send-reminders]', msg)
    }
  }

  const status = errors.length === 0 ? 200 : totalSent > 0 ? 207 : 500
  return NextResponse.json({
    sent: totalSent,
    total_users: Object.keys(byUser).length,
    total_reminders: reminders.length,
    errors: errors.length > 0 ? errors : undefined,
  }, { status })
}
