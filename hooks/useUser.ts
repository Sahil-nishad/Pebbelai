'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { authFetch } from '@/lib/api'
import type { UserProfile } from '@/types'

export function useUser() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      authFetch('/api/settings/profile')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => setProfile(data))
        .catch(() => {})
    } else if (status === 'unauthenticated') {
      queueMicrotask(() => setProfile(null))
    }
  }, [status])

  const signOut = async () => {
    setProfile(null)
    await nextAuthSignOut({ callbackUrl: '/login' })
  }

  return {
    user: session?.user ?? null,
    profile,
    loading: status === 'loading',
    signOut,
  }
}
