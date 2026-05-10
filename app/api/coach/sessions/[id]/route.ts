import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { deleteCoachSession, getCoachSession } from '@/lib/coach-session-store'
import { isMissingTableError } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const { id } = await params
  const { data, error } = await supabase
    .from('coach_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (!isMissingTableError(error, 'coach_sessions')) {
      console.error('[coach/session] Failed to load session:', error)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    const fallback = getCoachSession(id, user.id)
    if (!fallback) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    return NextResponse.json(fallback)
  }
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const { id } = await params
  const { data, error } = await supabase
    .from('coach_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    if (!isMissingTableError(error, 'coach_sessions')) {
      console.error('[coach/session] Failed to delete session:', error)
      return NextResponse.json({ error: 'Failed to delete session.' }, { status: 500 })
    }
    const deleted = deleteCoachSession(id, user.id)
    if (!deleted) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  }

  if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
