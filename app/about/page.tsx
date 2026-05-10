import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

const BASE_URL = 'https://www.pebelai.com'

export const metadata: Metadata = {
  title: 'About PebelAI — Built for Indian Job Seekers',
  description:
    'PebelAI is built by Sahil Nishad to help Indian job seekers track applications, prepare for interviews with AI, and never miss a follow-up. Free forever.',
  alternates: { canonical: `${BASE_URL}/about` },
  openGraph: {
    title: 'About PebelAI — Built for Indian Job Seekers',
    description: 'The story behind PebelAI — and the founder building it.',
    url: `${BASE_URL}/about`,
    type: 'profile',
  },
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${BASE_URL}/about#person`,
  name: 'Sahil Nishad',
  jobTitle: 'Founder, PebelAI',
  description:
    'Founder of PebelAI — an AI-powered job application tracker and interview coach for Indian job seekers.',
  url: `${BASE_URL}/about`,
  worksFor: { '@id': `${BASE_URL}/#org` },
  sameAs: [
    'https://github.com/Sahil-nishad',
  ],
  knowsAbout: ['Job Search', 'Interview Preparation', 'Resume Writing', 'AI', 'Software Engineering', 'Career Coaching'],
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'About', item: `${BASE_URL}/about` },
  ],
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* Nav */}
      <header className="border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <Image src="/pebelai-logo.svg" alt="PebelAI" width={130} height={34} className="object-contain" />
          </Link>
          <div className="flex items-center gap-6 text-[13px] text-slate-500">
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-16">
          <p className="text-[11px] font-semibold tracking-widest text-[#2d8a52] uppercase mb-3">About</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">
            Built to help you<br />land your dream job.
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
            PebelAI combines an intelligent job tracker with an AI interview coach — so you can apply smarter, practice better, and never miss a follow-up.
          </p>
        </div>

        {/* Story */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">The Story</h2>
          <div className="space-y-4 text-[15px] text-slate-600 leading-relaxed">
            <p>
              Job searching is exhausting. You apply to dozens of roles, juggle spreadsheets, forget to follow up, and walk into interviews under-prepared. PebelAI was built to fix that.
            </p>
            <p>
              We created a single place where every application is tracked, every interview is practiced with an AI coach tailored to the exact company and role, and every follow-up is never missed.
            </p>
            <p>
              PebelAI is built by <strong className="text-slate-800">Dune AI</strong> — a small team passionate about using AI to make real, meaningful improvements in people&apos;s lives. We believe the right preparation is the difference between an offer and rejection.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">What we stand for</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Simplicity',
                desc: 'No bloat, no friction. Every feature has a clear purpose and stays out of your way.',
              },
              {
                title: 'Privacy-first',
                desc: 'Your job search data is yours. We don\'t sell it, share it, or profit from it.',
              },
              {
                title: 'Real outcomes',
                desc: 'We measure success by whether you get hired, not by engagement metrics.',
              },
            ].map(v => (
              <div key={v.title} className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-[#2d8a52] mb-3" />
                <h3 className="font-semibold text-slate-900 mb-1">{v.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">What PebelAI does</h2>
          <div className="space-y-4">
            {[
              ['Kanban Job Tracker', 'Drag applications through stages — Applied, Interview, Offer, Rejected. See your pipeline at a glance.'],
              ['AI Interview Coach', 'Practice with an AI that knows the company and role. Get real-time feedback and ideal answers tailored to your session.'],
              ['Sector Q&A Generator', 'Generate 10 expert interview questions and ideal answers for any job type — downloadable as a PDF study guide.'],
              ['Session Transcripts', 'Download your full AI coaching session as a formatted PDF to review before the real interview.'],
              ['Chrome Extension', 'Save jobs directly from LinkedIn, Indeed, and any job board with one click.'],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl border border-slate-100 hover:border-[#2d8a52]/30 transition-colors">
                <div className="mt-1 w-2 h-2 rounded-full bg-[#2d8a52] shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 mb-1">{title}</p>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-[#0f3d25] px-8 py-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to get hired?</h2>
          <p className="text-white/60 text-[14px] mb-6">Join thousands of job seekers using PebelAI to land offers faster.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#2d8a52] hover:bg-[#248a4a] text-white text-sm font-semibold px-7 py-3 rounded-full transition-colors"
          >
            Get started free
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-8 mt-8">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 tracking-widest uppercase">Powered by Dune AI</p>
          <div className="flex gap-5 text-[12px] text-slate-400">
            <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
            <Link href="/about" className="hover:text-slate-700 transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
