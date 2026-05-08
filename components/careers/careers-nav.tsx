'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BriefcaseBusiness, FileText, Mail, Radar, BarChart3, ListChecks, Settings2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const items = [
  { href: '/careers/dashboard', label: 'Dashboard', icon: BriefcaseBusiness },
  { href: '/careers/recruiters', label: 'Recruiters', icon: Radar },
  { href: '/careers/outreach', label: 'Outreach', icon: Mail },
  { href: '/careers/applications', label: 'Applications', icon: ListChecks },
  { href: '/careers/resume', label: 'Resume', icon: FileText },
  { href: '/careers/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/careers/settings', label: 'Settings', icon: Settings2 },
]

export function CareersNav() {
  const pathname = usePathname()

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
              active
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.22)]'
                : 'border-slate-200 bg-white/85 text-slate-600 hover:border-emerald-200 hover:text-slate-900'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
