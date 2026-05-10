'use client'

import Link from 'next/link'
import { BriefcaseBusiness, FileText, Radar, Mail, BarChart3, ArrowRight, Zap } from 'lucide-react'

const features = [
  {
    title: 'Resume Manager',
    description: 'Upload and parse your resume. Extract skills and projects automatically.',
    href: '/careers/resume',
    icon: FileText,
  },
  {
    title: 'Recruiter Feed',
    description: 'Search and discover recruiter hiring posts. Find your next opportunity.',
    href: '/careers/recruiters',
    icon: Radar,
  },
  {
    title: 'Outreach Center',
    description: 'Generate AI-personalized cold emails and track your applications.',
    href: '/careers/outreach',
    icon: Mail,
  },
  {
    title: 'Analytics',
    description: 'Track your outreach performance. Monitor response rates and conversions.',
    href: '/careers/analytics',
    icon: BarChart3,
  },
]

export default function CareersPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PebelAI Careers</h1>
          <p className="text-slate-500 mt-1">
            AI-powered recruiter outreach. Find jobs, connect with recruiters, land interviews.
          </p>
        </div>
        <Link
          href="/careers/settings"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          <Zap className="h-4 w-4" />
          Setup Gmail
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group relative flex items-start gap-4 p-5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all bg-white"
          >
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <feature.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {feature.description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all absolute right-4 top-1/2 -translate-y-1/2" />
          </Link>
        ))}
      </div>

      {/* Quick Stats Placeholder */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Getting Started</h2>
        <ol className="space-y-3 text-sm text-slate-600">
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">1</span>
            <span>Go to <strong>Settings</strong> and connect your Gmail account</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">2</span>
            <span>Upload your resume in the <strong>Resume</strong> tab</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">3</span>
            <span>Search for recruiters in the <strong>Recruiters</strong> tab</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">4</span>
            <span>Generate and send personalized outreach emails</span>
          </li>
        </ol>
      </div>
    </div>
  )
}