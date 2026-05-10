'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Users, Briefcase, MessageSquare, Bell, Activity, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

const ADMIN_EMAIL = 'sahilsahani13@gmail.com'

interface AdminData {
  users: Record<string, unknown>[]
  applications: Record<string, unknown>[]
  coachSessions: Record<string, unknown>[]
  reminders: Record<string, unknown>[]
  activityLog: Record<string, unknown>[]
}

function fmt(iso: unknown) {
  if (!iso) return '—'
  return new Date(iso as string).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function Table({ rows, cols }: { rows: Record<string, unknown>[]; cols: string[] }) {
  if (!rows.length) return <p className="text-slate-400 text-sm py-4 text-center">No data yet</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-slate-200">
            {cols.map(c => (
              <th key={c} className="text-left py-2 px-3 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              {cols.map(c => {
                const key = c.toLowerCase().replace(/ /g, '_')
                const val = row[key]
                return (
                  <td key={c} className="py-2 px-3 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                    {key.includes('date') || key.includes('_at')
                      ? fmt(val)
                      : val === null || val === undefined
                      ? '—'
                      : String(val)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Section({
  icon: Icon, title, count, color, children,
}: {
  icon: React.ElementType; title: string; count: number; color: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-900">{title}</span>
          <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 font-medium">{count}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/data', { credentials: 'same-origin' })
      if (res.status === 401) { router.replace('/dashboard'); return }
      setData(await res.json())
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || session?.user?.email !== ADMIN_EMAIL) {
      router.replace('/dashboard')
      return
    }
    load()
  }, [status, session, router, load])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-600" />
      </div>
    )
  }

  if (!data) return null

  const stats = [
    { label: 'Users', value: data.users.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Applications', value: data.applications.length, icon: Briefcase, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Coach Sessions', value: data.coachSessions.length, icon: MessageSquare, color: 'bg-purple-50 text-purple-600' },
    { label: 'Reminders', value: data.reminders.length, icon: Bell, color: 'bg-amber-50 text-amber-600' },
    { label: 'Activity Events', value: data.activityLog.length, icon: Activity, color: 'bg-slate-100 text-slate-600' },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAF9] p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
            {lastRefresh && (
              <p className="text-xs text-slate-400 mt-0.5">Last refreshed {lastRefresh.toLocaleTimeString()}</p>
            )}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Users */}
        <Section icon={Users} title="Users" count={data.users.length} color="bg-blue-50 text-blue-600">
          <Table
            rows={data.users}
            cols={['ID', 'Email', 'Name', 'Job Type', 'Experience Level', 'Created At']}
          />
        </Section>

        {/* Applications */}
        <Section icon={Briefcase} title="Applications" count={data.applications.length} color="bg-emerald-50 text-emerald-600">
          <Table
            rows={data.applications}
            cols={['ID', 'User ID', 'Company Name', 'Role Title', 'Status', 'Applied Date', 'Source', 'Created At']}
          />
        </Section>

        {/* Coach Sessions */}
        <Section icon={MessageSquare} title="Coach Sessions" count={data.coachSessions.length} color="bg-purple-50 text-purple-600">
          <Table
            rows={data.coachSessions}
            cols={['ID', 'User ID', 'Company', 'Role', 'Session Type', 'Question Count', 'Created At']}
          />
        </Section>

        {/* Reminders */}
        <Section icon={Bell} title="Reminders" count={data.reminders.length} color="bg-amber-50 text-amber-600">
          <Table
            rows={data.reminders}
            cols={['ID', 'User ID', 'Title', 'Reminder Type', 'Due Date', 'Is Done', 'Created At']}
          />
        </Section>

        {/* Activity Log */}
        <Section icon={Activity} title="Activity Log (last 200)" count={data.activityLog.length} color="bg-slate-100 text-slate-600">
          <Table
            rows={data.activityLog}
            cols={['ID', 'User ID', 'Event Type', 'Created At']}
          />
        </Section>

      </div>
    </div>
  )
}
