'use client'

import { useEffect, useState } from 'react'
import { Mail, CheckCircle2, AlertCircle, ExternalLink, Settings, Zap, LogOut, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { authFetch } from '@/lib/api'

interface GmailStatus {
  id: string
  email: string
  is_active: boolean
  emails_sent_today: number
  daily_limit: number
  created_at: string
}

interface GmailUsage {
  emails_sent_today: number
  daily_limit: number
  remaining: number
}

async function fetchGmailStatus(): Promise<GmailStatus | null> {
  const res = await authFetch('/api/careers/gmail/status')
  if (!res.ok) return null
  const data = await res.json()
  return data ?? null
}

async function fetchGmailUsage(): Promise<GmailUsage | null> {
  const res = await authFetch('/api/careers/gmail/usage')
  if (!res.ok) return null
  return res.json()
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

async function disconnectGmailAPI(): Promise<void> {
  const res = await authFetch('/api/careers/gmail/disconnect', { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to disconnect Gmail.')
  }
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  const isWarning = percentage >= 80
  const isDanger = percentage >= 100

  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  )
}

export default function CareersSettingsPage() {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null | 'loading'>('loading')
  const [usage, setUsage] = useState<GmailUsage | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  async function refresh() {
    const [status, usageData] = await Promise.all([fetchGmailStatus(), fetchGmailUsage()])
    setGmailStatus(status)
    setUsage(usageData)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleGmailConnect() {
    setConnecting(true)
    const t = toast.loading('Connecting to Google...')
    try {
      const url = await initiateGmailOAuth()
      if (url) {
        toast.success('Redirecting to Gmail OAuth...', { id: t })
        window.location.href = url
      } else {
        toast.error('Could not obtain auth URL.', { id: t })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start Gmail OAuth flow.', { id: t })
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Gmail? You won\'t be able to send outreach emails.')) {
      return
    }
    setDisconnecting(true)
    const t = toast.loading('Disconnecting Gmail...')
    try {
      await disconnectGmailAPI()
      toast.success('Gmail disconnected.', { id: t })
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect.', { id: t })
    } finally {
      setDisconnecting(false)
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
            <p className="text-sm text-slate-500">Connect your Gmail to send recruiter outreach.</p>
          </div>
        </div>

        {gmailStatus === 'loading' ? (
          <div className="skeleton h-24 rounded-xl" />
        ) : gmailStatus ? (
          <div className="space-y-4">
            {/* Connected State */}
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-emerald-800">Connected</p>
                <p className="text-sm text-emerald-700 truncate">{gmailStatus.email}</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            {/* Usage Stats */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Daily Usage</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {usage?.emails_sent_today ?? 0} / {usage?.daily_limit ?? 25}
                </span>
              </div>
              <ProgressBar
                value={usage?.emails_sent_today ?? 0}
                max={usage?.daily_limit ?? 25}
              />
              <p className="text-xs text-slate-500">
                {usage?.remaining ?? 25} emails remaining today
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleGmailConnect} disabled={connecting} className="rounded-xl">
                <ExternalLink className="h-4 w-4 mr-2" />
                {connecting ? 'Connecting...' : 'Reconnect'}
              </Button>
              <Button variant="outline" onClick={handleDisconnect} disabled={disconnecting} className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                <LogOut className="h-4 w-4 mr-2" />
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ) : (
          /* Not Connected State */
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Not connected</p>
                <p className="text-sm text-amber-700">
                  Connect your Gmail to send AI-generated outreach emails directly from your account.
                </p>
              </div>
            </div>
            <Button onClick={handleGmailConnect} disabled={connecting} className="rounded-xl w-full sm:w-auto">
              <Mail className="h-4 w-4 mr-2" />
              {connecting ? 'Redirecting to Google...' : 'Connect Gmail'}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Requires: Gmail account, 25 daily emails, manual approval
            </p>
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
            <p className="text-sm text-slate-500">Email sending configuration.</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Daily email limit</p>
              <p className="text-xs text-slate-400 mt-0.5">Anti-spam protection</p>
            </div>
            <Badge variant="success">25/day</Badge>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Manual approval required</p>
              <p className="text-xs text-slate-400 mt-0.5">Review before sending</p>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Token encryption</p>
              <p className="text-xs text-slate-400 mt-0.5">Secure OAuth storage</p>
            </div>
            <Badge variant="success">AES-256</Badge>
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
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> AI-personalized outreach (GPT-4)</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Resume parsing (PyMuPDF)</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Recruiter discovery (Playwright)</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Gmail OAuth sending</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Daily email limits</li>
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