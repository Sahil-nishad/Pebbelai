import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth

  // 26 weeks ≈ 6 months
  const since = new Date()
  since.setDate(since.getDate() - 182)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data: apps, error } = await supabase
    .from('applications')
    .select('applied_date')
    .eq('user_id', user.id)
    .gte('applied_date', sinceStr)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts = new Map<string, number>()
  for (const app of apps ?? []) {
    const ds = (app.applied_date as string).slice(0, 10)
    counts.set(ds, (counts.get(ds) ?? 0) + 1)
  }

  const days = Array.from(counts.entries()).map(([date, count]) => ({ date, count }))
  const total = (apps ?? []).length

  return NextResponse.json({ days, total })
}
