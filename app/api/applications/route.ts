import { NextRequest } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('applied_date', { ascending: false })

  if (error) return new Response(JSON.stringify({ error: 'Failed to load applications.' }), { status: 500 })
  return new Response(JSON.stringify(data), { status: 200 })
}
