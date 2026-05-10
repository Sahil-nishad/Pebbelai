import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { deleteApplicationRecords } from '@/lib/application-store'
import { isMissingTableError } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const { data: apps, error: listError } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', user.id)

  if (listError) {
    if (isMissingTableError(listError, 'applications')) {
      deleteApplicationRecords(user.id)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: listError.message }, { status: 400 })
  }

  const appIds = (apps || []).map((app) => app.id)
  if (appIds.length > 0) {
    const dependentDeletes = [
      supabase.from('reminders').delete().in('application_id', appIds),
      supabase.from('resume_analyses').delete().in('application_id', appIds),
      supabase.from('activity_log').delete().in('application_id', appIds),
    ]

    const dependentResults = await Promise.all(dependentDeletes)
    const dependentError = dependentResults.find((result) => result.error && !isMissingTableError(result.error, 'reminders') && !isMissingTableError(result.error, 'resume_analyses') && !isMissingTableError(result.error, 'activity_log'))?.error
    if (dependentError) {
      return NextResponse.json({ error: dependentError.message }, { status: 400 })
    }
  }

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    if (isMissingTableError(error, 'applications')) {
      deleteApplicationRecords(user.id)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
