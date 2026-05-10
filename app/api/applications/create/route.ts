import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { sendApplicationConfirmationEmail } from '@/lib/email'
import { normalizeApplicationInput, readJsonObject } from '@/lib/api-validation'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const body = await readJsonObject(req)
  if (body.error) return body.error

  const normalized = normalizeApplicationInput(body.data)
  if (normalized.error) return normalized.error

  const { data, error } = await supabase
    .from('applications')
    .insert({ ...normalized.data, user_id: user.id })
    .select()
    .single()

  if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 400 })

  const { error: activityError } = await supabase.from('activity_log').insert({
    user_id: user.id,
    application_id: data.id,
    event_type: 'applied',
    event_data: { company: data.company_name, role: data.role_title },
  })
  if (activityError) console.error('[applications/create] Activity log insert failed:', activityError)

  if (user.email) {
    const { data: profile } = await supabase
      .from('users')
      .select('email_digest')
      .eq('id', user.id)
      .single()

    if ((profile?.email_digest ?? 'daily') !== 'never') {
      sendApplicationConfirmationEmail({
        to: user.email,
        application: data,
      })?.catch((err) => {
        console.error('[applications/create] Email send failed:', err)
      })
    }
  }

  return new NextResponse(JSON.stringify(data), { status: 200 })
}
