import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { normalizeApplicationInput, readJsonObject } from '@/lib/api-validation'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const { id } = await params
  const body = await readJsonObject(req)
  if (body.error) return body.error

  const normalized = normalizeApplicationInput({ status: body.data.status }, true)
  if (normalized.error) return normalized.error
  const status = normalized.data.status

  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 400 })

  const { error: activityError } = await supabase.from('activity_log').insert({
    user_id: user.id,
    application_id: id,
    event_type: 'stage_change',
    event_data: { new_status: status },
  })
  if (activityError) console.error('[applications/status] Activity log insert failed:', activityError)

  return new Response(JSON.stringify(data), { status: 200 })
}
