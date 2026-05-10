'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/topnav'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ExtensionBridge } from '@/components/extension-bridge'

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500/35 border-t-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <ExtensionBridge />
      <Sidebar />
      <TopNav />
      <main className="md:ml-[244px] mt-16 md:mt-0 pb-24 md:pb-8 p-4 md:p-6 lg:p-8">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardGuard>{children}</DashboardGuard>
}
