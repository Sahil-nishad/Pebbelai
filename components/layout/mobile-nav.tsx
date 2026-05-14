'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, Bot, Puzzle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'

const tabs = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: ClipboardList, label: 'Jobs', href: '/applications' },
  { icon: Bot, label: 'Coach', href: '/coach' },
  { icon: Puzzle, label: 'Extension', href: '/extension' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user, profile } = useUser()

  const displayName = profile?.name || user?.email?.split('@')[0] || 'U'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-[72px] items-start justify-around border-t border-slate-200/80 bg-white/95 pt-2 backdrop-blur-2xl shadow-[0_-10px_30px_rgba(15,23,42,0.04)] md:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')

        if (tab.href === '/settings') {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 pb-1 pt-1 transition-colors',
                isActive ? 'text-emerald-700' : 'text-slate-500'
              )}
            >
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white',
                isActive ? 'bg-emerald-500' : 'bg-gradient-to-br from-emerald-400 to-teal-500'
              )}>
                {initials}
              </div>
              <span className="text-[10px] font-medium">Account</span>
              {isActive && <div className="w-4 h-0.5 rounded-full bg-emerald-500 mt-0.5" />}
            </Link>
          )
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg px-3 pb-1 pt-1 transition-colors',
              isActive ? 'text-emerald-700' : 'text-slate-500'
            )}
          >
            <tab.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
            <span className="text-[10px] font-medium">{tab.label}</span>
            {isActive && <div className="w-4 h-0.5 rounded-full bg-emerald-500 mt-0.5" />}
          </Link>
        )
      })}
    </nav>
  )
}
