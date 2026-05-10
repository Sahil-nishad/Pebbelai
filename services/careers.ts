'use client'

import { authFetch } from '@/lib/api'
import type {
  CareerAnalytics,
  CareerApplication,
  CareerResume,
  GeneratedOutreach,
  RecruiterFeedItem,
  CareerFollowUp,
  RecruiterSearchPayload,
} from '@/types/careers'

async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  if (!response.ok) {
    console.error(`[Careers Service] ${response.status} Error:`, payload)
    if (payload && typeof payload === 'object') {
      const errorPayload = payload as { detail?: string; error?: string; message?: string }
      throw new Error(errorPayload.detail || errorPayload.error || errorPayload.message || `Careers request failed (${response.status}).`)
    }
    throw new Error(typeof payload === 'string' && payload ? payload : `Careers request failed (${response.status}).`)
  }

  return payload as T
}

export async function getCareerAnalytics() {
  return parseJson<CareerAnalytics>(await authFetch('/api/careers/analytics'))
}

export async function getCareerApplications() {
  return parseJson<CareerApplication[]>(await authFetch('/api/careers/applications'))
}

export async function patchApplicationReplyStatus(id: string, reply_status: string) {
  return parseJson<CareerApplication>(
    await authFetch(`/api/careers/applications/${id}/reply`, {
      method: 'PATCH',
      body: JSON.stringify({ reply_status }),
    })
  )
}

export async function getRecruiterFeed() {
  return parseJson<RecruiterFeedItem[]>(await authFetch('/api/careers/recruiters'))
}

export async function searchRecruiters(payload: RecruiterSearchPayload) {
  return parseJson<RecruiterFeedItem[]>(
    await authFetch('/api/careers/recruiters/search', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  )
}

export async function getResumes() {
  return parseJson<CareerResume[]>(await authFetch('/api/careers/resume'))
}

export async function uploadResume(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/careers/resume', {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  })
  return parseJson<CareerResume>(response)
}

export async function generateOutreachEmail(payload: {
  recruiter_post_id: string
  resume_id: string
  custom_notes?: string
}) {
  return parseJson<GeneratedOutreach>(
    await authFetch('/api/careers/outreach/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  )
}

export async function sendOutreachEmail(payload: {
  recruiter_post_id: string
  resume_id: string
  subject: string
  body: string
}) {
  return parseJson<CareerApplication>(
    await authFetch('/api/careers/outreach/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  )
}

export async function sendFollowUp(payload: {
  application_id: string
  subject: string
  body: string
}) {
  return parseJson<CareerFollowUp>(
    await authFetch('/api/careers/followup/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  )
}

export async function getFollowUps(application_id?: string) {
  const url = application_id
    ? `/api/careers/followup?application_id=${encodeURIComponent(application_id)}`
    : '/api/careers/followup'
  return parseJson<CareerFollowUp[]>(await authFetch(url))
}

// ─────────────────────────────────────────────────────────
// Gmail Service
// ─────────────────────────────────────────────────────────

export interface GmailConnectionStatus {
  id: string
  email: string
  is_active: boolean
  emails_sent_today: number
  daily_limit: number
  created_at: string
}

export interface GmailUsage {
  emails_sent_today: number
  daily_limit: number
  remaining: number
}

export async function getGmailStatus(): Promise<GmailConnectionStatus | null> {
  return parseJson<GmailConnectionStatus | null>(await authFetch('/api/careers/gmail/status'))
}

export async function initiateGmailOAuth(): Promise<{ auth_url: string }> {
  return parseJson<{ auth_url: string }>(
    await authFetch('/api/careers/gmail/initiate', { method: 'POST' })
  )
}

export async function disconnectGmail(): Promise<{ status: string; message: string }> {
  return parseJson<{ status: string; message: string }>(
    await authFetch('/api/careers/gmail/disconnect', { method: 'POST' })
  )
}

export async function getGmailUsage(): Promise<GmailUsage> {
  return parseJson<GmailUsage>(await authFetch('/api/careers/gmail/usage'))
}
