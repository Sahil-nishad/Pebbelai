'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ElementType } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Plus, Brain, Code, BarChart3, DollarSign, Target,
  HelpCircle, Clock, Trash2, Sparkles, ArrowRight, Briefcase,
  Download, FileText, Loader2, History, X, Mic, MessageSquare,
  ChevronRight, Zap, BookOpen, GraduationCap, Briefcase as BriefcaseIcon,
  Star, Users,
} from 'lucide-react'
import { authFetch } from '@/lib/api'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

const VoiceInterview = dynamic(() => import('@/components/coach/VoiceInterview'), { ssr: false })

type SessionType = 'behavioral' | 'technical' | 'case' | 'salary' | 'general'
type ExperienceLevel = 'fresher' | 'professional' | 'experienced'
interface Message { role: 'user' | 'assistant'; content: string }
interface SessionRecord { id: string; company: string; role: string; session_type: string; created_at: string }

const sessionTypes: { type: SessionType; icon: ElementType; label: string; desc: string; color: string; bg: string }[] = [
  { type: 'behavioral', icon: Brain,      label: 'Behavioral',    desc: 'Soft skills & STAR method',    color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
  { type: 'technical',  icon: Code,       label: 'Technical',     desc: 'Logic & system design',        color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100' },
  { type: 'case',       icon: BarChart3,  label: 'Case Study',    desc: 'Structured problem solving',   color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100' },
  { type: 'salary',     icon: DollarSign, label: 'Salary Nego',   desc: 'Advocate for your worth',      color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-100' },
  { type: 'general',    icon: Target,     label: 'General Prep',  desc: 'Comprehensive prep',           color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-100' },
]

const experienceLevels: { level: ExperienceLevel; icon: ElementType; label: string; desc: string }[] = [
  { level: 'fresher',      icon: GraduationCap, label: 'Fresher',      desc: '0–1 years' },
  { level: 'professional', icon: BriefcaseIcon, label: 'Professional', desc: '1–5 years' },
  { level: 'experienced',  icon: Star,          label: 'Experienced',  desc: '5+ years' },
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

  // Session state
  const [hasSession, setHasSession]     = useState(false)
  const [company, setCompany]           = useState('')
  const [role, setRole]                 = useState('')
  const [selectedType, setSelectedType] = useState<SessionType | null>(null)
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('professional')
  const [messages, setMessages]         = useState<Message[]>([])
  const [input, setInput]               = useState('')
  const [isTyping, setIsTyping]         = useState(false)
  const [sessionId, setSessionId]       = useState<string | null>(null)
  const [sessions, setSessions]         = useState<SessionRecord[]>([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [jobDescription, setJobDescription] = useState('')
  const [appContext, setAppContext]     = useState<{ company: string; role: string } | null>(null)
  const [autoStartPending, setAutoStartPending] = useState(false)
  const [generatingQA, setGeneratingQA] = useState(false)
  const [historyOpen, setHistoryOpen]   = useState(false)
  const [voiceModeActive, setVoiceModeActive] = useState(false)
  const [activeMode, setActiveMode]     = useState<'text' | 'voice' | 'pdf' | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    authFetch('/api/coach/sessions').then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d) }).catch(() => {})
  }, [])

  useEffect(() => {
    const c = searchParams.get('company')
    const r = searchParams.get('role')
    const appId = searchParams.get('appId')
    const autostart = searchParams.get('autostart')
    if (c) setCompany(c)
    if (r) setRole(r)
    if (appId) {
      authFetch(`/api/applications/${appId}`).then(res => res.json()).then(data => {
        if (data.job_description) setJobDescription(data.job_description)
        if (data.company_name && data.role_title) setAppContext({ company: data.company_name, role: data.role_title })
        if (autostart === '1') { setSelectedType('general'); setAutoStartPending(true) }
      }).catch(() => { if (autostart === '1' && c) { setSelectedType('general'); setAutoStartPending(true) } })
    } else if (autostart === '1' && c) { setSelectedType('general'); setAutoStartPending(true) }
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
    setInput(''); setCompany(''); setRole(''); setSelectedType(null)
    setElapsedSeconds(0); setActiveMode(null)
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
      const res = await authFetch('/api/coach/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role, sessionType: selectedType, jobDescription: jobDescription || undefined }),
      })
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
      const res = await authFetch('/api/coach/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to get AI response') }
    finally { setIsTyping(false) }
  }

  const loadSession = async (session: SessionRecord) => {
    try {
      const res = await authFetch(`/api/coach/sessions/${session.id}`)
      if (!res.ok) return
      const data = await res.json()
      setCompany(session.company); setRole(session.role)
      setSelectedType(session.session_type as SessionType); setSessionId(session.id)
      const msgs = (data.messages || []).filter((m: { role: string }) => m.role !== 'system')
        .map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      setMessages(msgs); setHasSession(true)
    } catch { toast.error('Failed to load session') }
  }

  const handleDownloadSession = async () => {
    const { downloadSessionPdf } = await import('@/lib/coachPdf')
    const ok = downloadSessionPdf(messages, { company, role, sessionType: selectedType || 'general' })
    if (!ok) toast.error('No Q&A pairs to export yet.')
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
        title: `${sectorLabel} Interview — 10 Questions & Answers`,
        subtitle: `${company ? `${company} · ` : ''}${role ? `${role} · ` : ''}Practice Guide`,
        filename: `pebelai-${selectedType}-questions.pdf`,
      })
      toast.success('Questions PDF downloaded!')
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to generate questions') }
    finally { setGeneratingQA(false) }
  }

  const canStart = company.trim() && selectedType


  // ── Setup screen (before session starts) ─────────────────────────────────
  const SetupScreen = () => (
    <div className="flex-1 overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 h-full flex flex-col justify-center">

        {/* Hero — compact */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              AI Interview Coach
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Tailored mock interviews for your target role</p>
          </div>
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 text-sm font-semibold hover:border-[#0A6A47]/40 hover:text-[#0A6A47] transition-all"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
            {sessions.length > 0 && (
              <span className="bg-[#0A6A47] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{sessions.length}</span>
            )}
          </button>
        </div>

        {/* Main setup card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-3">

          {/* Company + Role inputs */}
          <div className="p-4 sm:p-5 border-b border-slate-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5">Company</label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="e.g. Google, TCS, Infosys"
                  className="w-full border-b-2 border-slate-200 focus:border-[#0A6A47] bg-transparent pb-1.5 text-[16px] font-semibold text-slate-900 placeholder:text-slate-300 transition-colors focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5">Role Title</label>
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer, PM"
                  className="w-full border-b-2 border-slate-200 focus:border-[#0A6A47] bg-transparent pb-1.5 text-[16px] font-semibold text-slate-900 placeholder:text-slate-300 transition-colors focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Experience Level */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-50">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2.5">Experience Level</label>
            <div className="flex gap-2">
              {experienceLevels.map(({ level, icon: Icon, label, desc }) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExperienceLevel(level)}
                  className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left ${
                    experienceLevel === level
                      ? 'border-[#0A6A47] bg-[#0A6A47]/5'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    experienceLevel === level ? 'bg-[#0A6A47] text-white' : 'bg-white text-slate-400 border border-slate-200'
                  }`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div>
                    <div className={`text-[11px] font-bold ${experienceLevel === level ? 'text-[#0A6A47]' : 'text-slate-700'}`}>{label}</div>
                    <div className="text-[9px] text-slate-400">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Focus Area */}
          <div className="px-4 sm:px-5 py-3.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2.5">Focus Area</label>
            <div className="grid grid-cols-5 gap-2">
              {sessionTypes.map(st => (
                <button
                  key={st.type}
                  type="button"
                  onClick={() => setSelectedType(st.type)}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all duration-150 ${
                    selectedType === st.type
                      ? 'border-[#0A6A47] bg-[#0A6A47]/5 shadow-sm'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1.5 ${st.bg} border`}>
                    <st.icon className={`w-3 h-3 ${st.color}`} />
                  </div>
                  <div className={`font-bold text-[10px] leading-tight ${selectedType === st.type ? 'text-[#0A6A47]' : 'text-slate-700'}`}>{st.label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-tight hidden sm:block">{st.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* App context banner */}
        {appContext && (
          <div className="flex items-center gap-2 p-3 bg-[#0A6A47]/8 rounded-xl border border-[#0A6A47]/15 mb-2">
            <Briefcase className="w-3.5 h-3.5 text-[#0A6A47] flex-shrink-0" />
            <p className="text-[11px] text-[#0A6A47] font-medium">
              Loaded from your application — <strong>{appContext.role}</strong> at <strong>{appContext.company}</strong>.
              {jobDescription ? ' Job description included.' : ''}
            </p>
          </div>
        )}

        {/* AI insight */}
        {canStart && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-3"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              <strong>{sessionTypes.find(s => s.type === selectedType)?.label}</strong> interview
              {role ? ` for ${role}` : ''} at <strong>{company}</strong> — tailored to {experienceLevel} level.
            </p>
          </motion.div>
        )}

        {/* Three action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Text Interview */}
          <button
            onClick={() => { if (!canStart) { toast.error('Enter company and select focus area first'); return }; startSession(); setActiveMode('text') }}
            disabled={isTyping || autoStartPending}
            className={`group relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
              canStart
                ? 'border-[#0A6A47] bg-[#0A6A47] hover:bg-[#085c3d] cursor-pointer shadow-lg shadow-[#0A6A47]/20'
                : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              {isTyping || autoStartPending
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <MessageSquare className="w-5 h-5 text-white" />
              }
            </div>
            <div className="font-bold text-[15px] text-white mb-1">Text Interview</div>
            <div className="text-[12px] text-white/70 leading-relaxed">Chat-based mock interview with real-time AI feedback</div>
            <ArrowRight className="w-4 h-4 text-white/60 mt-3 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Voice Interview */}
          <button
            onClick={() => { if (!canStart) { toast.error('Enter company and select focus area first'); return }; setVoiceModeActive(true); setActiveMode('voice') }}
            disabled={!canStart}
            className={`group relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
              canStart
                ? 'border-[#0A6A47]/30 bg-white hover:border-[#0A6A47] hover:shadow-md cursor-pointer'
                : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${canStart ? 'bg-[#0A6A47]/10' : 'bg-slate-100'}`}>
              <Mic className={`w-5 h-5 ${canStart ? 'text-[#0A6A47]' : 'text-slate-400'}`} />
            </div>
            <div className="font-bold text-[15px] text-slate-900 mb-1">Voice Interview</div>
            <div className="text-[12px] text-slate-500 leading-relaxed">Speak your answers — AI listens, responds & coaches</div>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-[10px] font-bold text-[#0A6A47] bg-[#0A6A47]/10 px-2 py-0.5 rounded-full">Free</span>
              <span className="text-[10px] text-slate-400">Web Speech API</span>
            </div>
          </button>

          {/* Practice PDF */}
          <button
            onClick={() => { if (!canStart) { toast.error('Enter company and select focus area first'); return }; handleDownloadSectorQA(); setActiveMode('pdf') }}
            disabled={generatingQA || !canStart}
            className={`group relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
              canStart
                ? 'border-slate-200 bg-white hover:border-[#0A6A47]/40 hover:shadow-md cursor-pointer'
                : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              {generatingQA
                ? <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                : <FileText className="w-5 h-5 text-slate-500" />
              }
            </div>
            <div className="font-bold text-[15px] text-slate-900 mb-1">Practice PDF</div>
            <div className="text-[12px] text-slate-500 leading-relaxed">Download 10 tailored Q&A pairs to study offline</div>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {generatingQA ? 'Generating…' : '10 Questions'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )


  return (
    <div className={`-m-4 md:-mx-6 md:-mb-8 lg:-mx-8 lg:-mb-8 ${hasSession ? 'h-[calc(100vh-8.5rem)] md:h-[calc(100vh-0.5rem)] lg:h-[calc(100vh-2rem)] overflow-hidden flex flex-col' : 'h-[calc(100vh-8.5rem)] md:h-[calc(100vh-0.5rem)] lg:h-[calc(100vh-2rem)] overflow-hidden flex flex-col'}`}>

      {/* ── Voice Interview Portal ── */}
      <AnimatePresence>
        {voiceModeActive && (
          <VoiceInterview
            company={company}
            role={role}
            sessionType={selectedType || 'General'}
            onClose={() => setVoiceModeActive(false)}
          />
        )}
      </AnimatePresence>

      {/* ── History Drawer ── */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 md:left-[244px] md:top-0 top-16"
              onClick={() => setHistoryOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed right-0 top-16 md:top-0 bottom-0 z-50 w-80 bg-white shadow-2xl flex flex-col border-l border-slate-100"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#0A6A47]" />
                  <h2 className="text-sm font-bold text-slate-800">Session History</h2>
                  <span className="text-[10px] bg-[#0A6A47]/10 text-[#0A6A47] px-2 py-0.5 rounded-full font-bold">{sessions.length}</span>
                </div>
                <button onClick={() => setHistoryOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {sessions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                      <MessageSquare className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400">No sessions yet</p>
                  </div>
                )}
                {sessions.map(session => (
                  <div key={session.id} className={`group p-3.5 rounded-xl border transition-all cursor-pointer ${sessionId === session.id ? 'border-[#0A6A47] bg-[#0A6A47]/5' : 'border-slate-100 hover:border-[#0A6A47]/30 hover:bg-slate-50'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${typeColor[session.session_type as SessionType] || 'text-slate-600 bg-slate-100'}`}>
                        {session.session_type}
                      </span>
                      <button onClick={e => { e.stopPropagation(); deleteSession(session.id) }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 text-slate-300 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => { loadSession(session); setHistoryOpen(false) }} className="w-full text-left">
                      <p className="font-bold text-sm text-slate-800">{session.company}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{session.role || 'No role'}</p>
                      <p className="text-[10px] text-slate-300 mt-2">{new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* ── Main ── */}
      <main className="flex-1 flex flex-col bg-[#f8f9fa] overflow-hidden min-w-0">
        {!hasSession ? (

          /* ══════════════════════════════════════════
             SETUP PAGE
          ══════════════════════════════════════════ */
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Interview Coach</h1>
                  <p className="text-slate-500 text-sm mt-0.5">Practice with AI tailored to your target role</p>
                </div>
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:border-[#0A6A47]/40 hover:text-[#0A6A47] transition-all"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                  {sessions.length > 0 && <span className="bg-[#0A6A47] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{sessions.length}</span>}
                </button>
              </div>

              {/* ── Step 1: Target Role ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 mb-4">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#0A6A47] text-white text-xs font-black flex items-center justify-center">1</div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Target Role</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Company</label>
                    <input
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="e.g. Google, TCS, Infosys"
                      className="w-full border-b-2 border-slate-200 focus:border-[#0A6A47] bg-transparent pb-2 text-[17px] font-semibold text-slate-900 placeholder:text-slate-300 transition-colors focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Role Title</label>
                    <input
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      placeholder="e.g. Software Engineer, PM"
                      className="w-full border-b-2 border-slate-200 focus:border-[#0A6A47] bg-transparent pb-2 text-[17px] font-semibold text-slate-900 placeholder:text-slate-300 transition-colors focus:outline-none"
                    />
                  </div>
                </div>

                {/* App context banner */}
                {appContext && (
                  <div className="flex items-center gap-2.5 mt-4 p-3 bg-[#0A6A47]/8 rounded-xl border border-[#0A6A47]/20">
                    <Briefcase className="w-3.5 h-3.5 text-[#0A6A47] flex-shrink-0" />
                    <p className="text-[11px] text-[#0A6A47] font-medium">
                      Loaded from your application — <strong>{appContext.role}</strong> at <strong>{appContext.company}</strong>.
                      {jobDescription ? ' Job description included.' : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Step 2: Experience Level ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 mb-4">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#0A6A47] text-white text-xs font-black flex items-center justify-center">2</div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Experience Level</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {experienceLevels.map(({ level, icon: Icon, label, desc }) => (
                    <button
                      key={level}
                      onClick={() => setExperienceLevel(level)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        experienceLevel === level
                          ? 'border-[#0A6A47] bg-[#0A6A47]/5 shadow-sm'
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${experienceLevel === level ? 'text-[#0A6A47]' : 'text-slate-400'}`} />
                      <div className={`font-bold text-sm ${experienceLevel === level ? 'text-[#0A6A47]' : 'text-slate-700'}`}>{label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Step 3: Focus Area ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 mb-4">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#0A6A47] text-white text-xs font-black flex items-center justify-center">3</div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Focus Area</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {sessionTypes.map(st => (
                    <button
                      key={st.type}
                      onClick={() => setSelectedType(st.type)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        selectedType === st.type
                          ? 'border-[#0A6A47] bg-[#0A6A47]/5 shadow-sm'
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${st.bg} border`}>
                        <st.icon className={`w-4 h-4 ${st.color}`} />
                      </div>
                      <div className={`font-bold text-[12px] leading-tight ${selectedType === st.type ? 'text-[#0A6A47]' : 'text-slate-800'}`}>{st.label}</div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-tight hidden sm:block">{st.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Insight pill */}
                {canStart && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-4 p-3 bg-[#0A6A47]/8 rounded-xl border border-[#0A6A47]/15"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#0A6A47] flex-shrink-0" />
                    <p className="text-[11px] text-[#0A6A47] font-medium">
                      {sessionTypes.find(s => s.type === selectedType)?.label} session{role ? ` for ${role}` : ''}{company ? ` at ${company}` : ''} — tailored to company culture & hiring patterns.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* ── Step 4: Choose Mode ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 mb-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#0A6A47] text-white text-xs font-black flex items-center justify-center">4</div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Choose Your Mode</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                  {/* Text Interview */}
                  <button
                    onClick={() => { if (!canStart) { toast.error('Fill in company and select a focus area first'); return }; startSession() }}
                    disabled={isTyping || autoStartPending}
                    className={`group relative p-5 rounded-2xl border-2 text-left transition-all ${
                      canStart && !isTyping
                        ? 'border-[#0A6A47] bg-gradient-to-br from-[#0A6A47] to-[#085c3d] text-white shadow-lg shadow-[#0A6A47]/20 hover:shadow-xl hover:shadow-[#0A6A47]/30 hover:-translate-y-0.5'
                        : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${canStart && !isTyping ? 'bg-white/20' : 'bg-slate-100'}`}>
                      {isTyping || autoStartPending
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <MessageSquare className={`w-5 h-5 ${canStart ? 'text-white' : 'text-slate-400'}`} />
                      }
                    </div>
                    <div className={`font-bold text-base mb-1 ${canStart && !isTyping ? 'text-white' : 'text-slate-500'}`}>
                      {isTyping || autoStartPending ? 'Starting…' : 'Text Interview'}
                    </div>
                    <div className={`text-[12px] leading-relaxed ${canStart && !isTyping ? 'text-white/70' : 'text-slate-400'}`}>
                      Chat-based interview with AI feedback on every answer
                    </div>
                    {canStart && !isTyping && (
                      <div className="absolute top-4 right-4">
                        <ArrowRight className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                  </button>

                  {/* Voice Interview */}
                  <button
                    onClick={() => { if (!canStart) { toast.error('Fill in company and select a focus area first'); return }; setVoiceModeActive(true) }}
                    className={`group relative p-5 rounded-2xl border-2 text-left transition-all ${
                      canStart
                        ? 'border-slate-200 bg-white hover:border-[#0A6A47]/40 hover:bg-[#0A6A47]/5 hover:-translate-y-0.5 hover:shadow-md'
                        : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${canStart ? 'bg-[#0A6A47]/10' : 'bg-slate-100'}`}>
                      <Mic className={`w-5 h-5 ${canStart ? 'text-[#0A6A47]' : 'text-slate-300'}`} />
                    </div>
                    <div className={`font-bold text-base mb-1 ${canStart ? 'text-slate-800' : 'text-slate-400'}`}>Voice Interview</div>
                    <div className={`text-[12px] leading-relaxed ${canStart ? 'text-slate-500' : 'text-slate-300'}`}>
                      Speak your answers — AI listens and responds in real-time
                    </div>
                    {canStart && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 text-[#0A6A47]" />
                      </div>
                    )}
                  </button>

                  {/* Practice PDF */}
                  <button
                    onClick={() => { if (!canStart) { toast.error('Fill in company and select a focus area first'); return }; handleDownloadSectorQA() }}
                    disabled={generatingQA || !canStart}
                    className={`group relative p-5 rounded-2xl border-2 text-left transition-all ${
                      canStart && !generatingQA
                        ? 'border-slate-200 bg-white hover:border-[#0A6A47]/40 hover:bg-[#0A6A47]/5 hover:-translate-y-0.5 hover:shadow-md'
                        : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${canStart ? 'bg-amber-50' : 'bg-slate-100'}`}>
                      {generatingQA
                        ? <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                        : <FileText className={`w-5 h-5 ${canStart ? 'text-amber-500' : 'text-slate-300'}`} />
                      }
                    </div>
                    <div className={`font-bold text-base mb-1 ${canStart ? 'text-slate-800' : 'text-slate-400'}`}>
                      {generatingQA ? 'Generating…' : 'Practice PDF'}
                    </div>
                    <div className={`text-[12px] leading-relaxed ${canStart ? 'text-slate-500' : 'text-slate-300'}`}>
                      Download 10 tailored Q&amp;A pairs to study offline
                    </div>
                    {canStart && !generatingQA && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="w-4 h-4 text-amber-500" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* ── Past Sessions ── */}
              {sessions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Recent Sessions</h3>
                    <button onClick={() => setHistoryOpen(true)} className="text-[12px] font-semibold text-[#0A6A47] hover:text-[#085c3d] transition-colors flex items-center gap-1">
                      View all ({sessions.length}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {sessions.slice(0, 3).map(session => (
                      <button
                        key={session.id}
                        onClick={() => loadSession(session)}
                        className="w-full flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-100 hover:border-[#0A6A47]/30 hover:shadow-sm transition-all text-left group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#0A6A47]/10 flex items-center justify-center text-sm font-black text-[#0A6A47] flex-shrink-0">
                          {session.company.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-[#0A6A47] transition-colors truncate">{session.company}</p>
                          <p className="text-xs text-slate-400 truncate">{session.role || 'No role specified'}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${typeColor[session.session_type as SessionType] || 'text-slate-600 bg-slate-100'}`}>
                            {session.session_type}
                          </span>
                          <span className="text-[10px] text-slate-300">
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


          /* ══════════════════════════════════════════
             CHAT VIEW
          ══════════════════════════════════════════ */
          <div className="flex flex-1 flex-col min-h-0">

            {/* Chat header */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-white border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#0A6A47]/10 flex items-center justify-center text-sm font-black text-[#0A6A47] flex-shrink-0">
                  {company.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{company}</p>
                  <p className="text-xs text-slate-400 truncate">{role}</p>
                </div>
                {selectedType && (
                  <span className={`hidden sm:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${typeColor[selectedType]}`}>{selectedType}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <Clock className="w-3 h-3" />{formatTime(elapsedSeconds)}
                </span>
                <button onClick={handleDownloadSession} title="Download PDF" className="p-2 rounded-xl hover:bg-[#0A6A47]/10 hover:text-[#0A6A47] text-slate-400 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => setHistoryOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors relative">
                  <History className="w-4 h-4" />
                  {sessions.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#0A6A47] rounded-full" />}
                </button>
                <button onClick={() => { if (sessionId) deleteSession(sessionId) }} disabled={!sessionId} className="p-2 rounded-xl hover:bg-red-50 hover:text-red-500 text-slate-300 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={resetComposer} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors">End</button>
                <button onClick={resetComposer} className="px-3 py-1.5 rounded-xl bg-[#0A6A47] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#085c3d] transition-colors">
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f8f9fa]">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="mr-2.5 mt-1 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#0A6A47]/10 ring-1 ring-[#0A6A47]/20">
                      <Image src="/pebelai-mark.svg" alt="PebelAI" width={18} height={18} />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#0A6A47] text-white' : 'bg-white border border-slate-100 text-slate-800 shadow-sm'}`}>
                    <div className="whitespace-normal select-text cursor-text [&_p]:m-0 [&_p+p]:mt-2 [&_ul]:m-0 [&_ul]:pl-5 [&_ul]:space-y-1" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#0A6A47]/10 ring-1 ring-[#0A6A47]/20">
                    <Image src="/pebelai-mark.svg" alt="PebelAI" width={18} height={18} />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex gap-1 shadow-sm">
                    {[0,150,300].map(d => <div key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay:`${d}ms` }} />)}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="bg-white border-t border-slate-100 px-4 pt-3 pb-4 flex-shrink-0">
              <div className="flex gap-2 mb-2.5">
                {[
                  { icon: HelpCircle, label: "Hint", msg: "I'm not sure how to answer this. Can you give me a hint?" },
                  { icon: ArrowRight, label: 'Skip', msg: 'Please skip this question and move to the next one.' },
                ].map(({ icon: Icon, label, msg }) => (
                  <button key={label} onClick={() => sendMessage(msg)} disabled={isTyping} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-[#0A6A47]/10 hover:text-[#0A6A47] hover:border-[#0A6A47]/30 disabled:opacity-40 transition-colors cursor-pointer">
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2.5">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Type your answer… (Shift+Enter for new line)"
                  rows={3}
                  disabled={isTyping}
                  className="flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#0A6A47] focus:outline-none focus:ring-2 focus:ring-[#0A6A47]/10 disabled:opacity-60 bg-slate-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="self-end px-4 py-3 rounded-2xl bg-[#0A6A47] text-white hover:bg-[#085c3d] disabled:opacity-40 transition-all cursor-pointer"
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
