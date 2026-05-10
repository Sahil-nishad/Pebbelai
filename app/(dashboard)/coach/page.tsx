'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ElementType } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Send, Plus, Brain, Code, BarChart3, DollarSign, Target,
  HelpCircle, Clock, Trash2, Sparkles, ArrowRight, Briefcase,
  Download, FileText, Loader2, History, X,
} from 'lucide-react'
import { authFetch } from '@/lib/api'
import toast from 'react-hot-toast'

type SessionType = 'behavioral' | 'technical' | 'case' | 'salary' | 'general'
interface Message { role: 'user' | 'assistant'; content: string }
interface SessionRecord { id: string; company: string; role: string; session_type: string; created_at: string }

const sessionTypes: { type: SessionType; icon: ElementType; label: string; desc: string }[] = [
  { type: 'behavioral', icon: Brain,      label: 'Behavioral',         desc: 'Soft skills, leadership & STAR method' },
  { type: 'technical',  icon: Code,       label: 'Technical',          desc: 'Logic, systems & craft challenges' },
  { type: 'case',       icon: BarChart3,  label: 'Case Study',         desc: 'Structured problem solving' },
  { type: 'salary',     icon: DollarSign, label: 'Salary Negotiation', desc: 'Advocate for your worth' },
  { type: 'general',    icon: Target,     label: 'General Prep',       desc: 'Comprehensive interview prep' },
]

const typeColor: Record<SessionType, string> = {
  behavioral: 'text-violet-700 bg-violet-50',
  technical:  'text-blue-700 bg-blue-50',
  case:       'text-amber-700 bg-amber-50',
  salary:     'text-emerald-700 bg-emerald-50',
  general:    'text-slate-600 bg-slate-100',
}

function formatMessage(text: string) {
  const esc = (v: string) => v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
  const bolded = esc(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  const lines = bolded.split(/\r?\n/)
  const parts: string[] = []
  let inList = false
  const closeList = () => { if (inList) { parts.push('</ul>'); inList = false } }
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) { closeList(); continue }
    const m = line.match(/^[-•*]\s+(.*)$/)
    if (m) { if (!inList) { parts.push('<ul class="ml-5 list-disc space-y-1">'); inList = true } parts.push(`<li>${m[1]}</li>`); continue }
    closeList(); parts.push(`<p>${line}</p>`)
  }
  closeList(); return parts.join('')
}

