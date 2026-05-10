import { NextRequest } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const { data: apps, error } = await supabase
    .from('applications')
    .select('status, applied_date')
    .eq('user_id', user.id)

  if (error || !apps) {
    console.error('[applications/stats] Failed to load stats:', error)
    return new Response(JSON.stringify({ error: 'Failed to load application stats.' }), { status: 500 })
  }

  const total = apps.length
  const interviews = apps.filter((a) => ['phone_screen', 'interviewing'].includes(a.status)).length
  const offers = apps.filter((a) => a.status === 'offer').length
  const responses = apps.filter((a) => !['applied', 'ghosted'].includes(a.status)).length

  return new Response(JSON.stringify({
    total,
    interviews,
    offerRate: total > 0 ? Math.round((offers / total) * 100) : 0,
    responseRate: total > 0 ? Math.round((responses / total) * 100) : 0,
  }), { status: 200 })
}
