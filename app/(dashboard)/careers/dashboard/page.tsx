'use client'

import { useEffect, useState } from 'react'

import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/careers/stat-card'
import { getCareerAnalytics } from '@/services/careers'
import type { CareerAnalytics } from '@/types/careers'

export default function CareersDashboardPage() {
  const [analytics, setAnalytics] = useState<CareerAnalytics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCareerAnalytics().then(setAnalytics).catch((err: Error) => setError(err.message))
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard label="Applications" value={String(analytics?.total_applications ?? 0)} helper="Total outreach sent" />
        <StatCard label="Pending Replies" value={String(analytics?.pending_replies ?? 0)} helper="Awaiting recruiter responses" />
        <StatCard label="Recruiter Replies" value={String(analytics?.recruiter_responses ?? 0)} helper="Positive or neutral responses" />
        <StatCard label="Response Rate" value={`${analytics?.response_rate ?? 0}%`} helper="Based on sent outreach" />
      </div>

      <Card className="overflow-hidden" padding="none">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Outreach</h2>
          <p className="text-sm text-slate-500">Track the latest recruiter conversations and sent drafts.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {analytics?.recent_outreach?.length ? analytics.recent_outreach.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{item.email_subject}</p>
                <p className="text-sm text-slate-500">{item.match_summary || 'AI-generated recruiter outreach'}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">{item.match_percentage}% match</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{item.reply_status}</span>
              </div>
            </div>
          )) : (
            <div className="px-5 py-10 text-sm text-slate-500">{error || 'No outreach activity yet. Generate and send your first recruiter email from the Outreach tab.'}</div>
          )}
        </div>
      </Card>
    </div>
  )
}

