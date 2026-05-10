'use client'

import { useMemo, Fragment } from 'react'
import { cn } from '@/lib/utils'

export type HeatmapDay = { date: string; count: number }

interface Props {
  days: HeatmapDay[]
  total: number
  dark?: boolean
}

function localDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function cellBg(count: number, isFuture: boolean, dark: boolean) {
  if (isFuture) return 'bg-transparent'
  if (dark) {
    if (count === 0) return 'bg-[#161b22]'
    if (count === 1) return 'bg-[#0e4429]'
    if (count <= 3) return 'bg-[#006d32]'
    if (count <= 6) return 'bg-[#26a641]'
    return 'bg-[#39d353]'
  }
  if (count === 0) return 'bg-slate-100'
  if (count === 1) return 'bg-emerald-200'
  if (count <= 3) return 'bg-emerald-400'
  if (count <= 6) return 'bg-emerald-600'
  return 'bg-[#0A6A47]'
}

const NUM_WEEKS = 26
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

export function ActivityHeatmap({ days, total, dark = false }: Props) {
  const { weeks, monthLabels } = useMemo(() => {
    const countMap = new Map(days.map(d => [d.date, d.count]))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = localDateStr(today)

    const daysToSat = (6 - today.getDay() + 7) % 7
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + daysToSat)
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - NUM_WEEKS * 7 + 1)

    type DayCell = {
      date: string; count: number; dow: number
      isFuture: boolean; isToday: boolean; monthDay: number; jsDate: Date
    }
    const allDays: DayCell[] = []
    const cur = new Date(startDate)
    for (let i = 0; i < NUM_WEEKS * 7; i++) {
      const ds = localDateStr(cur)
      allDays.push({
        date: ds, count: countMap.get(ds) ?? 0, dow: cur.getDay(),
        isFuture: cur > today, isToday: ds === todayStr,
        monthDay: cur.getDate(), jsDate: new Date(cur),
      })
      cur.setDate(cur.getDate() + 1)
    }

    const weeks: DayCell[][] = []
    for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7))

    const seen = new Set<string>()
    const monthLabels: Array<{ label: string; wi: number }> = []
    weeks.forEach((week, wi) => {
      for (const d of week) {
        if (d.monthDay === 1) {
          const label = d.jsDate.toLocaleDateString('en-US', { month: 'short' })
          if (!seen.has(label)) { seen.add(label); monthLabels.push({ label, wi }) }
          break
        }
      }
    })
    return { weeks, monthLabels }
  }, [days])

  const labelColor = dark ? 'text-[#768390]' : 'text-slate-400'
  const dayLabelColor = dark ? 'text-[#768390]' : 'text-slate-300'
  const todayRing = dark ? 'outline-emerald-400' : 'outline-[#0A6A47]'

  return (
    <div className="select-none w-full">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `24px repeat(${weeks.length}, 13px)`,
          gridTemplateRows: `14px repeat(7, 13px)`,
          rowGap: 3,
          columnGap: 3,
        }}
      >
        {/* Month labels */}
        <div />
        {weeks.map((_, wi) => (
          <div key={wi} className={cn('text-[9px] font-semibold overflow-visible whitespace-nowrap pb-1', labelColor)}>
            {monthLabels.find(m => m.wi === wi)?.label ?? ''}
          </div>
        ))}

        {/* Day rows */}
        {DOW_ORDER.map(dow => (
          <Fragment key={dow}>
            <div className={cn('flex items-center justify-end pr-1 text-[9px] font-medium', dayLabelColor)}>
              {dow === 1 ? 'Mon' : dow === 3 ? 'Wed' : dow === 5 ? 'Fri' : ''}
            </div>
            {weeks.map((week, wi) => {
              const day = week[dow]
              const bg = cellBg(day.count, day.isFuture, dark)
              const fmtDate = day.jsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const tipText = day.isFuture ? '' : `${day.count} application${day.count !== 1 ? 's' : ''} · ${fmtDate}`
              return (
                <div
                  key={wi}
                  className={cn(
                    'rounded-[2px] relative group/cell',
                    bg,
                    day.isToday && !day.isFuture && `outline outline-[1.5px] outline-offset-[1px] ${todayRing}`,
                    !day.isFuture && 'cursor-default',
                  )}
                  style={{ width: 13, height: 13 }}
                >
                  {tipText && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 hidden group-hover/cell:block">
                      <div className="bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                        {tipText}
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-slate-900" />
                    </div>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>

      {/* Footer — only shown in light mode */}
      {!dark && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[11px] text-slate-400">
            <span className="font-semibold text-slate-600">{total}</span> applications in the last 6 months
          </p>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400 mr-0.5">Less</span>
            {(['bg-slate-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-600', 'bg-[#0A6A47]'] as const).map((c, i) => (
              <div key={i} className={cn('rounded-[2px] flex-shrink-0', c)} style={{ width: 11, height: 11 }} />
            ))}
            <span className="text-[9px] text-slate-400 ml-0.5">More</span>
          </div>
        </div>
      )}
    </div>
  )
}
