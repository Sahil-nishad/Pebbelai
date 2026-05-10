'use client'

import { useEffect, useState } from 'react'
import { Zap, Check, X, AlertCircle, Loader2 } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import * as careers from '@/services/careers'

type GmailStatus = 'loading' | 'connected' | 'not_connected' | 'error'

export default function CareersSettingsPage() {
  const { user } = useUser()
  const [status, setStatus] = useState<GmailStatus>('loading')
  const [connection, setConnection] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    careers.getGmailConnection()
      .then(conn => {
        setConnection(conn)
        setStatus('connected')
      })
      .catch(() => {
        setStatus('not_connected')
      })
  }, [user?.id])

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/careers/gmail/callback`
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' ')

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId || '')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')

    window.location.href = authUrl.toString()
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail?')) return
    try {
      await careers.deleteGmailConnection()
      setConnection(null)
      setStatus('not_connected')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your Gmail connection for outreach</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50">
            <Zap className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">Gmail Integration</h2>
            <p className="text-sm text-slate-500">Connect your Gmail to send outreach emails</p>
          </div>
          {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
          {status === 'connected' && (
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Connected</span>
            </div>
          )}
          {status === 'not_connected' && (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Connect Gmail
            </button>
          )}
        </div>

        {connection && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Connected Email</p>
                <p className="font-medium text-slate-900">{connection.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Daily Limit</p>
                <p className="font-medium text-slate-900">
                  {connection.emails_sent_today} / {connection.daily_limit} sent today
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  )
}