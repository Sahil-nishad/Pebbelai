'use client'

import { useEffect, useState } from 'react'
import { Mail, CheckCircle2, AlertCircle, ExternalLink, Settings, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { authFetch } from '@/lib/api'

interface GmailStatus {
  id: string
  email: string
  is_active: boolean
  created_at: string
}

async function fetchGmailStatus(): Promise<GmailStatus | null> {
  const res = await authFetch('/api/careers/gmail/status')
  if (!res.ok) return null
  const data = await res.json()
  return data ?? null
}

async function initiateGmailOAuth(): Promise<string | null> {
  const res = await authFetch('/api/careers/gmail/initiate', { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Gmail OAuth not configured on this server.')
  }
  const data = await res.json()
  return data.auth_url ?? null
}

export default function CareersSettingsPage() {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null | 'loading'>('loading')
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    fetchGmailStatus()
      .then(setGmailStatus)
      .catch(() => setGmailStatus(null))
  }, [])

  async function handleGmailConnect() {
    setConnecting(true)
    try {
      const url = await initiateGmailOAuth()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start Gmail OAuth flow.')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Gmail Integration */}
      <Card className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
            <Mail className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Gmail Integration</h2>
            <p className="text-sm text-slate-500">Connect Gmail to send recruiter outreach emails directly.</p>
          </div>
        </div>

        {gmailStatus === 'loading' ? (
          <div className="skeleton h-14 rounded-xl" />
        ) : gmailStatus ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-800">Connected</p>
              <p className="text-sm text-emerald-700 truncate">{gmailStatus.email}</p>
            </div>
            <Button variant="secondary" onClick={handleGmailConnect} disabled={connecting} className="rounded-xl text-sm">
              Reconnect
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Not connected</p>
                <p className="text-sm text-amber-700">
                  Without Gmail, emails are sent via the SMTP fallback. Connect Gmail for full tracking and personalization.
                </p>
              </div>
            </div>
            <Button onClick={handleGmailConnect} disabled={connecting} className="rounded-xl w-full sm:w-auto">
              <Mail className="h-4 w-4 mr-2" />
              {connecting ? 'Redirecting to Google…' : 'Connect Gmail'}
            </Button>
          </div>
        )}
      </Card>

      {/* Automation Settings */}
      <Card className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
            <Zap className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Automation</h2>
            <p className="text-sm text-slate-500">Background job settings for the recruiter feed.</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Auto-refresh recruiter feed</p>
              <p className="text-xs text-slate-400 mt-0.5">Runs every 6 hours via Celery Beat</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Active</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Daily email limit</p>
              <p className="text-xs text-slate-400 mt-0.5">Anti-spam: max 25 outreach emails/day</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">25/day</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Manual approval required</p>
              <p className="text-xs text-slate-400 mt-0.5">All emails must be reviewed before sending</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Enabled</span>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
            <Settings className="h-5 w-5 text-sky-500" />
          </div>
          <h2 className="font-semibold text-slate-900">About PebelAI Careers</h2>
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> AI-personalized recruiter outreach (OpenAI GPT-4)</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Resume parsing (PyMuPDF + spaCy)</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> ATS match scoring against recruiter posts</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Recruiter search via Playwright automation</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Gmail API sending with SMTP fallback</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Follow-up tracking and management</li>
        </ul>
        <a
          href="https://github.com/pebelai/jobflow"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          View documentation <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Card>
    </div>
  )
}
