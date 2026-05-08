'use client'

import { authFetch } from '@/lib/api'
import type {
  CareerAnalytics,
  CareerApplication,
  CareerResume,
  GeneratedOutreach,
  RecruiterFeedItem,
} from '@/types/careers'

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Request failed.' }))
    throw new Error(payload.error || 'Request failed.')
  }
  return response.json() as Promise<T>
}

export async function getCareerAnalytics() {
  return parseJson<CareerAnalytics>(await authFetch('/api/careers/analytics'))
}

export async function getCareerApplications() {
  return parseJson<CareerApplication[]>(await authFetch('/api/careers/applications'))
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

export async function generateOutreachEmail(payload: { recruiter_post_id: string; resume_id: string; custom_notes?: string }) {
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

