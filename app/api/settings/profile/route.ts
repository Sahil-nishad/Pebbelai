import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { normalizeProfileUpdates, readJsonObject } from '@/lib/api-validation'

const PROFILE_COLUMNS = [
  'id',
  'email',
  'name',
  'phone',
  'title',
  'linkedin',
  'location',
  'target_roles',
  'target_companies',
  'job_type',
  'experience_level',
  'salary_min',
  'salary_max',
  'plan',
  'email_digest',
  'follow_up_days',
  'interview_prep_days',
  'created_at',
].join(', ')

// GET — fetch the current user's profile
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const { data, error } = await supabase
    .from('users')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: 'Failed to load profile' }, { status: 400 })
  return NextResponse.json(data)
}

// PATCH — update profile fields
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const body = await readJsonObject(req)
  if (body.error) return body.error

  const normalized = normalizeProfileUpdates(body.data)
  if (normalized.error) return normalized.error

  if (Object.keys(normalized.data).length === 0) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('users')
    .update(normalized.data)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to update profile' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
