'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Grid,
  FileText,
  Radar,
  Mail,
  BarChart,
  Settings,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const careersNav = [
  { label: 'Dashboard', href: '/careers', icon: Grid },
  { label: 'Resume', href: '/careers/resume', icon: FileText },
  { label: 'Recruiters', href: '/careers/recruiters', icon: Radar },
  { label: 'Outreach', href: '/careers/outreach', icon: Mail },
  { label: 'Analytics', href: '/careers/analytics', icon: BarChart },
  { label: 'Settings', href: '/careers/settings', icon: Settings },
]

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-10rem)] py-4">
      {/* Careers Sidebar */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="sticky top-24 space-y-4">
          <div className="px-4 py-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Careers Hub</h2>
          </div>
          
          <nav className="flex lg:flex-col flex-row gap-1.5 p-2 rounded-2xl glass border border-white/40 shadow-sm overflow-x-auto scrollbar-hide">
            {careersNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/careers' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative group outline-none"
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap',
                      isActive
                        ? 'text-emerald-700 bg-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                    )}
                  >
                    <item.icon className={cn(
                      "h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-emerald-600" : "text-slate-400"
                    )} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {!isActive && (
                      <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-4px] group-hover:translate-x-0" />
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Quick Stats Card */}
          <div className="hidden lg:block p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg overflow-hidden relative group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
            <p className="text-xs font-medium text-emerald-100/80 uppercase tracking-wider">Hiring Mode</p>
            <h3 className="text-lg font-bold mt-1">Active Hunt</h3>
            <p className="text-xs text-emerald-100/60 mt-3 leading-relaxed">
              AI is currently tracking 12 high-match roles for you.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 animate-fade-up">
        <div className="rounded-3xl border border-white/60 bg-white/40 backdrop-blur-md p-1 min-h-full">
          <div className="rounded-[22px] bg-white/80 border border-slate-100 p-6 md:p-8 h-full shadow-sm">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}