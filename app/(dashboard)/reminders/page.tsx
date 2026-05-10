'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Check, Clock, AlertCircle, Calendar,
  Mail, MessageSquare, Target, BookOpen, Loader2, Trash2,
  Zap, GripVertical,
} from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authFetch } from '@/lib/api'
import type { Reminder, ReminderType } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const typeConfig: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  follow_up:      { label: 'FOLLOW-UP',  badge: 'bg-slate-100 text-slate-600',   icon: Mail },
  thank_you:      { label: 'THANK YOU',  badge: 'bg-slate-100 text-slate-600',   icon: MessageSquare },
  check_in:       { label: 'CHECK IN',   badge: 'bg-slate-100 text-slate-600',   icon: Clock },
  deadline:       { label: 'DEADLINE',   badge: 'bg-red-50 text-red-600',        icon: Target },
  interview_prep: { label: 'INTERVIEW',  badge: 'bg-[#E8F5EE] text-[#0A6A47]',  icon: BookOpen },
}

function getGroup(dateStr: string, isDone: boolean): string {
  if (isDone) return 'Done'
  const diff = Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0)  return 'Overdue'
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff <= 7)  return 'This Week'
  return 'Later'
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function pad(n: number) { return String(n).padStart(2, '0') }

export default function RemindersPage() {
  const [reminders, setReminders]     = useState<Reminder[]>([])
  const [loading, setLoading]         = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // form
  const [title, setTitle]             = useState('')
  const [selectedType, setSelectedType] = useState<ReminderType>('follow_up')
  const [dueDate, setDueDate]         = useState('')
  const [note, setNote]               = useState('')
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    authFetch('/api/reminders')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setReminders(d) })
      .catch(() => toast.error('Failed to load reminders'))
      .finally(() => setLoading(false))
  }, [])

  const toggleDone = async (id: string, cur: boolean) => {
    const res = await fetch(`/api/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_done: !cur }),
    })
    if (res.ok) setReminders(p => p.map(r => r.id === id ? { ...r, is_done: !cur } : r))
    else toast.error('Failed to update reminder')
  }

  const deleteReminder = async (id: string) => {
    setReminders(p => p.filter(r => r.id !== id))
    const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to delete')
      authFetch('/api/reminders').then(r => r.json()).then(d => { if (Array.isArray(d)) setReminders(d) })
    }
  }

  const handleSave = async () => {
    if (!title || !dueDate) { toast.error('Title and due date are required'); return }
    setSaving(true)
    try {
      const res = await authFetch('/api/reminders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          reminder_type: selectedType,
          due_date: new Date(dueDate).toISOString(),
          description: note || null,
          is_done: false,
        }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      setReminders(p => [created, ...p])
      toast.success('Reminder added!')
      setShowAddModal(false)
      setTitle(''); setDueDate(''); setNote(''); setSelectedType('follow_up')
    } catch {
      toast.error('Failed to add reminder')
    } finally {
      setSaving(false)
    }
  }

  // ── Computed counts ──────────────────────────────────────────────────────────
  const overdue  = reminders.filter(r => !r.is_done && getGroup(r.due_date, false) === 'Overdue').length
  const todayCnt = reminders.filter(r => !r.is_done && getGroup(r.due_date, false) === 'Today').length
  const upcoming = reminders.filter(r => !r.is_done && !['Overdue','Today'].includes(getGroup(r.due_date, false))).length
  const done     = reminders.filter(r => r.is_done).length

  // ── Group reminders ──────────────────────────────────────────────────────────
  const grouped = reminders.reduce<Record<string, Reminder[]>>((acc, r) => {
    const g = getGroup(r.due_date, r.is_done)
    if (!acc[g]) acc[g] = []
    acc[g].push(r)
    return acc
  }, {})
  const groupOrder = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Later', 'Done']

  // ── AI insight for This Week ─────────────────────────────────────────────────
  const thisWeek = grouped['This Week'] || []
  const interviewCount = thisWeek.filter(r => r.reminder_type === 'interview_prep').length
  const aiInsight = interviewCount > 0
    ? `You have ${interviewCount} interview preparation task${interviewCount > 1 ? 's' : ''} this week. We recommend starting your research at least 48 hours before each interview.`
    : thisWeek.length > 0
      ? `You have ${thisWeek.length} tasks scheduled this week. Stay consistent with follow-ups to maximise your response rate.`
      : 'You\'re all clear this week — a great time to research new target companies.'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    )
  }

  // ── Reminder card (used for Today / Overdue / Tomorrow / Later / Done) ────────
  function ReminderCard({ r, groupLabel }: { r: Reminder; groupLabel: string }) {
    const cfg  = typeConfig[r.reminder_type] || typeConfig.follow_up
    const isToday    = groupLabel === 'Today'
    const isOverdue  = groupLabel === 'Overdue'

    const timeLabel = isToday
      ? `Today, ${fmtTime(r.due_date)}`
      : isOverdue
        ? `Overdue · ${fmtDate(r.due_date)}`
        : fmtDate(r.due_date)

    return (
      <div className={cn(
        'bg-white border rounded-2xl p-4 flex items-start gap-3 transition-all',
        isOverdue ? 'border-red-100' : 'border-slate-100',
        r.is_done && 'opacity-60',
      )}>
        {/* Checkbox */}
        <button
          onClick={() => toggleDone(r.id, r.is_done)}
          className="mt-0.5 shrink-0 cursor-pointer"
        >
          <div className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            r.is_done
              ? 'bg-[#0A6A47] border-[#0A6A47]'
              : isOverdue
                ? 'border-red-400 hover:border-red-500'
                : 'border-slate-300 hover:border-[#0A6A47]',
          )}>
            {r.is_done && <Check className="w-3 h-3 text-white" />}
          </div>
        </button>

        <div className="flex-1 min-w-0">
          {/* Badge */}
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded inline-block mb-1', cfg.badge)}>
            {cfg.label}
          </span>
          {/* Title */}
          <p className={cn(
            'text-[15px] font-semibold leading-snug',
            r.is_done ? 'line-through text-slate-400' : 'text-slate-900',
          )}>
            {r.title}
          </p>
          {/* Time + location */}
          <p className={cn(
            'flex items-center gap-1 text-[12px] mt-1',
            isOverdue ? 'text-red-500' : 'text-slate-400',
          )}>
            <Clock className="w-3 h-3 shrink-0" />
            {timeLabel}
            {r.description && ` • ${r.description}`}
          </p>
        </div>

        <button
          onClick={() => deleteReminder(r.id)}
          className="p-1 rounded hover:bg-red-50 transition-colors cursor-pointer shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-200 hover:text-red-500 transition-colors" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-up max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Schedule</h1>
          <p className="text-[13px] text-slate-500 mt-1 max-w-xs leading-relaxed">
            Your curated path to a new role. Precision in every follow-up and interview preparation.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#0A6A47] hover:bg-[#085438] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
        >
          <Calendar className="w-4 h-4" />
          Add Reminder
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'OVERDUE', value: overdue, sub: 'Critical attention required',
            border: 'border-l-4 border-l-red-500',
            icon: AlertCircle, iconCls: 'text-red-500',
          },
          {
            label: 'DUE TODAY', value: todayCnt, sub: 'Upcoming milestones',
            border: 'border-l-4 border-l-[#0A6A47]',
            icon: Calendar, iconCls: 'text-[#0A6A47]',
          },
          {
            label: 'UPCOMING', value: upcoming, sub: 'Next 7 days scheduled',
            border: 'border-l-4 border-l-slate-200',
            icon: Calendar, iconCls: 'text-slate-400',
          },
          {
            label: 'DONE', value: done, sub: 'Completed this month',
            border: '',
            icon: Check, iconCls: 'text-[#0A6A47]', iconBg: 'bg-[#E8F5EE] rounded-full',
          },
        ].map(stat => (
          <div key={stat.label} className={cn('bg-white rounded-2xl p-5 shadow-sm', stat.border)}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{stat.label}</p>
              <div className={cn('w-6 h-6 flex items-center justify-center', stat.iconBg)}>
                <stat.icon className={cn('w-4 h-4', stat.iconCls)} />
              </div>
            </div>
            <p className="text-4xl font-black text-slate-900">{pad(stat.value)}</p>
            <p className="text-[11px] text-slate-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {reminders.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No reminders yet — add your first one!</p>
        </div>
      )}

      {/* ── Groups ── */}
      {groupOrder.map(group => {
        const items = grouped[group]
        if (!items || items.length === 0) return null

        // ── "This Week" gets the 2-col AI layout ──
        if (group === 'This Week') {
          return (
            <div key={group}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-[15px] font-bold text-slate-900">{group}</h2>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-4">
                {/* AI Curator Insight */}
                <div className="bg-[#B2DFCC] rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Zap className="w-3.5 h-3.5 text-[#0A6A47]" />
                    <span className="text-[10px] font-bold text-[#0A6A47] tracking-widest uppercase">AI Curator Insight</span>
                  </div>
                  <p className="text-[13px] text-[#1a4a35] leading-relaxed flex-1">{aiInsight}</p>
                  <button className="mt-4 text-[12px] font-semibold text-[#0A6A47] underline underline-offset-2 text-left">
                    View Preparation Deck →
                  </button>
                </div>

                {/* Items list */}
                <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
                  {items.map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 px-4 py-3.5 group"
                    >
                      <button
                        onClick={() => toggleDone(r.id, r.is_done)}
                        className="shrink-0 cursor-pointer"
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          r.is_done ? 'bg-[#0A6A47]' : 'bg-slate-900',
                        )} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-[14px] font-semibold',
                          r.is_done ? 'line-through text-slate-400' : 'text-slate-900',
                        )}>
                          {r.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {fmtDate(r.due_date)} · {fmtTime(r.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => deleteReminder(r.id)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 text-slate-300 hover:text-red-500" />
                        </button>
                        <GripVertical className="w-4 h-4 text-slate-200" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )
        }

        // ── All other groups ──
        return (
          <div key={group}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className={cn(
                'text-[15px] font-bold',
                group === 'Overdue' ? 'text-red-500' : 'text-slate-900',
              )}>
                {group}
              </h2>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="space-y-2.5">
              {items.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ReminderCard r={r} groupLabel={group} />
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}

      {/* ── Add Reminder Modal ── */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Reminder" size="md">
        <div className="p-6 space-y-4">
          <Input
            id="reminderTitle"
            label="Title"
            placeholder="Follow up with..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Type</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(key as ReminderType)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
                    selectedType === key
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:border-emerald-400',
                  )}
                >
                  <cfg.icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            id="dueDate"
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Note / Location (optional)</label>
            <textarea
              rows={3}
              placeholder="Optional note or location..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !title || !dueDate}>
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : 'Save Reminder'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
