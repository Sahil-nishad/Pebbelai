'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Search, X } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

export function TopNav() {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/applications?q=${encodeURIComponent(query.trim())}`)
      setSearchOpen(false)
      setQuery('')
    }
  }

  return (
    /* Mobile-only header — hidden on desktop (sidebar handles desktop nav) */
    <header className="fixed top-0 right-0 left-0 z-30 h-16 flex items-center justify-between bg-[#FBFBFB] border-b border-slate-200/60 px-4 md:hidden">

      {/* Logo */}
      <Link href="/dashboard">
        <Image src="/pebelai-logo.svg" alt="PebelAI" width={130} height={34} className="object-contain" priority />
      </Link>

      <div className="flex items-center gap-2">
        {/* Search toggle */}
        <button
          onClick={() => setSearchOpen(v => !v)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <Link href="/reminders" className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#FBFBFB]" />
        </Link>
      </div>

      {/* Mobile: Expandable search bar */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#FBFBFB] border-b border-slate-200/60 px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search applications..."
              className="w-full h-10 bg-[#F1F5F2] rounded-xl pl-9 pr-9 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0A6A47]/20"
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setQuery('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
