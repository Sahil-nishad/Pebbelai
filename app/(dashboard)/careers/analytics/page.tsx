'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Users, Mail, CheckCircle, Clock } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { getCareerAnalytics } from '@/services/careers'
import type { CareerAnalytics } from '@/types/careers'

function ProgressBar({ value, max, color = 'emerald' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-sky-500' : 'bg-amber-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function MiniDonut({ rate }: { rate: number }) {
  const r = 52
  const circumference = 2 * Math.PI * r
  const strokeDash = (rate / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        <circle
          cx="65" cy="65" r={r} fill="none"
          stroke={rate >= 30 ? '#10b981' : rate >= 10 ? '#f59e0b' : '#f43f5e'}
          strokeWidth="14"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold text-slate-900">{rate}%</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Reply rate</p>
      </div>
    </div>
  )
}

const statCards = [
  {
    key: 'total_applications' as const,
    label: 'Total Applications',
    icon: Mail,
    color: 'bg-emerald-50 text-emerald-600',
    helper: 'Outreach emails sent',
  },
  {
    key: 'recruiter_responses' as const,
    label: 'Recruiter Replies',
    icon: CheckCircle,
    color: 'bg-sky-50 text-sky-600',
    helper: 'Positive/neutral responses',
  },
  {
    key: 'pending_replies' as const,
    label: 'Pending',
    icon: Clock,
    color: 'bg-amber-50 text-amber-600',
    helper: 'Awaiting reply',
  },
]

export default function CareersAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CareerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCareerAnalytics()
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    )
  }

  const total = analytics?.total_applications ?? 0
  const replies = analytics?.recruiter_responses ?? 0
  const pending = analytics?.pending_replies ?? 0
  const rate = analytics?.response_rate ?? 0
  const rejected = total - replies - pending

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = analytics?.[card.key] ?? 0
          return (
            <Card key={card.key} className="overflow-hidden">
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{card.helper}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Response rate donut + breakdown */}
      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <Card className="flex flex-col items-center justify-center gap-4 py-8">
          <MiniDonut rate={rate} />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Response Rate</p>
            <p className="text-xs text-slate-400 mt-1">
              {rate >= 30 ? 'Excellent — keep going!' : rate >= 10 ? 'Good progress' : 'Room to improve'}
            </p>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Outreach Breakdown</h2>
          </div>

          {total === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <TrendingUp className="h-8 w-8 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No data yet. Send your first recruiter outreach to see analytics.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Recruiter replies</span>
                  <span className="font-bold text-emerald-700">{replies}</span>
                </div>
                <ProgressBar value={replies} max={total} color="emerald" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Pending replies</span>
                  <span className="font-bold text-amber-700">{pending}</span>
                </div>
                <ProgressBar value={pending} max={total} color="amber" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Rejected / no response</span>
                  <span className="font-bold text-slate-600">{rejected < 0 ? 0 : rejected}</span>
                </div>
                <ProgressBar value={rejected < 0 ? 0 : rejected} max={total} color="slate" />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent outreach mini-list */}
      {(analytics?.recent_outreach?.length ?? 0) > 0 && (
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {analytics!.recent_outreach.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 text-sm">{item.email_subject}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.match_summary || 'AI-generated outreach'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {item.match_percentage}% match
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.reply_status === 'replied' ? 'bg-emerald-50 text-emerald-700' : item.reply_status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                    {item.reply_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
