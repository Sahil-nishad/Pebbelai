import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { normalizeApplicationInput, readJsonObject } from '@/lib/api-validation'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const { id } = await params
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404 })
  return new Response(JSON.stringify(data), { status: 200 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const { id } = await params
  const body = await readJsonObject(req)
  if (body.error) return body.error

  const normalized = normalizeApplicationInput(body.data, true)
  if (normalized.error) return normalized.error

  const { data, error } = await supabase
    .from('applications')
    .update(normalized.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return new NextResponse(JSON.stringify({ error: 'Update failed' }), { status: 400 })
  return new Response(JSON.stringify(data), { status: 200 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const { id } = await params
  const { data, error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) return new NextResponse(JSON.stringify({ error: 'Delete failed' }), { status: 400 })
  if (!data) return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404 })
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
