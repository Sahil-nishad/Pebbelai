'use client'

import { useUser } from './useUser'

export function useSubscription() {
  const { profile } = useUser()

  const isPro = profile?.plan === 'pro'

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkLimit = (_feature: 'applications' | 'ai') => {
    if (isPro) return { allowed: true, reason: '' }

    return {
      allowed: true,
      reason: '',
    }
  }

  return { isPro, plan: profile?.plan || 'free', checkLimit }
}
