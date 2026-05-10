// PebelAI Chrome Extension Service
// Handles communication between Chrome extension and PebelAI backend

const API_BASE = process.env.NEXT_PUBLIC_CAREERS_API_URL || '/api/careers'

export interface ChromeExtResume {
  id: string
  file_url: string
  parsed_name: string | null
  extracted_skills: string[]
}

export interface ChromeExtRecruiterPost {
  recruiter_post_id: string
  recruiter_name: string
  company: string | null
  email: string | null
  role: string | null
  location: string | null
  post_content: string
  source_url: string
}

export interface ChromeExtOutreachRequest {
  recruiter_post_id: string
  resume_id: string
  custom_notes?: string
}

export interface ChromeExtOutreachResponse {
  subject: string
  body: string
  match: {
    score: number
    missing_skills: string[]
    summary: string
  }
}

export interface ChromeExtSendRequest {
  recruiter_post_id: string
  resume_id: string
  subject: string
  body: string
}

/**
 * Get saved resumes for quick access from extension popup
 */
export async function getExtensionResumes(): Promise<ChromeExtResume[]> {
  const res = await fetch(`${API_BASE}/resume`)
  if (!res.ok) throw new Error('Failed to fetch resumes')
  return res.json()
}

/**
 * Get recruiter posts from feed
 */
export async function getExtensionRecruiterPosts(): Promise<ChromeExtRecruiterPost[]> {
  const res = await fetch(`${API_BASE}/recruiters`)
  if (!res.ok) throw new Error('Failed to fetch recruiters')
  return res.json()
}

/**
 * Quick search for recruiters from extension
 */
export async function searchRecruitersFromExtension(query: string[]): Promise<ChromeExtRecruiterPost[]> {
  const res = await fetch(`${API_BASE}/recruiters/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_terms: query, limit: 10 }),
  })
  if (!res.ok) throw new Error('Search failed')
  return res.json()
}

/**
 * Generate outreach email from extension context
 */
export async function generateFromExtension(
  payload: ChromeExtOutreachRequest
): Promise<ChromeExtOutreachResponse> {
  const res = await fetch(`${API_BASE}/outreach/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Generation failed')
  }
  return res.json()
}

/**
 * Send outreach from extension (requires approval)
 */
export async function sendFromExtension(
  payload: ChromeExtSendRequest
): Promise<{ id: string; sent_status: string }> {
  const res = await fetch(`${API_BASE}/outreach/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Send failed')
  }
  return res.json()
}

/**
 * Get analytics summary for extension badge
 */
export async function getExtensionAnalytics(): Promise<{
  total_applications: number
  response_rate: number
  pending_replies: number
}> {
  const res = await fetch(`${API_BASE}/analytics`)
  if (!res.ok) throw new Error('Failed to fetch analytics')
  return res.json()
}

/**
 * Update application reply status from extension
 */
export async function updateReplyStatus(
  applicationId: string,
  status: 'pending' | 'replied' | 'rejected' | 'no_response'
): Promise<void> {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/reply`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply_status: status }),
  })
  if (!res.ok) throw new Error('Update failed')
}

/**
 * Chrome extension storage helpers
 */
export const extensionStorage = {
  async getLastResume(): Promise<string | null> {
    if (typeof chrome === 'undefined' || !chrome.storage) return null
    const result = await chrome.storage.local.get('lastResumeId')
    return result.lastResumeId || null
  },

  async setLastResume(id: string): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) return
    await chrome.storage.local.set({ lastResumeId: id })
  },

  async getApiKey(): Promise<string | null> {
    if (typeof chrome === 'undefined' || !chrome.storage) return null
    const result = await chrome.storage.local.get('apiKey')
    return result.apiKey || null
  },

  async setApiKey(key: string): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) return
    await chrome.storage.local.set({ apiKey: key })
  },
}