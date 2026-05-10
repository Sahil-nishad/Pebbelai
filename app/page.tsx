'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Sparkles,
  BarChart3,
  Puzzle,
  Bot,
  Zap,
  Bell,
  Users,
  Download,
  MousePointer2,
  Shield,
} from 'lucide-react'

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-[0_1px_0_rgba(15,23,42,0.08)]' : 'bg-white/80 backdrop-blur-xl border-b border-slate-100'}`}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/pebelai-logo.svg" alt="PebelAI" width={150} height={39} className="h-8 w-auto object-contain" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['/extension', 'Extension'], ['/blog', 'Blog'], ['#why-pebelai', 'Why PebelAI']].map(([href, label]) => {
            const isInternal = href.startsWith('/')
            return isInternal ? (
              <Link key={href} href={href} className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors">{label}</Link>
            ) : (
              <a key={href} href={href} className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors">{label}</a>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="relative text-[13px] font-medium text-slate-600 hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg overflow-hidden transition-all duration-300 hover:text-[#16a34a] group"
          >
            <span className="absolute inset-0 rounded-lg bg-emerald-50 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
            <span className="relative">Log in</span>
          </Link>
          <Link href="/signup">
            <button className="h-8 px-4 rounded-lg bg-[#16a34a] text-white text-[13px] font-medium hover:bg-[#15803d] transition-colors">
              Try it free
            </button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ─── Dashboard Mockup ─── */
function DashboardMockup() {
  const apps = [
    { name: 'Google', role: 'Senior PM', status: 'Interview', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700' },
    { name: 'Stripe', role: 'Engineer II', status: 'Applied', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700' },
    { name: 'Vercel', role: 'DX Engineer', status: 'Offer', dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700' },
    { name: 'Figma', role: 'Frontend Dev', status: 'Applied', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700' },
    { name: 'Notion', role: 'Product Lead', status: 'Rejected', dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-500' },
  ]

  return (
    <div className="relative">
      {/* Floating AI suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute -top-3 -right-3 z-10 flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      >
        <div className="w-5 h-5 rounded-full bg-[#16a34a] flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
        <p className="text-[11px] font-medium text-slate-700">Follow up with Google <span className="text-[#16a34a]">today</span></p>
      </motion.div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.10)] overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
          <div className="flex items-center gap-1 ml-3 px-2.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
            pebelai.com/applications
          </div>
        </div>

        {/* Nav strip */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-0">
          {['Overview', 'Applications', 'Reminders'].map((tab, i) => (
            <div key={tab} className={`px-3 py-1.5 rounded-md text-[11px] font-medium ${i === 1 ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}>{tab}</div>
          ))}
        </div>

        {/* Applications list */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-slate-700">12 applications tracked</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
              <span className="text-[10px] text-[#16a34a] font-medium">Live</span>
            </div>
          </div>
          {apps.map((app) => (
            <div key={app.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-600 shrink-0">
                {app.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 leading-none mb-0.5">{app.name}</p>
                <p className="text-[10px] text-slate-400">{app.role}</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${app.badge}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${app.dot}`} />
                {app.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extension chip */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="absolute -bottom-3 -left-3 z-10 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      >
        <Puzzle className="w-3.5 h-3.5 text-[#16a34a]" />
        <p className="text-[11px] font-semibold text-slate-700">Auto-tracked via extension</p>
      </motion.div>
    </div>
  )
}

/* ─── Kanban Mini ─── */
function KanbanMini() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex gap-3">
        {[
          { label: 'Applied', dot: 'bg-blue-400', count: 8, cards: ['Google – PM', 'Stripe – Eng'] },
          { label: 'Interview', dot: 'bg-amber-400', count: 3, cards: ['Meta – Lead'] },
          { label: 'Offer', dot: 'bg-emerald-400', count: 1, cards: ['Vercel – DX'] },
        ].map((col) => (
          <div key={col.label} className="flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
              <span className="text-[10px] font-semibold text-slate-600">{col.label}</span>
              <span className="ml-auto text-[9px] bg-slate-100 rounded px-1 text-slate-400">{col.count}</span>
            </div>
            <div className="space-y-1.5">
              {col.cards.map(c => (
                <div key={c} className="bg-slate-50 border border-slate-100 rounded-md px-2 py-1.5 text-[10px] text-slate-600 font-medium">{c}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── AI Chat Mini ─── */
function AIChatMini() {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-start">
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3 h-3 text-white" />
        </div>
        <div className="bg-white/15 rounded-lg px-3 py-2 text-[11px] text-white leading-relaxed">
          Tell me about a time you led a cross-functional project.
        </div>
      </div>
      <div className="flex gap-2 items-start justify-end">
        <div className="bg-white/25 rounded-lg px-3 py-2 text-[11px] text-white leading-relaxed max-w-[80%]">
          At my last role I led the redesign of our onboarding flow...
        </div>
      </div>
      <div className="flex gap-2 items-start">
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3 h-3 text-white" />
        </div>
        <div className="bg-white/15 rounded-lg px-3 py-2 text-[11px] text-white leading-relaxed">
          <span className="font-semibold">Strong:</span> Clear impact framing ✓<br />
          <span className="font-semibold">Improve:</span> Add specific metrics
        </div>
      </div>
    </div>
  )
}

/* ─── Analytics Mini ─── */
function AnalyticsMini() {
  const bars = [40, 65, 45, 80, 55, 90, 70]
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-16">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-slate-100 relative overflow-hidden">
            <div
              className="absolute bottom-0 w-full rounded-sm bg-[#16a34a]/60"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[['Free', 'Forever plan'], ['1-click', 'Job capture'], ['AI', 'Interview prep']].map(([v, l]) => (
          <div key={l} className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-[13px] font-bold text-slate-900">{v}</p>
            <p className="text-[9px] text-slate-400 leading-tight">{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Extension Mini ─── */
function ExtensionMini() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
        <Puzzle className="w-4 h-4 text-[#16a34a]" />
        <span className="text-[11px] font-medium text-slate-700">PebelAI extension active</span>
        <div className="ml-auto w-2 h-2 rounded-full bg-[#16a34a]" />
      </div>
      <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
        <p className="text-[10px] text-slate-400 mb-1.5">Detected on LinkedIn job page</p>
        <p className="text-[11px] font-semibold text-slate-800 mb-2">Senior Product Manager · Google</p>
        <button className="w-full py-1.5 rounded-md bg-[#16a34a] text-white text-[10px] font-semibold">
          Add to PebelAI →
        </button>
      </div>
      <p className="text-[10px] text-slate-400 text-center">Saved to your tracker in 1 click</p>
    </div>
  )
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="pt-28 pb-20 md:pt-32 md:pb-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <h1 className="text-[42px] md:text-[52px] lg:text-[54px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-900 font-[family-name:var(--font-heading)]">
                Apply anywhere.<br />
                Track automatically.<br />
                <span className="text-[#16a34a]">Prepare with AI.</span>
              </h1>
              <p className="text-[16px] text-slate-500 leading-[1.7] max-w-[440px]">
                PebelAI auto-tracks your job applications via browser extension, sends smart reminders for follow-ups and interviews, and coaches you with AI — built for candidates applying to 50–200 roles.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3 pt-1">
                <Link href="/signup">
                  <button className="flex items-center gap-2 h-11 px-6 rounded-xl bg-[#16a34a] text-white text-[14px] font-semibold hover:bg-[#15803d] transition-colors shadow-sm">
                    Get started free <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/login">
                  <button className="relative flex items-center gap-2 h-11 px-5 text-[14px] font-medium text-slate-600 border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 hover:text-[#16a34a] hover:border-emerald-200 group">
                    <span className="absolute inset-0 bg-emerald-50 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out rounded-xl" />
                    <span className="relative">Log in</span>
                  </button>
                </Link>
              </div>

              {/* Honest early-stage social proof */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[12px] text-slate-500">Be among the first users — early access, always free</span>
                </div>
              </div>
            </motion.div>

            {/* Right */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block relative"
            >
              <DashboardMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── POSITIONING STRIP ─── */}
      <div className="border-y border-slate-100 py-7 px-6 bg-slate-50/60">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[15px] text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            The only job tracker that automatically captures applications as you browse — so you can focus on applying, not spreadsheets.
          </p>
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="mb-14">
            <p className="text-[12px] text-[#16a34a] font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.025em] text-slate-900 font-[family-name:var(--font-heading)] mb-3">
              Everything you need for a high-volume search
            </h2>
            <p className="text-[15px] text-slate-500 max-w-lg">
              Stop managing your job search in a spreadsheet. PebelAI automates the tedious parts so you spend time applying — not tracking.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid md:grid-cols-2 gap-4">

            {/* Auto Job Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-7 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Auto Job Tracking</p>
              <h3 className="text-[18px] font-bold text-slate-900 mb-2 tracking-tight font-[family-name:var(--font-heading)]">Your pipeline, built automatically</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
                Install the browser extension and save any job in one click from LinkedIn, Indeed, or any site. Or add manually in seconds. Every application in one place, always up to date.
              </p>
              <KanbanMini />
            </motion.div>

            {/* AI Interview Coach */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="p-7 rounded-2xl bg-[#16a34a] border border-[#15803d] hover:shadow-[0_8px_32px_rgba(22,163,74,0.25)] transition-all duration-300"
            >
              <p className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-4">AI Interview Coach</p>
              <h3 className="text-[18px] font-bold text-white mb-2 tracking-tight font-[family-name:var(--font-heading)]">Quick revision before every interview.</h3>
              <p className="text-[13px] text-white/70 leading-relaxed mb-5">
                Practice role-specific questions, get structured STAR-format feedback, and walk in confident. Designed for last-minute prep, not lengthy courses.
              </p>
              <AIChatMini />
            </motion.div>

            {/* Smart Reminders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="p-7 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Smart Reminders</p>
              <h3 className="text-[18px] font-bold text-slate-900 mb-2 tracking-tight font-[family-name:var(--font-heading)]">Never ghost a follow-up again</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
                Get email alerts for follow-ups, application deadlines, and upcoming interviews — timed automatically based on your pipeline. Stay on top of 100+ applications without thinking about it.
              </p>
              <AnalyticsMini />
            </motion.div>

            {/* Browser Extension */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="p-7 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Browser Extension</p>
              <h3 className="text-[18px] font-bold text-slate-900 mb-2 tracking-tight font-[family-name:var(--font-heading)]">Save jobs without switching tabs</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
                The PebelAI extension detects job listings as you browse and lets you capture them instantly. No copy-pasting, no manual entry — just click and track.
              </p>
              <ExtensionMini />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 md:py-28 px-6 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[12px] text-[#16a34a] font-semibold uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.025em] text-slate-900 font-[family-name:var(--font-heading)]">
              From application to offer in 4 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-6 left-[calc(25%+16px)] right-[calc(25%+16px)] h-px bg-gradient-to-r from-slate-200 via-[#16a34a]/30 to-slate-200" />
            {[
              {
                step: '01',
                icon: Puzzle,
                title: 'Apply to jobs anywhere',
                desc: 'Browse LinkedIn, Indeed, company sites — wherever you find opportunities.',
              },
              {
                step: '02',
                icon: Zap,
                title: 'Auto-track or add manually',
                desc: 'Extension captures it in 1 click. Or enter details manually in under 30 seconds.',
              },
              {
                step: '03',
                icon: Bell,
                title: 'Get smart reminders',
                desc: 'Email alerts for follow-ups, deadlines, and interviews — sent at the right time.',
              },
              {
                step: '04',
                icon: Bot,
                title: 'Prep with AI coach',
                desc: 'Practice role-specific questions and get real feedback before every interview.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-5 h-5 text-[#16a34a]" />
                </div>
                <p className="text-[10px] font-bold text-slate-300 tracking-widest mb-1">{item.step}</p>
                <h3 className="text-[14px] font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-[12px] text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EXTENSION ─── */}
      <section id="extension" className="py-24 md:py-32 px-6 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[12px] text-[#16a34a] font-semibold uppercase tracking-widest mb-3">Browser Extension</p>
              <h2 className="text-[32px] md:text-[38px] font-bold tracking-[-0.025em] text-slate-900 font-[family-name:var(--font-heading)] mb-4">
                Save any job in one click —<br />no copy-pasting ever.
              </h2>
              <p className="text-[15px] text-slate-500 leading-[1.7] mb-8">
                The PebelAI Chrome extension sits quietly in your browser. When you spot a job on LinkedIn, Indeed, Naukri, or any company site, it detects the listing and lets you add it to your tracker instantly — company, role, URL and all.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { icon: Shield, label: 'No account data collected' },
                  { icon: MousePointer2, label: 'Works on any job site' },
                  { icon: Zap, label: 'Adds in under 2 seconds' },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-[12px] text-slate-600 font-medium">
                    <b.icon className="w-3.5 h-3.5 text-[#16a34a]" />
                    {b.label}
                  </div>
                ))}
              </div>

              {/* Download CTA */}
              <a href="/pebelai-extension.zip" download="pebelai-extension.zip">
                <button className="flex items-center gap-2.5 h-12 px-7 rounded-xl bg-slate-900 text-white text-[14px] font-semibold hover:bg-slate-800 transition-colors shadow-sm">
                  <Download className="w-4 h-4" />
                  Download Extension — Free
                </button>
              </a>
              <p className="text-[12px] text-slate-400 mt-3">Free early access · Manual install · Works on Chrome, Brave, Edge</p>
            </motion.div>

            {/* Right — step by step */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-5">Setup in 3 steps</p>

              {[
                {
                  step: '01',
                  title: 'Download & install the extension',
                  desc: 'Click "Download Extension" above, unzip the file, then load it in Chrome via chrome://extensions → Developer mode → Load unpacked.',
                  icon: Download,
                },
                {
                  step: '02',
                  title: 'Sign in to your PebelAI account',
                  desc: 'Click the PebelAI icon in your browser toolbar. Log in with your account to connect the extension to your dashboard.',
                  icon: Shield,
                },
                {
                  step: '03',
                  title: 'Browse jobs and click "Add to PebelAI"',
                  desc: 'Visit any job listing on LinkedIn, Indeed, Glassdoor, or a company careers page. The extension pops up — hit the button and the job is saved instantly.',
                  icon: MousePointer2,
                },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#16a34a]/30 hover:shadow-[0_4px_20px_rgba(22,163,74,0.06)] transition-all"
                >
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-[#16a34a]" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 tracking-widest">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}

              {/* After install note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 mt-2">
                <Check className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <p className="text-[12px] text-emerald-800 leading-relaxed">
                  That&apos;s it. Every job you save goes straight into your PebelAI dashboard, ready for tracking, reminders, and interview prep.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── WHY PEBELAI (DIFFERENTIATION) ─── */}
      <section id="why-pebelai" className="py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[12px] text-[#16a34a] font-semibold uppercase tracking-widest mb-3">Why PebelAI</p>
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.025em] text-slate-900 font-[family-name:var(--font-heading)]">
              Built for volume. Manual trackers aren&apos;t.
            </h2>
            <p className="text-[15px] text-slate-500 mt-3 max-w-lg mx-auto">
              When you&apos;re applying to 50–200 roles, a spreadsheet breaks down. Here&apos;s what&apos;s different.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Automation, not manual entry',
                desc: 'Most trackers make you enter every field by hand. PebelAI captures job details automatically from any site — company, role, date, URL — in one click.',
              },
              {
                icon: Bell,
                title: 'Reminders that actually matter',
                desc: 'A spreadsheet won\'t tell you to follow up in 7 days, or alert you the night before an interview. PebelAI does — via email, timed intelligently.',
              },
              {
                icon: Bot,
                title: 'AI prep at the right moment',
                desc: 'Once an interview is booked, your coach knows the company and role. Practice targeted questions for that specific job — not generic advice.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#16a34a]/30 hover:shadow-[0_8px_24px_rgba(22,163,74,0.08)] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#16a34a]" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick comparison */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden"
          >
            <div className="grid grid-cols-3 border-b border-slate-200">
              <div className="px-6 py-4 text-[12px] font-semibold text-slate-400 uppercase tracking-widest">Feature</div>
              <div className="px-6 py-4 text-center text-[12px] font-semibold text-slate-500">Spreadsheet</div>
              <div className="px-6 py-4 text-center text-[12px] font-semibold text-[#16a34a]">PebelAI</div>
            </div>
            {[
              ['Auto-capture from job boards', false, true],
              ['Smart follow-up reminders', false, true],
              ['AI interview prep', false, true],
              ['Kanban pipeline view', false, true],
              ['Works at scale (100+ apps)', false, true],
            ].map(([label, spreadsheet, pebelai]) => (
              <div key={String(label)} className="grid grid-cols-3 border-b border-slate-100 last:border-0">
                <div className="px-6 py-3.5 text-[13px] text-slate-700">{String(label)}</div>
                <div className="px-6 py-3.5 flex justify-center">
                  {spreadsheet ? <Check className="w-4 h-4 text-[#16a34a]" /> : <span className="text-[13px] text-slate-300">—</span>}
                </div>
                <div className="px-6 py-3.5 flex justify-center">
                  {pebelai ? <Check className="w-4 h-4 text-[#16a34a]" /> : <span className="text-[13px] text-slate-300">—</span>}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── EARLY ACCESS / TRUST ─── */}
      <div className="border-y border-slate-100 py-14 px-6 bg-[#0d2818]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-[11px] text-emerald-500/70 font-semibold tracking-widest uppercase mb-2">Early Access</p>
              <h3 className="text-[22px] font-bold text-white mb-2">Be among the first users.</h3>
              <p className="text-[14px] text-white/50 leading-relaxed max-w-sm">
                PebelAI is launching now. Sign up free, give us feedback, and help shape what gets built next.
              </p>
              <p className="text-[12px] text-white/30 mt-4">
                Built and powered by <span className="text-emerald-400/70 font-semibold">DuneAI</span>
              </p>
            </div>
            <div className="shrink-0 flex flex-col gap-3">
              <Link href="/signup">
                <button className="flex items-center gap-2 h-11 px-7 rounded-xl bg-[#16a34a] text-white text-[14px] font-semibold hover:bg-[#15803d] transition-colors whitespace-nowrap">
                  Get early access — free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CTA ─── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[36px] md:text-[48px] font-bold tracking-[-0.03em] text-slate-900 mb-4 font-[family-name:var(--font-heading)]">
              Stop losing track.<br />Start landing offers.
            </h2>
            <p className="text-[16px] text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
              Sign up free and start tracking your job search today. No credit card needed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <button className="flex items-center gap-2 h-12 px-8 rounded-xl bg-[#16a34a] text-white text-[15px] font-semibold hover:bg-[#15803d] transition-colors shadow-sm">
                  Create free account <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/login">
                <button className="flex items-center gap-2 h-12 px-6 rounded-xl border border-slate-200 text-slate-600 text-[15px] font-medium hover:border-slate-300 hover:text-slate-900 transition-colors">
                  Log in
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-100 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div className="max-w-xs">
              <Image src="/pebelai-logo.svg" alt="PebelAI" width={140} height={36} className="h-6 w-auto mb-3" />
              <p className="text-[13px] text-slate-400 leading-relaxed">
                The AI-powered job tracker built for candidates applying at scale. Auto-track, get reminded, prep with AI.
              </p>
              <p className="text-[12px] text-slate-300 mt-3">
                Built by <span className="text-slate-400 font-medium">DuneAI</span>
              </p>
            </div>
            <div className="flex gap-14">
              <div>
                <p className="text-[12px] font-semibold text-slate-900 mb-3">Product</p>
                <div className="space-y-2">
                  {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['/extension', 'Extension'], ['/blog', 'Blog'], ['/signup', 'Get started']].map(([href, label]) => (
                    <a key={href} href={href} className="block text-[13px] text-slate-400 hover:text-slate-700 transition-colors">{label}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-slate-900 mb-3">Account</p>
                <div className="space-y-2">
                  {[['/login', 'Sign in'], ['/signup', 'Sign up free']].map(([href, label]) => (
                    <a key={href} href={href} className="block text-[13px] text-slate-400 hover:text-slate-700 transition-colors">{label}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-3">
            <p className="text-[12px] text-slate-400">© {new Date().getFullYear()} PebelAI · Powered by DuneAI</p>
            <div className="flex items-center gap-5">
              {[['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, href]) => (
                <a key={l} href={href} className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
