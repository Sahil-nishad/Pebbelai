import type { ReactNode } from 'react'

import { CareersNav } from '@/components/careers/careers-nav'

export default function CareersLayout({ children }: { children: ReactNode }) {
  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[linear-gradient(135deg,#0f172a_0%,#13211b_55%,#14532d_100%)] px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.25),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_32%)]" />
        <div className="relative space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200/90">PebelAI Careers</p>
          <h1 className="text-3xl font-bold tracking-tight">AI recruiter outreach built into your jobflow.</h1>
          <p className="max-w-2xl text-sm text-slate-200/85">
            Upload a resume, discover recruiter posts, generate tailored outreach, and track every conversation from one workspace.
          </p>
        </div>
      </div>
      <CareersNav />
      {children}
    </section>
  )
}