export default function CoachPage() {
  const searchParams = useSearchParams()

  const [hasSession, setHasSession]     = useState(false)
  const [company, setCompany]           = useState('')
  const [role, setRole]                 = useState('')
  const [selectedType, setSelectedType] = useState<SessionType | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [input, setInput]               = useState('')
  const [isTyping, setIsTyping]         = useState(false)
  const [sessionId, setSessionId]       = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [sessions, setSessions]         = useState<SessionRecord[]>([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [jobDescription, setJobDescription] = useState('')
  const [appContext, setAppContext]     = useState<{ company: string; role: string } | null>(null)
  const [autoStartPending, setAutoStartPending] = useState(false)
  const [generatingQA, setGeneratingQA] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    authFetch('/api/coach/sessions').then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d) }).catch(() => {})
  }, [])

  // ── Read URL params set by application detail page ────────────────────────
  useEffect(() => {
    const c       = searchParams.get('company')
    const r       = searchParams.get('role')
    const appId   = searchParams.get('appId')
    const autostart = searchParams.get('autostart')

    if (c) setCompany(c)
    if (r) setRole(r)

    if (appId) {
      // Fetch the full application to get job description + confirm context
      authFetch(`/api/applications/${appId}`)
        .then(res => res.json())
        .then(data => {
          if (data.job_description) setJobDescription(data.job_description)
          if (data.company_name && data.role_title) {
            setAppContext({ company: data.company_name, role: data.role_title })
          }
          if (autostart === '1') {
            setSelectedType('general')
            setAutoStartPending(true)
          }
        })
        .catch(() => {
          // If fetch fails, still try to autostart with what we have
          if (autostart === '1' && c) {
            setSelectedType('general')
            setAutoStartPending(true)
          }
        })
    } else if (autostart === '1' && c) {
      setSelectedType('general')
      setAutoStartPending(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (hasSession) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsedSeconds(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [hasSession])

  // ── Auto-start when all context is ready ─────────────────────────────────
  useEffect(() => {
    if (autoStartPending && company && selectedType && !hasSession && !isTyping) {
      setAutoStartPending(false)
      startSession()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartPending, company, selectedType])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const resetComposer = () => {
    setHasSession(false); setMessages([]); setSessionId(null)
    setQuestionCount(0); setInput(''); setCompany(''); setRole(''); setSelectedType(null); setElapsedSeconds(0)
  }

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this coaching session?')) return
    try {
      const res = await authFetch(`/api/coach/sessions/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setSessions(prev => prev.filter(s => s.id !== id))
      if (sessionId === id) resetComposer()
      toast.success('Session deleted')
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const startSession = async () => {
    if (!company || !selectedType) return
    setIsTyping(true)
    try {
      const res = await authFetch('/api/coach/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company, role, sessionType: selectedType, jobDescription: jobDescription || undefined }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to start session')
      setSessionId(data.session.id); setHasSession(true)
      setMessages([{ role: 'assistant', content: data.introMessage }])
      setSessions(prev => [data.session, ...prev])
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to start session') }
    finally { setIsTyping(false) }
  }

  const sendMessage = async (override?: string) => {
    const text = override ?? input
    if (!text.trim() || !sessionId) return
    setMessages(prev => [...prev, { role: 'user', content: text }]); setInput(''); setIsTyping(true)
    try {
      const res = await authFetch('/api/coach/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, message: text }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      setQuestionCount(q => q + 1)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to get AI response') }
    finally { setIsTyping(false) }
  }

  const loadSession = async (session: SessionRecord) => {
    try {
      const res = await authFetch(`/api/coach/sessions/${session.id}`)
      if (!res.ok) return
      const data = await res.json()
      setCompany(session.company); setRole(session.role); setSelectedType(session.session_type as SessionType); setSessionId(session.id)
      const msgs = (data.messages || []).filter((m: { role: string }) => m.role !== 'system').map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      setMessages(msgs); setHasSession(true)
    } catch { toast.error('Failed to load session') }
  }

  const handleDownloadSession = async () => {
    const { downloadSessionPdf } = await import('@/lib/coachPdf')
    const ok = downloadSessionPdf(messages, {
      company: company,
      role: role,
      sessionType: selectedType || 'general',
    })
    if (!ok) toast.error('No Q&A pairs to export yet. Answer at least one question first.')
    else toast.success('Session PDF downloaded!')
  }

  const handleDownloadSectorQA = async () => {
    if (!selectedType) { toast.error('Select a focus area first.'); return }
    setGeneratingQA(true)
    try {
      const res = await authFetch('/api/coach/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role, sessionType: selectedType }),
      })
      const data = await res.json()
      if (!res.ok || !data.questions?.length) throw new Error(data.error || 'Failed')

      const { downloadQAPdf } = await import('@/lib/coachPdf')
      const sectorLabel = sessionTypes.find(s => s.type === selectedType)?.label || selectedType
      downloadQAPdf(data.questions, {
        title:    `${sectorLabel} Interview — 10 Questions & Answers`,
        subtitle: `${company ? `${company} · ` : ''}${role ? `${role} · ` : ''}Practice Guide`,
        filename: `pebelai-${selectedType}-questions.pdf`,
      })
      toast.success('Questions PDF downloaded!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate questions')
    } finally {
      setGeneratingQA(false)
    }
  }

  return (
    <div className={`-m-4 md:-mx-6 md:-mb-8 lg:-mx-8 lg:-mb-8 animate-fade-up ${hasSession ? 'h-[calc(100vh-8.5rem)] md:h-[calc(100vh-0.5rem)] lg:h-[calc(100vh-2rem)] overflow-hidden flex flex-col' : 'min-h-[calc(100vh-4rem)]'}`}>

      {/* ── History Drawer ── */}
      {historyOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/10 md:left-[244px] md:top-0 top-16" onClick={() => setHistoryOpen(false)} />
          <div className="fixed right-0 top-16 md:top-0 bottom-0 z-50 w-80 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-stone-400">History</h2>
                <span className="text-[10px] bg-stone-200 px-2 py-0.5 rounded-full font-bold text-stone-500">{sessions.length}</span>
              </div>
              <button onClick={() => setHistoryOpen(false)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
              {sessions.length === 0 && <p className="text-center text-xs text-stone-400 py-10">No sessions yet</p>}
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`group p-4 bg-white rounded-2xl hover:shadow-md transition-all duration-200 cursor-pointer border-2 ${sessionId === session.id ? 'border-emerald-600' : 'border-stone-100 hover:border-emerald-100'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${typeColor[session.session_type as SessionType] || 'text-slate-600 bg-slate-100'}`}>
                      {session.session_type}
                    </span>
                    <button onClick={e => { e.stopPropagation(); deleteSession(session.id) }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 text-stone-300 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => { loadSession(session); setHistoryOpen(false) }} className="w-full text-left">
                    <p className="font-bold text-sm text-stone-800 group-hover:text-emerald-900 transition-colors">{session.company}</p>
                    <p className="text-xs text-stone-500 truncate mt-0.5">{session.role}</p>
                    <p className="text-[10px] text-stone-400 mt-2.5">{new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Main Area ── */}
      <main className="flex-1 flex flex-col bg-[#f8f9fa] overflow-hidden min-w-0">
        {!hasSession ? (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8">

              {/* Hero */}
              <div className="text-center mb-8">
                <h2 className="text-[2.6rem] sm:text-5xl font-black tracking-[-0.03em] text-slate-950 mb-3 leading-none">
                  AI Coach
                </h2>
                <p className="text-slate-500 text-[15px] max-w-md mx-auto leading-relaxed font-medium">
                  Simulates a high-fidelity interview experience tailored to your target role.
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm ring-1 ring-black/5">

                {/* Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 mb-7">
                  {[
                    { label: 'Company', value: company, setter: setCompany, placeholder: 'e.g. Stripe' },
                    { label: 'Role Title', value: role, setter: setRole, placeholder: 'e.g. Senior Designer' },
                  ].map(({ label, value, setter, placeholder }) => (
                    <div key={label}>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-2.5">{label}</label>
                      <input
                        value={value}
                        onChange={e => setter(e.target.value)}
                        placeholder={placeholder}
                        className="w-full border-b-2 border-slate-200 focus:border-emerald-600 bg-transparent pb-2.5 text-[18px] font-semibold text-slate-900 placeholder:text-slate-300 transition-colors focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Session Type */}
                <div className="mb-6">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-3.5">Select Focus Area</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {sessionTypes.map(st => (
                      <button
                        key={st.type}
                        type="button"
                        onClick={() => setSelectedType(st.type)}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
                          selectedType === st.type
                            ? 'border-emerald-600 bg-white shadow-md'
                            : 'border-transparent bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 ${typeColor[st.type]}`}>
                          <st.icon className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-[12px] text-slate-800 leading-tight">{st.label}</div>
                        <div className="text-[10px] text-slate-400 mt-1 leading-tight hidden sm:block">{st.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Application context banner */}
                {appContext && (
                  <div className="flex items-center gap-2.5 p-3 bg-[#0A6A47]/8 rounded-xl border border-[#0A6A47]/20 mb-4">
                    <Briefcase className="w-3.5 h-3.5 text-[#0A6A47] flex-shrink-0" />
                    <p className="text-[11px] text-[#0A6A47] leading-relaxed font-medium">
                      Loaded from your application — <strong>{appContext.role}</strong> at <strong>{appContext.company}</strong>.
                      {jobDescription ? ' Job description included for tailored questions.' : ''}
                    </p>
                  </div>
                )}

                {/* Curator Insight — compact */}
                {(company || selectedType) && (
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-50/80 rounded-xl border border-emerald-100 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                    <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                      {company && selectedType
                        ? `${sessionTypes.find(s => s.type === selectedType)?.label} session${role ? ` for ${role}` : ''} at ${company} — tailored to company culture & hiring patterns.`
                        : 'Enter a company and select a focus area for AI-curated insights.'}
                    </p>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={startSession}
                  disabled={!company || !selectedType || isTyping}
                  className={`w-full py-3.5 rounded-xl font-bold tracking-widest text-sm uppercase flex items-center justify-center gap-3 transition-all duration-200 ${
                    company && selectedType && !isTyping
                      ? 'bg-gradient-to-r from-[#005344] to-[#006d5b] text-white shadow-sm hover:opacity-90 active:scale-[0.99] cursor-pointer'
                      : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                  }`}
                >
                  {isTyping || autoStartPending ? 'Initializing…' : 'Initialize Session'}
                  {!isTyping && !autoStartPending && <ArrowRight className="w-4 h-4" />}
                </button>

                {/* Download 10 Q&A PDF */}
                {selectedType && (
                  <button
                    onClick={handleDownloadSectorQA}
                    disabled={generatingQA}
                    className="w-full mt-3 py-2.5 rounded-xl border-2 border-dashed border-stone-200 text-stone-500 text-[13px] font-semibold flex items-center justify-center gap-2 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {generatingQA
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
                      : <><FileText className="w-4 h-4" /> Download 10 {sessionTypes.find(s => s.type === selectedType)?.label} Q&amp;A as PDF</>
                    }
                  </button>
                )}
              </div>

              {/* Past Sessions — below form card */}
              {sessions.length > 0 && (
                <div className="mt-6 mb-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black uppercase tracking-widest text-stone-400">Past Sessions</span>
                    <button
                      onClick={() => setHistoryOpen(true)}
                      className="text-[12px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      View all ({sessions.length})
                    </button>
                  </div>
                  <div className="space-y-2">
                    {sessions.slice(0, 3).map(session => (
                      <button
                        key={session.id}
                        onClick={() => loadSession(session)}
                        className="w-full flex items-center gap-3 p-3.5 bg-white rounded-xl border border-stone-100 hover:border-emerald-200 hover:shadow-sm transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-sm font-black text-stone-600 flex-shrink-0">
                          {session.company.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-stone-800 group-hover:text-emerald-900 transition-colors truncate">{session.company}</p>
                          <p className="text-xs text-stone-400 truncate">{session.role || 'No role specified'}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${typeColor[session.session_type as SessionType] || 'text-slate-600 bg-slate-100'}`}>
                            {session.session_type}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Chat ── */
          <div className="flex flex-1 flex-col min-h-0">
            {/* Chat header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-sm font-black text-emerald-800 flex-shrink-0">{company.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">{company}</p>
                  <p className="text-xs text-stone-400 truncate">{role}</p>
                </div>
                {selectedType && (
                  <span className={`hidden sm:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${typeColor[selectedType]}`}>{selectedType}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 bg-stone-50 px-3 py-1.5 rounded-full">
                  <Clock className="w-3 h-3" />{formatTime(elapsedSeconds)}
                </span>
                <button onClick={() => deleteSession(sessionId || '')} disabled={!sessionId} className="p-2 rounded-xl hover:bg-red-50 hover:text-red-500 text-stone-300 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownloadSession}
                  title="Download session as PDF"
                  className="p-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 text-stone-400 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors relative"
                  title="History"
                >
                  <History className="w-4 h-4" />
                  {sessions.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />}
                </button>
                <button onClick={resetComposer} className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold transition-colors">End</button>
                <button onClick={resetComposer} className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#005344] to-[#006d5b] text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f8f9fa]">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="mr-2.5 mt-1 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                      <Image src="/pebelai-mark.svg" alt="PebelAI" width={18} height={18} />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-br from-[#005344] to-[#006d5b] text-white' : 'bg-white border border-stone-100 text-stone-800 shadow-sm'}`}>
                    <div className="whitespace-normal select-text cursor-text [&_p]:m-0 [&_p+p]:mt-2 [&_ul]:m-0 [&_ul]:pl-5 [&_ul]:space-y-1" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                    <Image src="/pebelai-mark.svg" alt="PebelAI" width={18} height={18} />
                  </div>
                  <div className="bg-white border border-stone-100 rounded-2xl px-4 py-3 flex gap-1 shadow-sm">
                    {[0,150,300].map(d => <div key={d} className="h-2 w-2 animate-bounce rounded-full bg-stone-300" style={{ animationDelay:`${d}ms` }} />)}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="bg-white border-t border-stone-100 px-4 pt-3 pb-4 flex-shrink-0">
              <div className="flex gap-2 mb-2.5">
                {[
                  { icon: HelpCircle, label: "I'm not sure", msg: "I'm not sure how to answer this. Can you give me a hint?" },
                  { icon: ArrowRight, label: 'Skip',        msg: 'Please skip this question and move to the next one.' },
                ].map(({ icon: Icon, label, msg }) => (
                  <button key={label} onClick={() => sendMessage(msg)} disabled={isTyping} className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-[#f8f9fa] px-3 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 disabled:opacity-40 transition-colors cursor-pointer">
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2.5">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Type your answer... (Shift+Enter for new line)"
                  rows={3}
                  disabled={isTyping}
                  className="flex-1 resize-none rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/10 disabled:opacity-60 bg-[#f8f9fa]"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="self-end px-4 py-3 rounded-2xl bg-gradient-to-br from-[#005344] to-[#006d5b] text-white hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
