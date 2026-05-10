import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { listCoachSessions } from '@/lib/coach-session-store'
import { isMissingTableError } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const { data, error } = await supabase
    .from('coach_sessions')
    .select('id, company, role, session_type, question_count, avg_score, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    if (!isMissingTableError(error, 'coach_sessions')) {
      console.error('[coach/sessions] Failed to load sessions:', error)
      return NextResponse.json({ error: 'Failed to load coach sessions.' }, { status: 500 })
    }
    return NextResponse.json(listCoachSessions(user.id))
  }
  return NextResponse.json(data)
}
