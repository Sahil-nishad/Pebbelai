'use client'

import { useEffect, useState } from 'react'
import { Mail, Clock, MessageSquare, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCareerAnalytics } from '@/services/careers'
import type { CareerAnalytics } from '@/types/careers'

const statConfigs = [
  { key: 'total_applications' as const, label: 'Applications', icon: Mail, iconColor: 'bg-emerald-50 text-emerald-600', helper: 'Total outreach sent' },
  { key: 'pending_replies' as const, label: 'Pending Replies', icon: Clock, iconColor: 'bg-amber-50 text-amber-600', helper: 'Awaiting response' },
  { key: 'recruiter_responses' as const, label: 'Replies Received', icon: MessageSquare, iconColor: 'bg-sky-50 text-sky-600', helper: 'Recruiter responses' },
  { key: 'response_rate' as const, label: 'Response Rate', icon: TrendingUp, iconColor: 'bg-violet-50 text-violet-600', helper: 'Based on sent outreach', isRate: true },
]

export default function CareersDashboardPage() {
  const [analytics, setAnalytics] = useState<CareerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCareerAnalytics()
      .then(setAnalytics)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Could not load career analytics.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfigs.map((cfg) => {
          const Icon = cfg.icon
          const raw = analytics?.[cfg.key] ?? 0
          const value = cfg.isRate ? `${raw}%` : String(raw)
          return (
            <Card
              key={cfg.key}
              className={`overflow-hidden transition-all ${loading ? 'opacity-60' : ''}`}
            >
              {loading ? (
                <div className="space-y-3">
                  <div className="skeleton h-10 w-10 rounded-xl" />
                  <div className="skeleton h-8 w-24 rounded-lg" />
                  <div className="skeleton h-3 w-32 rounded" />
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">{cfg.label}</p>
                    <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
                    <p className="mt-1 text-xs text-slate-400">{cfg.helper}</p>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Recent outreach table */}
      <Card className="overflow-hidden" padding="none">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Outreach</h2>
          <p className="text-sm text-slate-500">Track the latest recruiter conversations and sent drafts.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            ))
          ) : analytics?.recent_outreach?.length ? (
            analytics.recent_outreach.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{item.email_subject}</p>
                  <p className="text-sm text-slate-500">{item.match_summary || 'AI-generated recruiter outreach'}</p>
                </div>
                <div className="flex items-center gap-3 text-sm shrink-0">
                  <Badge variant="success">{item.match_percentage}% match</Badge>
                  <Badge variant={item.reply_status === 'replied' ? 'success' : item.reply_status === 'rejected' ? 'danger' : 'warning'}>
                    {item.reply_status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <Mail className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">No outreach yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Generate and send your first recruiter email from the Outreach tab.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
