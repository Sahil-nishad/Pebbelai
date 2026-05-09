'use client'

import { authFetch } from '@/lib/api'
import type {
  CareerAnalytics,
  CareerApplication,
  CareerResume,
  GeneratedOutreach,
  RecruiterFeedItem,
  CareerFollowUp,
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

export async function searchRecruiters(payload: { query_terms: string[]; location?: string; limit?: number }) {
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
