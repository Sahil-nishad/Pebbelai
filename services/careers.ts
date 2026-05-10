import type {
  Resume,
  GmailConnection,
  Recruiter,
  RecruiterPost,
  Application,
  AnalyticsSummary,
} from '@/types/careers'

const API_BASE = '/api/careers'

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// Resume API
export async function getResumes(): Promise<Resume[]> {
  return fetchApi<Resume[]>('resume')
}

export async function getResume(id: string): Promise<Resume> {
  return fetchApi<Resume>(`resume/${id}`)
}

export async function createResume(data: Partial<Resume>): Promise<Resume> {
  return fetchApi<Resume>('resume', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateResume(id: string, data: Partial<Resume>): Promise<Resume> {
  return fetchApi<Resume>(`resume/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteResume(id: string): Promise<void> {
  await fetchApi(`resume/${id}`, { method: 'DELETE' })
}

// Gmail Connection API
export async function getGmailConnection(): Promise<GmailConnection> {
  return fetchApi<GmailConnection>('gmail')
}

export async function createGmailConnection(email: string): Promise<GmailConnection> {
  return fetchApi<GmailConnection>('gmail', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function deleteGmailConnection(): Promise<void> {
  await fetchApi('gmail', { method: 'DELETE' })
}

// Recruiter API
export async function getRecruiters(search?: string): Promise<Recruiter[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return fetchApi<Recruiter[]>(`recruiters${query}`)
}

export async function getRecruiter(id: string): Promise<Recruiter> {
  return fetchApi<Recruiter>(`recruiters/${id}`)
}

export async function createRecruiter(data: Partial<Recruiter>): Promise<Recruiter> {
  return fetchApi<Recruiter>('recruiters', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateRecruiter(id: string, data: Partial<Recruiter>): Promise<Recruiter> {
  return fetchApi<Recruiter>(`recruiters/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteRecruiter(id: string): Promise<void> {
  await fetchApi(`recruiters/${id}`, { method: 'DELETE' })
}

// RecruiterPost API
export async function getPosts(savedOnly?: boolean): Promise<RecruiterPost[]> {
  const query = savedOnly ? '?saved_only=true' : ''
  return fetchApi<RecruiterPost[]>(`posts${query}`)
}

export async function getPost(id: string): Promise<RecruiterPost> {
  return fetchApi<RecruiterPost>(`posts/${id}`)
}

export async function savePost(id: string, saved: boolean): Promise<RecruiterPost> {
  return fetchApi<RecruiterPost>(`posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_saved: saved }),
  })
}

// Application API
export async function getApplications(status?: string): Promise<Application[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return fetchApi<Application[]>(`applications${query}`)
}

export async function getApplication(id: string): Promise<Application> {
  return fetchApi<Application>(`applications/${id}`)
}

export async function createApplication(data: Partial<Application>): Promise<Application> {
  return fetchApi<Application>('applications', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateApplication(id: string, data: Partial<Application>): Promise<Application> {
  return fetchApi<Application>(`applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteApplication(id: string): Promise<void> {
  await fetchApi(`applications/${id}`, { method: 'DELETE' })
}

// Analytics API
export async function getAnalytics(): Promise<AnalyticsSummary> {
  return fetchApi<AnalyticsSummary>('analytics')
}