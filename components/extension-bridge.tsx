'use client'

import { useEffect } from 'react'

/**
 * ExtensionBridge — invisible component that syncs the NextAuth session JWT
 * to the PebelAI Chrome extension.
 *
 * How it works:
 * 1. Fetches /api/auth/extension-token (raw NextAuth JWT)
 * 2. Stores it in localStorage under 'pebelai_token' so content.js can find it
 * 3. Fires window.postMessage({ type: 'PEBELAI_AUTH_TOKEN', token }) so the
 *    extension background can pick it up immediately
 * 4. Repeats every 4 minutes to keep the token fresh
 */
export function ExtensionBridge() {
  useEffect(() => {
    async function syncToken() {
      try {
        const res = await fetch('/api/auth/extension-token')
        if (!res.ok) return
        const { token } = await res.json()
        if (!token) return

        // Store in localStorage so content.js tokenFromStorage() finds it
        localStorage.setItem('pebelai_token', token)

        // postMessage so content.js handleAuthPostMessage() picks it up
        window.postMessage({ type: 'PEBELAI_AUTH_TOKEN', token }, window.location.origin)
      } catch (_) {
        // Silently fail — extension sync is best-effort
      }
    }

    syncToken()
    const interval = setInterval(syncToken, 4 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return null
}
