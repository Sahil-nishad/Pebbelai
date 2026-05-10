'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'

type Props = {
  /** Brand label or component on the left */
  brand?: React.ReactNode
  /** Whether to show "Blog" / "Extension" links (defaults true) */
  showLinks?: boolean
}

export function PublicNav({ brand, showLinks = true }: Props) {
  const { status } = useSession()
  const isLoggedIn = status === 'authenticated'

  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        {brand ?? (
          <Link href={isLoggedIn ? '/dashboard' : '/'} className="text-[18px] font-bold text-slate-900">
            PebelAI
          </Link>
        )}

        <nav className="flex items-center gap-6 text-[13px] text-slate-600 font-medium">
          {showLinks && (
            <>
              <Link href="/blog" className="hover:text-[#0A6A47] hidden sm:inline">Blog</Link>
              <Link href="/extension" className="hover:text-[#0A6A47] hidden sm:inline">Extension</Link>
            </>
          )}

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A6A47] text-white hover:bg-[#085c3d] transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Back to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-[#0A6A47]">Log in</Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-[#0A6A47] text-white hover:bg-[#085c3d] transition-colors"
              >
                Try free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export function BackToDashboardLink() {
  const { status } = useSession()
  if (status !== 'authenticated') return null
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 text-[13px] text-[#0A6A47] hover:text-[#085c3d] font-semibold mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to dashboard
    </Link>
  )
}
