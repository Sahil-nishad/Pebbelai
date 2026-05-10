import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth

  const { data: logs, error } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('event_type', 'applied')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const activeDates = new Set<string>()
  for (const log of logs ?? []) {
    activeDates.add(toDateStr(new Date(log.created_at)))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateStr(today)

  const todayCount = (logs ?? []).filter(
    (l) => toDateStr(new Date(l.created_at)) === todayStr
  ).length

  // Current streak: walk back from today; if today has no activity, check yesterday first
  let currentStreak = 0
  const cursor = new Date(today)

  if (!activeDates.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (activeDates.has(toDateStr(cursor))) {
    currentStreak++
    cursor.setDate(cursor.getDate() - 1)
  }

  // Best streak: scan all dates
  const sorted = Array.from(activeDates).sort()
  let bestStreak = currentStreak
  let run = 0
  let prev: Date | null = null

  for (const ds of sorted) {
    const cur = new Date(ds)
    if (prev) {
      const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000)
      run = diff === 1 ? run + 1 : 1
    } else {
      run = 1
    }
    if (run > bestStreak) bestStreak = run
    prev = cur
  }

  // Last 7 days activity (oldest → newest, index 6 = today)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const ds = toDateStr(d)
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    return {
      date: ds,
      hasActivity: activeDates.has(ds),
      dayLabel: dayLabels[d.getDay()],
      isToday: ds === todayStr,
    }
  })

  return NextResponse.json({ currentStreak, bestStreak, todayCount, last7Days })
}
