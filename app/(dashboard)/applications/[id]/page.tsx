'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Star, Calendar, MapPin, ExternalLink,
  Trash2, Bot, Plus, CheckCircle2, Circle, User,
  Mail, Link2, Loader2, Save, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { statusConfig } from '@/lib/utils'
import { authFetch } from '@/lib/api'
import type { Application, ApplicationStatus, InterviewRound, Contact, InterviewType, InterviewFormat } from '@/types'
import toast from 'react-hot-toast'

const tabs = ['Overview', 'Interview Rounds', 'Contacts', 'Notes', 'AI Prep']

const timelineStages: { label: string; status: ApplicationStatus }[] = [
  { label: 'Applied', status: 'applied' },
  { label: 'Phone Screen', status: 'phone_screen' },
  { label: 'Interviewing', status: 'interviewing' },
  { label: 'Final Round', status: 'offer' },
  { label: 'Decision', status: 'offer' },
]

const badgeVariant = (status: string): 'info' | 'warning' | 'success' | 'danger' | 'ghost' | 'default' => {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'ghost'> = {
    applied: 'info', phone_screen: 'info', interviewing: 'warning',
    offer: 'success', rejected: 'danger', ghosted: 'ghost',
  }
  return map[status] || 'default'
}

const outcomeVariant = (outcome: string): 'success' | 'danger' | 'default' => {
  if (outcome === 'passed') return 'success'
  if (outcome === 'failed') return 'danger'
  return 'default'
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')
  const [notes, setNotes] = useState('')
  const [showFullJD, setShowFullJD] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [showAddRound, setShowAddRound] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [now] = useState(() => Date.now())
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Add round form state
  const [roundName, setRoundName] = useState('')
  const [roundDate, setRoundDate] = useState('')
  const [roundType, setRoundType] = useState<InterviewType>('phone_screen')
  const [roundFormat, setRoundFormat] = useState<InterviewFormat>('video')
  const [roundInterviewer, setRoundInterviewer] = useState('')

  // Add contact form state
  const [contactName, setContactName] = useState('')
  const [contactTitle, setContactTitle] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactLinkedin, setContactLinkedin] = useState('')

  useEffect(() => {
    authFetch(`/api/applications/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { toast.error('Application not found'); router.push('/applications'); return }
        setApp(data)
        setNotes(data.notes || '')
      })
      .catch(() => { toast.error('Failed to load application'); router.push('/applications') })
      .finally(() => setLoading(false))
  }, [id, router])

  // Auto-save notes with debounce
  useEffect(() => {
    if (!app || notes === (app.notes || '')) return
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      setSavingNotes(true)
      try {
        const res = await authFetch(`/api/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        })
        if (!res.ok) toast.error('Notes failed to save')
      } catch {
        toast.error('Notes failed to save')
      } finally {
        setSavingNotes(false)
      }
    }, 1500)
    return () => { if (notesTimer.current) clearTimeout(notesTimer.current) }
  }, [notes, app, id])

  const handleMarkComplete = async () => {
    if (!app) return
    const res = await authFetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next_action: null, next_action_date: null }),
    })
    if (res.ok) {
      setApp((prev) => prev ? { ...prev, next_action: null, next_action_date: null } : prev)
      toast.success('Marked complete!')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete application for ${app?.company_name}?`)) return
    const res = await authFetch(`/api/applications/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Application deleted'); router.push('/applications') }
    else toast.error('Failed to delete')
  }

  const handleAddRound = async () => {
    if (!app || !roundName) return
    const newRound: InterviewRound = {
      round: roundName,
      date: roundDate,
      type: roundType,
      format: roundFormat,
      interviewer: roundInterviewer || undefined,
      notes: '',
      outcome: 'pending',
    }
    const updatedRounds = [...(app.interview_rounds || []), newRound]
    const res = await authFetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interview_rounds: updatedRounds }),
    })
    if (res.ok) {
      setApp((prev) => prev ? { ...prev, interview_rounds: updatedRounds } : prev)
      toast.success('Interview round added!')
      setShowAddRound(false)
      setRoundName(''); setRoundDate(''); setRoundInterviewer('')
    } else toast.error('Failed to add round')
  }

  const handleAddContact = async () => {
    if (!app || !contactName) return
    const newContact: Contact = {
      name: contactName,
      title: contactTitle,
      email: contactEmail,
      linkedin: contactLinkedin,
    }
    const updatedContacts = [...(app.contacts || []), newContact]
    const res = await authFetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: updatedContacts }),
    })
    if (res.ok) {
      setApp((prev) => prev ? { ...prev, contacts: updatedContacts } : prev)
      toast.success('Contact added!')
      setShowAddContact(false)
      setContactName(''); setContactTitle(''); setContactEmail(''); setContactLinkedin('')
    } else toast.error('Failed to add contact')
  }

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    const res = await authFetch(`/api/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setApp((prev) => prev ? { ...prev, status: newStatus } : prev)
      toast.success('Status updated!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!app) return null

  const config = statusConfig[app.status]
  const daysApplied = Math.floor((now - new Date(app.applied_date).getTime()) / (1000 * 60 * 60 * 24))
  const currentStageIndex = timelineStages.findIndex((s) => s.status === app.status)

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="space-y-3">
        {/* Row 1: back + actions — always in one line */}
        <div className="flex items-center justify-between gap-2">
          <Link href="/applications" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Applications</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={app.status}
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
              className="h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer max-w-[110px]"
            >
              {(['applied','phone_screen','interviewing','offer','rejected','ghosted'] as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>{statusConfig[s].label}</option>
              ))}
            </select>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
            <Link href={`/coach?appId=${id}&company=${encodeURIComponent(app.company_name)}&role=${encodeURIComponent(app.role_title)}&autostart=1`}>
              <Button size="sm">
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">AI Prep</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Row 2: company info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-lg md:text-xl font-bold text-slate-600 shrink-0">
            {app.company_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-900 truncate">{app.company_name}</h1>
            <p className="text-slate-600 text-sm truncate">{app.role_title}</p>
          </div>
        </div>

        {/* Row 3: meta badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={badgeVariant(app.status)}>{config.label}</Badge>
          <span className="text-xs text-slate-500">Applied {app.applied_date}</span>
          {app.location && (
            <span className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="w-3 h-3" />{app.location}</span>
          )}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`w-3.5 h-3.5 ${n <= app.excitement_level ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'Overview' && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold font-[family-name:var(--font-heading)] text-slate-900 mb-4">Job Details</h3>
              <div className="space-y-3">
                {app.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" /> {app.location}
                  </div>
                )}
                {(app.salary_min || app.salary_max) && (
                  <div className="text-sm text-slate-600">
                    Salary: ${app.salary_min?.toLocaleString()} — ${app.salary_max?.toLocaleString()}
                  </div>
                )}
                {app.job_url && (
                  <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700">
                    <ExternalLink className="w-4 h-4" /> View Job Posting
                  </a>
                )}
              </div>
              {app.job_description && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {showFullJD ? app.job_description : app.job_description.slice(0, 300) + '...'}
                  </p>
                  <button onClick={() => setShowFullJD(!showFullJD)} className="text-sm text-emerald-600 mt-2 cursor-pointer hover:underline">
                    {showFullJD ? 'Show less' : 'Show more'}
                  </button>
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-semibold font-[family-name:var(--font-heading)] text-slate-900 mb-4">Stage Timeline</h3>
              <div className="space-y-0">
                {timelineStages.map((stage, i) => {
                  const completed = i <= currentStageIndex
                  const isCurrent = i === currentStageIndex
                  return (
                    <div key={stage.label} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        {completed
                          ? <CheckCircle2 className={`w-5 h-5 ${isCurrent ? 'text-emerald-500' : 'text-emerald-400'}`} />
                          : <Circle className="w-5 h-5 text-slate-300" />}
                        {i < timelineStages.length - 1 && (
                          <div className={`w-0.5 h-8 ${completed ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                        )}
                      </div>
                      <div className="pb-6">
                        <p className={`text-sm font-medium ${completed ? 'text-slate-900' : 'text-slate-400'}`}>{stage.label}</p>
                        {isCurrent && <p className="text-xs text-emerald-600">Current stage</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {app.next_action && (
              <Card className="border-amber-200 bg-amber-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-semibold font-[family-name:var(--font-heading)] text-slate-900">Next Action</h3>
                </div>
                <p className="text-sm font-medium text-slate-800">{app.next_action}</p>
                {app.next_action_date && <p className="text-sm text-slate-600 mt-1">{app.next_action_date}</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={handleMarkComplete}>Mark Complete</Button>
                </div>
              </Card>
            )}

            <Card>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Days since applied</span>
                  <span className="font-medium text-slate-900">{daysApplied}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Interview rounds</span>
                  <span className="font-medium text-slate-900">
                    {(app.interview_rounds || []).filter((r) => r.outcome === 'passed').length}/{(app.interview_rounds || []).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Contacts</span>
                  <span className="font-medium text-slate-900">{(app.contacts || []).length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Interview Rounds */}
      {activeTab === 'Interview Rounds' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddRound(true)}>
              <Plus className="w-4 h-4" /> Add Round
            </Button>
          </div>
          {(app.interview_rounds || []).length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No interview rounds yet.</p>
          )}
          {(app.interview_rounds || []).map((round, i) => (
            <Card key={i} hover>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{round.round}</h3>
                    <Badge variant={outcomeVariant(round.outcome)}>
                      {round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1)}
                    </Badge>
                  </div>
                  {round.date && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" /> {round.date}
                    </div>
                  )}
                  {round.interviewer && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <User className="w-3 h-3" /> {round.interviewer}
                    </div>
                  )}
                  <Badge variant="default">{round.format}</Badge>
                </div>
                <Link href={`/coach?appId=${id}&company=${encodeURIComponent(app.company_name)}&role=${encodeURIComponent(app.role_title)}&autostart=1`}>
                  <Button variant="ghost" size="sm"><Bot className="w-4 h-4" /> Prep for next</Button>
                </Link>
              </div>
              {round.notes && <p className="mt-3 text-sm text-slate-600 border-t border-slate-100 pt-3">{round.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      {/* Contacts */}
      {activeTab === 'Contacts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddContact(true)}>
              <Plus className="w-4 h-4" /> Add Contact
            </Button>
          </div>
          {(app.contacts || []).length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No contacts yet.</p>
          )}
          {(app.contacts || []).map((contact, i) => (
            <Card key={i} hover>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700">
                  {contact.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
                  <p className="text-xs text-slate-500">{contact.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600">
                        <Mail className="w-3 h-3" /> {contact.email}
                      </a>
                    )}
                    {contact.linkedin && (
                      <a href={`https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600">
                        <Link2 className="w-3 h-3" /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
                {contact.email && (
                  <a href={`mailto:${contact.email}?subject=Thank you - ${app.role_title} interview&body=Hi ${contact.name.split(' ')[0]},%0D%0A%0D%0AThank you for taking the time to speak with me about the ${app.role_title} role at ${app.company_name}.`}>
                    <Button variant="ghost" size="sm">Send Thank You</Button>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Notes */}
      {activeTab === 'Notes' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              {savingNotes ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</> : <><Save className="w-3 h-3" /> Auto-saved</>}
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            placeholder="Add your notes here..."
          />
        </Card>
      )}

      {/* AI Prep */}
      {activeTab === 'AI Prep' && (
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="text-center py-8 space-y-4">
            <Bot className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-semibold font-[family-name:var(--font-heading)] text-slate-900">
              AI Interview Prep for {app.company_name}
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Practice interview questions tailored for the {app.role_title} role at {app.company_name}.
            </p>
            <Link href={`/coach?appId=${id}&company=${encodeURIComponent(app.company_name)}&role=${encodeURIComponent(app.role_title)}&autostart=1`}>
              <Button size="lg">
                <Bot className="w-5 h-5" /> Start Coaching Session
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Add Round Modal */}
      <Modal open={showAddRound} onClose={() => setShowAddRound(false)} title="Add Interview Round" size="md">
        <div className="p-6 space-y-4">
          <Input id="roundName" label="Round Name" placeholder="e.g. Technical Interview" value={roundName} onChange={(e) => setRoundName(e.target.value)} />
          <Input id="roundDate" label="Date" type="date" value={roundDate} onChange={(e) => setRoundDate(e.target.value)} />
          <Input id="roundInterviewer" label="Interviewer (optional)" placeholder="e.g. Jane Smith" value={roundInterviewer} onChange={(e) => setRoundInterviewer(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <select value={roundType} onChange={(e) => setRoundType(e.target.value as InterviewType)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                {['phone_screen','technical','system_design','behavioral','case_study','final'].map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Format</label>
              <select value={roundFormat} onChange={(e) => setRoundFormat(e.target.value as InterviewFormat)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                {['video','phone','onsite','take_home'].map((f) => (
                  <option key={f} value={f}>{f.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddRound(false)}><X className="w-4 h-4" /> Cancel</Button>
            <Button onClick={handleAddRound} disabled={!roundName}><Save className="w-4 h-4" /> Add Round</Button>
          </div>
        </div>
      </Modal>

      {/* Add Contact Modal */}
      <Modal open={showAddContact} onClose={() => setShowAddContact(false)} title="Add Contact" size="md">
        <div className="p-6 space-y-4">
          <Input id="contactName" label="Name" placeholder="Jane Smith" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <Input id="contactTitle" label="Title" placeholder="Recruiter" value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} />
          <Input id="contactEmail" label="Email" type="email" placeholder="jane@company.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          <Input id="contactLinkedin" label="LinkedIn" placeholder="linkedin.com/in/jane" value={contactLinkedin} onChange={(e) => setContactLinkedin(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddContact(false)}><X className="w-4 h-4" /> Cancel</Button>
            <Button onClick={handleAddContact} disabled={!contactName}><Save className="w-4 h-4" /> Add Contact</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
