'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Settings2, 
  Mail, 
  ChevronRight,
  RefreshCw,
  LogOut
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import * as careers from '@/services/careers'
import { cn } from '@/lib/utils'

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
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Settings2 className="h-3 w-3" />
            Account Preferences
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Careers <span className="text-slate-500">Settings</span>
          </h1>
          <p className="text-slate-500">Manage your integrations and automation preferences.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 shadow-sm">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Integration Card */}
      <div className="group relative rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-start justify-between gap-6">
          <div className="flex gap-5">
             <div className="p-5 rounded-3xl bg-emerald-50 text-emerald-600 transition-transform duration-500 group-hover:scale-110">
               <Zap className="h-8 w-8 fill-current" />
             </div>
             <div className="space-y-1">
               <h2 className="text-xl font-bold text-slate-900">Gmail Integration</h2>
               <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                 Grant PebelAI permission to send outreach emails directly from your professional account.
               </p>
             </div>
          </div>
          
          <div className="shrink-0">
             {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-slate-300" />}
             {status === 'connected' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold uppercase tracking-widest">
                  <Check className="h-4 w-4" />
                  Active
                </div>
             )}
          </div>
        </div>

        <div className="mt-10 p-6 rounded-[2rem] bg-slate-50/80 border border-slate-100">
          {status === 'connected' && connection ? (
            <div className="space-y-6">
               <div className="grid sm:grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorized Account</p>
                    <div className="flex items-center gap-2">
                       <Mail className="h-4 w-4 text-slate-400" />
                       <p className="font-bold text-slate-900 truncate">{connection.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Daily Capacity</p>
                    <div className="flex items-center gap-2">
                       <RefreshCw className="h-4 w-4 text-slate-400" />
                       <p className="font-bold text-slate-900">
                         {connection.emails_sent_today} / {connection.daily_limit} <span className="text-slate-400 font-medium">Outreaches Used</span>
                       </p>
                    </div>
                  </div>
               </div>
               
               <div className="pt-6 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Secure OAuth 2.0 Encryption
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-2 text-xs font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                  >
                    Disconnect Account
                    <LogOut className="h-3 w-3" />
                  </button>
               </div>
            </div>
          ) : status === 'not_connected' ? (
            <div className="flex flex-col items-center text-center py-6">
               <p className="text-slate-600 font-medium mb-6">No account connected. Connect now to unlock AI outreach.</p>
               <button
                  onClick={handleConnect}
                  className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center gap-3"
                >
                  Authorize Gmail
                  <ChevronRight className="h-4 w-4" />
                </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Additional Settings Placeholder */}
      <div className="grid md:grid-cols-2 gap-6">
         <div className="p-8 rounded-[2.5rem] border border-slate-100 bg-white opacity-50 cursor-not-allowed group">
            <h3 className="font-bold text-slate-900 mb-2">Notification Preferences</h3>
            <p className="text-sm text-slate-500">Manage email and desktop alerts for recruiter replies.</p>
            <div className="mt-4 px-3 py-1.5 rounded-lg bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest inline-block">Coming Soon</div>
         </div>
         <div className="p-8 rounded-[2.5rem] border border-slate-100 bg-white opacity-50 cursor-not-allowed group">
            <h3 className="font-bold text-slate-900 mb-2">Privacy & Security</h3>
            <p className="text-sm text-slate-500">Toggle data sharing and visibility settings for your profile.</p>
            <div className="mt-4 px-3 py-1.5 rounded-lg bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest inline-block">Coming Soon</div>
         </div>
      </div>
    </div>
  )
}