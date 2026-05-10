'use client'

import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '@/lib/api'
import type { Application, ApplicationStatus } from '@/types'

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/applications')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setApplications(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchApplications()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetchApplications])

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const res = await authFetch(`/api/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    const error = res.ok ? null : new Error('Failed')
    if (!error) {
      setApplications(prev =>
        prev.map(app => app.id === id ? { ...app, status } : app)
      )
    }
    return { error }
  }

  const deleteApplication = async (id: string) => {
    const res = await authFetch(`/api/applications/${id}`, { method: 'DELETE' })
    const error = res.ok ? null : new Error('Failed')
    if (!error) {
      setApplications(prev => prev.filter(app => app.id !== id))
    }
    return { error }
  }

  return { applications, loading, fetchApplications, updateStatus, deleteApplication, setApplications }
}
