import type { Application, ApplicationStatus, ApplicationSource } from '@/types'

type ApplicationStore = Map<string, Application>

const globalStore = globalThis as typeof globalThis & {
  __applicationStore?: ApplicationStore
}

const store: ApplicationStore = globalStore.__applicationStore ?? new Map<string, Application>()

if (!globalStore.__applicationStore) {
  globalStore.__applicationStore = store
}

function buildApplication(input: Partial<Application> & { user_id: string; company_name: string; role_title: string }): Application {
  const now = new Date().toISOString()
  return {
    id: input.id || `app_${crypto.randomUUID()}`,
    user_id: input.user_id,
    company_name: input.company_name,
    role_title: input.role_title,
    job_url: input.job_url ?? null,
    job_description: input.job_description ?? null,
    location: input.location ?? null,
    salary_min: input.salary_min ?? null,
    salary_max: input.salary_max ?? null,
    status: (input.status as ApplicationStatus) || 'applied',
    applied_date: input.applied_date || now.slice(0, 10),
    next_action: input.next_action ?? null,
    next_action_date: input.next_action_date ?? null,
    notes: input.notes ?? null,
    contacts: input.contacts ?? [],
    interview_rounds: input.interview_rounds ?? [],
    excitement_level: input.excitement_level ?? 3,
    source: (input.source as ApplicationSource) || 'other',
    created_at: input.created_at || now,
  }
}

export function createApplicationRecord(input: Partial<Application> & { user_id: string; company_name: string; role_title: string }) {
  const app = buildApplication(input)
  store.set(app.id, app)
  return app
}

export function listApplicationRecords(userId: string) {
  return Array.from(store.values())
    .filter((app) => app.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getApplicationRecord(id: string, userId?: string) {
  const app = store.get(id)
  if (!app) return null
  if (userId && app.user_id !== userId) return null
  return app
}

export function updateApplicationRecord(id: string, userId: string, patch: Partial<Application>) {
  const current = getApplicationRecord(id, userId)
  if (!current) return null
  const updated: Application = {
    ...current,
    ...patch,
    id: current.id,
    user_id: current.user_id,
    created_at: current.created_at,
  }
  store.set(id, updated)
  return updated
}

export function deleteApplicationRecord(id: string, userId: string) {
  const current = getApplicationRecord(id, userId)
  if (!current) return false
  store.delete(id)
  return true
}

export function deleteApplicationRecords(userId: string) {
  for (const [id, app] of store.entries()) {
    if (app.user_id === userId) {
      store.delete(id)
    }
  }
}
