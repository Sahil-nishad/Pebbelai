'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus, Columns3, List, Star, Calendar,
  ArrowRight, Trash2, Loader2, Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AddAppModal, type AppFormData } from '@/components/applications/add-app-modal'
import { statusConfig, cn } from '@/lib/utils'
import { useApplications } from '@/hooks/useApplications'
import { authFetch } from '@/lib/api'
import type { Application, ApplicationStatus } from '@/types'
import toast from 'react-hot-toast'

const stages: ApplicationStatus[] = ['applied', 'phone_screen', 'interviewing', 'offer', 'rejected', 'ghosted']

const columnLabel: Record<ApplicationStatus, string> = {
  applied:      'Applied',
  phone_screen: 'Phone Screen',
  interviewing: 'Interviewing',
  offer:        'Offer',
  rejected:     'Rejected',
  ghosted:      'Ghosted',
}

// ── Desktop kanban card ───────────────────────────────────────────────────────
function AppCard({ app, onDelete }: { app: Application; onDelete: (id: string) => void }) {
  const isOffer   = app.status === 'offer'
  const isOverdue = app.next_action_date && new Date(app.next_action_date) < new Date()
  const hasSalary = app.salary_min || app.salary_max

  return (
    <div className={cn(
      'group relative bg-white p-4 rounded-xl cursor-pointer transition-all duration-200',
      'shadow-[0px_4px_20px_rgba(0,83,68,0.05)] hover:shadow-[0px_8px_28px_rgba(0,83,68,0.10)]',
      isOffer && 'border-2 border-[#0A6A47] ring-4 ring-emerald-50',
    )}>
      {isOffer && (
        <div className="absolute top-0 right-0 overflow-hidden w-12 h-12 rounded-xl">
          <div className="bg-[#0A6A47] text-white text-[8px] font-black uppercase tracking-tight px-2 py-1 transform rotate-45 translate-x-3 -translate-y-1 w-14 text-center">
            Offer
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <Link href={`/applications/${app.id}`} className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-[#F1F5F2] flex items-center justify-center text-sm font-bold text-[#0A6A47] flex-shrink-0">
            {app.company_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">{app.role_title}</p>
            <p className="text-[11px] text-slate-400 truncate">{app.company_name}</p>
          </div>
        </Link>
        <span className="text-[10px] font-semibold text-slate-400 flex-shrink-0 ml-1">{app.applied_date}</span>
      </div>
      {app.next_action_date && (
        <div className={cn('flex items-center gap-1 text-[10px] mb-2', isOverdue ? 'text-red-500' : 'text-amber-500')}>
          <Calendar className="w-3 h-3 flex-shrink-0" />
          {app.next_action || 'Follow up'} · {app.next_action_date}
        </div>
      )}
      {isOffer && hasSalary && (
        <div className="mt-2 pt-3 border-t border-stone-100">
          <span className="text-[#0A6A47] font-bold text-[11px]">
            {app.salary_min ? `$${(app.salary_min / 1000).toFixed(0)}k` : ''}
            {app.salary_min && app.salary_max ? ' – ' : ''}
            {app.salary_max ? `$${(app.salary_max / 1000).toFixed(0)}k` : ''}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} className={cn('w-2.5 h-2.5', n <= app.excitement_level ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
          ))}
        </div>
        <button
          onClick={e => { e.preventDefault(); onDelete(app.id) }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-3 h-3 text-slate-300 hover:text-red-400" />
        </button>
      </div>
    </div>
  )
}

// ── Mobile list card ──────────────────────────────────────────────────────────
const mobileBadgeColor: Record<string, string> = {
  applied:      'text-blue-600 bg-blue-50',
  phone_screen: 'text-blue-600 bg-blue-50',
  interviewing: 'text-amber-600 bg-amber-50',
  offer:        'text-emerald-600 bg-emerald-50',
  rejected:     'text-red-500 bg-red-50',
  ghosted:      'text-slate-400 bg-slate-100',
}

function MobileAppCard({ app, onDelete }: { app: Application; onDelete: (id: string) => void }) {
  const config = statusConfig[app.status]
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-[0px_2px_12px_rgba(0,0,0,0.06)]">
      <Link href={`/applications/${app.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-[#13211B] flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0">
          {app.company_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-slate-900 truncate">{app.role_title}</p>
          <p className="text-[12px] font-semibold text-[#0A6A47] truncate">{app.company_name}</p>
          <span className={cn('inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1', mobileBadgeColor[app.status] || 'text-slate-500 bg-slate-100')}>
            ● {config.label.toUpperCase()}
          </span>
        </div>
      </Link>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-[11px] text-slate-400">{app.applied_date}</span>
        <button onClick={() => onDelete(app.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-400" />
        </button>
      </div>
    </div>
  )
}

// ── Badge helper (desktop list view) ─────────────────────────────────────────
const badgeVariant = (status: string): 'info' | 'warning' | 'success' | 'danger' | 'ghost' | 'default' => {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'ghost'> = {
    applied: 'info', phone_screen: 'info', interviewing: 'warning',
    offer: 'success', rejected: 'danger', ghosted: 'ghost',
  }
  return map[status] || 'default'
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const [view, setView]           = useState<'kanban' | 'list'>('kanban')
  const [showAddModal, setShow]   = useState(false)
  const [activeTab, setActiveTab] = useState<ApplicationStatus>('applied')
  const { applications, loading, fetchApplications, deleteApplication, setApplications } = useApplications()

  const getByStatus = useCallback(
    (s: ApplicationStatus) => applications.filter(a => a.status === s),
    [applications]
  )

  const handleSave = async (data: AppFormData) => {
    try {
      const res = await authFetch('/api/applications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name:     data.company_name,
          role_title:       data.role_title,
          job_url:          data.job_url          || null,
          job_description:  data.job_description  || null,
          location:         data.location         || null,
          salary_min:       data.salary_min       ? parseInt(data.salary_min) : null,
          salary_max:       data.salary_max       ? parseInt(data.salary_max) : null,
          status:           data.status,
          applied_date:     data.applied_date,
          next_action:      data.next_action      || null,
          next_action_date: data.next_action_date || null,
          notes:            data.notes            || null,
          contacts:         [],
          interview_rounds: [],
          excitement_level: data.excitement_level,
          source:           data.source,
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Failed to save')
      }
      const created = await res.json()
      toast.success('Application added!')
      setApplications(prev => [created, ...prev.filter(a => a.id !== created.id)])
      setShow(false)
      fetchApplications()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add application')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application?')) return
    const { error } = await deleteApplication(id)
    if (error) toast.error('Failed to delete')
    else toast.success('Application deleted')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#0A6A47]" />
      </div>
    )
  }

  const tabApps = getByStatus(activeTab)

  return (
    <>
      {/* ════════════════════════════════════════
          MOBILE VIEW — tab-based list
      ════════════════════════════════════════ */}
      <div className="md:hidden animate-fade-up">

        {/* Header */}
        <div className="mb-5">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">Career Management</p>
          <h1 className="text-[1.75rem] font-bold leading-none tracking-tight text-slate-900">Applications Board</h1>
        </div>

        {/* Status tab strip */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide mb-5">
          {stages.map(stage => {
            const count    = getByStatus(stage).length
            const isActive = activeTab === stage
            return (
              <button
                key={stage}
                onClick={() => setActiveTab(stage)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-all',
                  isActive
                    ? 'bg-[#0A6A47] text-white shadow-sm'
                    : 'bg-white text-slate-500 shadow-[0px_2px_8px_rgba(0,0,0,0.06)]'
                )}
              >
                {columnLabel[stage]}
                <span className={cn(
                  'text-[10px] font-black px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-slate-500'
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Cards for active tab */}
        <div className="space-y-3">
          {tabApps.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-100 p-10 text-center">
              <p className="text-[13px] text-slate-400 mb-3">No applications in this stage.</p>
              <button
                onClick={() => setShow(true)}
                className="text-[#0A6A47] text-[13px] font-bold underline underline-offset-2"
              >
                Add one now
              </button>
            </div>
          ) : (
            tabApps.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <MobileAppCard app={app} onDelete={handleDelete} />
              </motion.div>
            ))
          )}
        </div>

        {/* Add link at bottom of list */}
        {tabApps.length > 0 && (
          <button
            onClick={() => setShow(true)}
            className="mt-4 w-full py-4 rounded-2xl border-2 border-dashed border-slate-100 text-[13px] text-slate-400 font-semibold hover:border-emerald-200 hover:text-[#0A6A47] transition-colors"
          >
            + Add new application
          </button>
        )}

      </div>

      {/* FAB — outside animate-fade-up so CSS transform doesn't break fixed positioning */}
      <button
        onClick={() => setShow(true)}
        className="md:hidden fixed bottom-[88px] right-5 z-50 flex items-center justify-center bg-[#0A6A47] text-white rounded-full shadow-xl hover:bg-[#005344] active:scale-95 transition-all"
        style={{ width: 52, height: 52 }}
        aria-label="Add application"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ════════════════════════════════════════
          DESKTOP VIEW — kanban / list
      ════════════════════════════════════════ */}
      <div className="hidden md:block animate-fade-up">

        {/* Hero header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-[2.5rem] md:text-[3rem] font-bold leading-none tracking-tight text-slate-900">
              Your Pipeline.
            </h1>
            <p className="text-slate-400 text-[14px] mt-2">
              {applications.length > 0
                ? `Managing ${applications.length} career opportunit${applications.length === 1 ? 'y' : 'ies'} with AI precision.`
                : 'No applications yet. Add your first one to get started.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View toggle */}
            <div className="flex items-center bg-stone-100 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setView('kanban')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors',
                  view === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <Columns3 className="w-3.5 h-3.5" /> Board
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors',
                  view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
            </div>

            <button
              onClick={() => setShow(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#005344] to-[#0A6A47] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Application
            </button>
          </div>
        </div>

        {/* Empty state */}
        {applications.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-400 mb-4">No applications yet.</p>
            <button
              onClick={() => setShow(true)}
              className="flex items-center gap-2 mx-auto bg-gradient-to-r from-[#005344] to-[#0A6A47] text-white text-[13px] font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Application
            </button>
          </div>
        )}

        {/* Kanban board */}
        {view === 'kanban' && applications.length > 0 && (
          <div className="overflow-x-auto pb-4 -mx-6 lg:-mx-12 px-6 lg:px-12">
            <div className="grid grid-cols-6 gap-4 min-w-[900px]">
              {stages.map(stage => {
                const stageApps      = getByStatus(stage)
                const isFaded        = stage === 'rejected' || stage === 'ghosted'
                const isInterviewing = stage === 'interviewing'
                const nextInterview  = isInterviewing ? stageApps.find(a => a.next_action_date) : null

                return (
                  <div
                    key={stage}
                    className={cn('space-y-3 transition-all duration-300', isFaded && 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0')}
                  >
                    {/* Column header */}
                    <div className="flex items-center justify-between px-1 mb-4">
                      <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                        {columnLabel[stage]}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {stageApps.length}
                        </span>
                        <button
                          onClick={() => setShow(true)}
                          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-stone-200 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>

                    {/* AI hint for interviewing */}
                    {isInterviewing && nextInterview && (
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl mb-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                          <Sparkles className="w-3 h-3" /> AI Tip
                        </div>
                        <p className="text-[11px] text-emerald-700 leading-relaxed">
                          Prepare for your next step at {nextInterview.company_name}
                          {nextInterview.next_action_date ? ` on ${nextInterview.next_action_date}` : ''}.
                        </p>
                      </div>
                    )}

                    {/* Cards */}
                    <div className="flex flex-col gap-3">
                      {stageApps.map((app, i) => (
                        <motion.div
                          key={app.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <AppCard app={app} onDelete={handleDelete} />
                        </motion.div>
                      ))}

                      {stageApps.length === 0 && (
                        <div
                          onClick={() => setShow(true)}
                          className="rounded-xl border-2 border-dashed border-slate-100 p-6 text-center cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors"
                        >
                          <p className="text-[10px] text-slate-300">Add here</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* List view */}
        {view === 'list' && applications.length > 0 && (
          <Card className="overflow-hidden p-0 shadow-sm border-none">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Company</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Applied</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Next Action</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rating</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {applications.map(app => {
                  const config = statusConfig[app.status]
                  return (
                    <tr key={app.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link href={`/applications/${app.id}`} className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#F1F5F2] flex items-center justify-center text-[12px] font-bold text-[#0A6A47]">
                            {app.company_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-semibold text-slate-900 hover:text-[#0A6A47] transition-colors">
                            {app.company_name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-slate-500">{app.role_title}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={badgeVariant(app.status)}>{config.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-400">{app.applied_date}</td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-400">{app.next_action || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} className={cn('w-3 h-3', n <= app.excitement_level ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/applications/${app.id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </Link>
                          <button onClick={() => handleDelete(app.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <AddAppModal open={showAddModal} onClose={() => setShow(false)} onSave={handleSave} />
    </>
  )
}
