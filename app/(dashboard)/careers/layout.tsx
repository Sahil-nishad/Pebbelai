'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Radar,
  Mail,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const careersNav = [
  { label: 'Dashboard', href: '/careers', icon: LayoutDashboard },
  { label: 'Resume', href: '/careers/resume', icon: FileText },
  { label: 'Recruiters', href: '/careers/recruiters', icon: Radar },
  { label: 'Outreach', href: '/careers/outreach', icon: Mail },
  { label: 'Analytics', href: '/careers/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/careers/settings', icon: Settings },
]

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Careers Sidebar */}
      <aside className="w-full lg:w-56 shrink-0">
        <nav className="flex lg:flex-col flex-row gap-1 overflow-x-auto pb-2 lg:pb-0">
          {careersNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/careers' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}