'use client'

import { Download, FolderOpen, Globe, ToggleRight, Shield, MousePointer2, Zap, Bell, Bot, Check, Puzzle } from 'lucide-react'

const works = [
  { icon: Zap, title: 'Auto-detects job listings', desc: 'The extension recognizes job pages and pre-fills details — no copy-pasting needed.' },
  { icon: MousePointer2, title: 'One-click to save', desc: 'Click the extension icon, confirm, and the job is instantly in your PebelAI tracker.' },
  { icon: Bell, title: 'Triggers smart reminders', desc: 'Saved jobs automatically get follow-up reminders scheduled.' },
  { icon: Bot, title: 'Ready for AI Coach', desc: 'Once saved, start an interview prep session for that role in one click.' },
]

const stepIcons = [Download, FolderOpen, Globe, ToggleRight, FolderOpen, Shield, MousePointer2]

export function ExtensionPageClient({
  faqs,
  installSteps,
}: {
  faqs: { q: string; a: string }[]
  installSteps: { name: string; text: string }[]
}) {
  return (
    <article className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#0A6A47] flex items-center justify-center">
            <Puzzle className="w-5 h-5 text-white" />
          </div>
          <p className="text-[12px] font-bold tracking-widest text-emerald-700 uppercase">Browser Extension</p>
        </div>
        <h1 className="text-[40px] sm:text-[48px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-5">
          Save LinkedIn & Naukri jobs to PebelAI in one click.
        </h1>
        <p className="text-[17px] text-slate-500 leading-relaxed max-w-2xl">
          The free PebelAI Chrome extension auto-captures job listings from LinkedIn, Naukri, Indeed,
          Internshala, and any company career page — so every application gets tracked without manual entry.
        </p>
      </div>

      <div className="rounded-2xl bg-[#0A6A47] p-7 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="text-[11px] text-emerald-300/70 font-semibold tracking-widest uppercase mb-1">Free · Local Install</p>
          <h2 className="text-[22px] font-bold text-white mb-1">PebelAI Chrome Extension</h2>
          <p className="text-[13px] text-white/60">Works on Chrome, Brave, Edge, Arc · No account needed to download</p>
        </div>
        <a href="/pebelai-extension.zip" download="pebelai-extension.zip" className="shrink-0">
          <button className="flex items-center gap-2.5 h-12 px-6 rounded-xl bg-white text-[#0A6A47] text-[14px] font-bold hover:bg-emerald-50 transition-colors shadow-sm whitespace-nowrap">
            <Download className="w-4 h-4" />
            Download Extension
          </button>
        </a>
      </div>

      <section className="bg-white rounded-2xl border border-slate-100 p-7 mb-6" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-[22px] font-bold text-slate-900 mb-1 tracking-tight">How does the PebelAI extension work?</h2>
        <p className="text-[13px] text-slate-400 mb-6">What happens when you use the extension while job hunting</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {works.map((w) => (
            <div key={w.title} className="flex gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center shrink-0">
                <w.icon className="w-4 h-4 text-[#0A6A47]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900 mb-0.5">{w.title}</p>
                <p className="text-[12px] text-slate-500 leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-7 mb-6" aria-labelledby="install">
        <h2 id="install" className="text-[22px] font-bold text-slate-900 mb-1 tracking-tight">How to install the PebelAI Chrome extension</h2>
        <p className="text-[13px] text-slate-400 mb-7">Step-by-step — takes under 3 minutes</p>

        <ol className="space-y-0 list-none p-0">
          {installSteps.map((s, i) => {
            const Icon = stepIcons[i] || Check
            return (
              <li key={s.name} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F5EE] border border-[#0A6A47]/20 flex items-center justify-center shrink-0 z-10">
                    <Icon className="w-4 h-4 text-[#0A6A47]" />
                  </div>
                  {i < installSteps.length - 1 && <div className="w-px flex-1 bg-slate-100 my-2" />}
                </div>
                <div className="pb-7 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold text-slate-300 tracking-widest">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-[15px] font-bold text-slate-900">{s.name}</h3>
                  </div>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{s.text}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-7 mb-6" aria-labelledby="supported">
        <h2 id="supported" className="text-[22px] font-bold text-slate-900 mb-1 tracking-tight">Supported job sites</h2>
        <p className="text-[13px] text-slate-400 mb-5">Auto-detection works on all of these — plus any company careers page</p>
        <div className="flex flex-wrap gap-2">
          {['LinkedIn', 'Naukri.com', 'Indeed', 'Internshala', 'Glassdoor', 'AngelList / Wellfound', 'Greenhouse', 'Lever', 'Workday', 'Company career pages'].map((site) => (
            <span key={site} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] text-slate-600 font-medium bg-slate-50">
              {site}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-7" aria-labelledby="faq">
        <h2 id="faq" className="text-[24px] font-bold text-slate-900 mb-6 tracking-tight">Frequently asked questions</h2>
        <div className="space-y-5">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-slate-100 last:border-0 pb-5 last:pb-0">
              <h3 className="text-[15px] font-bold text-slate-900 mb-1.5">{faq.q}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 pt-10 border-t border-slate-100 text-center text-[12px] text-slate-400">
        © {new Date().getFullYear()} PebelAI
      </footer>
    </article>
  )
}
