'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, XCircle, MessageSquare, ChevronRight, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCareerApplications } from '@/services/careers'
import type { CareerApplication } from '@/types/careers'
import { authFetch } from '@/lib/api'

const replyStatusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'warning' as const },
  replied: { label: 'Replied', icon: CheckCircle2, color: 'success' as const },
  rejected: { label: 'Rejected', icon: XCircle, color: 'danger' as const },
  no_response: { label: 'No Response', icon: AlertCircle, color: 'ghost' as const },
}

async function patchReplyStatus(id: string, reply_status: string) {
  const res = await authFetch(`/api/careers/applications/${id}/reply`, {
    method: 'PATCH',
    body: JSON.stringify({ reply_status }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Update failed.' }))
    throw new Error(err.detail || err.error || 'Update failed.')
  }
  return res.json() as Promise<CareerApplication>
}

export default function CareersApplicationsPage() {
  const [applications, setApplications] = useState<CareerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    getCareerApplications()
      .then(setApplications)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load applications.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(id: string, status: string) {
    try {
      const updated = await patchReplyStatus(id, status)
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      toast.success(`Marked as ${status.replace('_', ' ')}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!applications.length) {
    return (
      <Card className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <MessageSquare className="h-6 w-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900">No applications yet</p>
          <p className="max-w-sm text-sm text-slate-500">
            Generate and send your first recruiter outreach from the Outreach tab to see applications here.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{applications.length} application{applications.length !== 1 ? 's' : ''} total</p>
      </div>

      {applications.map((app) => {
        const cfg = replyStatusConfig[app.reply_status as keyof typeof replyStatusConfig] ?? replyStatusConfig.pending
        const StatusIcon = cfg.icon
        const isExpanded = expandedId === app.id

        return (
          <Card key={app.id} className="space-y-0 overflow-hidden p-0">
            <button
              onClick={() => setExpandedId(isExpanded ? null : app.id)}
              className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <StatusIcon className={`h-5 w-5 ${cfg.color === 'success' ? 'text-emerald-600' : cfg.color === 'warning' ? 'text-amber-500' : cfg.color === 'danger' ? 'text-rose-500' : 'text-slate-400'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{app.email_subject}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="success">{app.match_percentage}% match</Badge>
                <Badge variant={cfg.color}>{cfg.label}</Badge>
                <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 p-5 space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Email body</p>
                  <pre className="whitespace-pre-wrap text-sm text-slate-600 font-sans leading-6">{app.email_body}</pre>
                </div>
                {app.match_summary && (
                  <p className="text-sm text-slate-600">{app.match_summary}</p>
                )}
                {app.missing_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-medium text-slate-500 mr-1">Missing skills:</span>
                    {app.missing_skills.map((s) => <Badge key={s} variant="warning">{s}</Badge>)}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-500 self-center">Mark status:</span>
                  {(['pending', 'replied', 'rejected', 'no_response'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={app.reply_status === s ? 'primary' : 'secondary'}
                      onClick={() => handleStatusChange(app.id, s)}
                      className="rounded-xl h-8 px-3 text-xs"
                    >
                      {replyStatusConfig[s].label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
