'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Loader2, TrendingUp, TrendingDown, Mail, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import * as careers from '@/services/careers'
import type { AnalyticsSummary } from '@/types/careers'

export default function CareersAnalyticsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadAnalytics()
  }, [user?.id])

  const loadAnalytics = async () => {
    try {
      const data = await careers.getAnalytics()
      setAnalytics(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Total', value: analytics?.total_applications || 0, icon: Mail, color: 'text-slate-900' },
    { label: 'Sent', value: analytics?.sent || 0, icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Replied', value: analytics?.replied || 0, icon: CheckCircle, color: 'text-emerald-600' },
    { label: 'Pending', value: analytics?.pending || 0, icon: Clock, color: 'text-slate-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Track your outreach performance</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : analytics ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(stat => (
              <div
                key={stat.label}
                className="p-4 rounded-xl border border-slate-200 bg-white"
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Response Rate */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Response Rate</h2>
            <div className="mt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${analytics.response_rate}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-emerald-700">
                  {analytics.response_rate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* ATS Score */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Average ATS Match Score</h2>
            <div className="mt-4 flex items-center gap-4">
              <BarChart3 className="h-8 w-8 text-emerald-600" />
              <span className="text-3xl font-bold text-slate-900">
                {analytics.avg_ats_score.toFixed(0)}
              </span>
              <span className="text-slate-500">/ 100</span>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <BarChart3 className="h-8 w-8 mx-auto text-slate-400" />
          <p className="mt-2 text-slate-600">No analytics yet</p>
        </div>
      )}
    </div>
  )
}