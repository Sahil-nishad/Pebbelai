export interface CoachSessionRecord {
  id: string
  user_id: string
  company: string
  role: string
  session_type: string
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  question_count: number
  avg_score: number | null
  created_at: string
}

type CoachSessionStore = Map<string, CoachSessionRecord>

declare global {
  var __coachSessionStore: CoachSessionStore | undefined
}

const store: CoachSessionStore = globalThis.__coachSessionStore ?? new Map<string, CoachSessionRecord>()

if (!globalThis.__coachSessionStore) {
  globalThis.__coachSessionStore = store
}

export function createCoachSession(record: Omit<CoachSessionRecord, 'id' | 'created_at'> & Partial<Pick<CoachSessionRecord, 'id' | 'created_at'>>) {
  const session: CoachSessionRecord = {
    id: record.id || `coach_${crypto.randomUUID()}`,
    created_at: record.created_at || new Date().toISOString(),
    user_id: record.user_id,
    company: record.company,
    role: record.role,
    session_type: record.session_type,
    messages: record.messages,
    question_count: record.question_count,
    avg_score: record.avg_score ?? null,
  }
  store.set(session.id, session)
  return session
}

export function getCoachSession(id: string, userId?: string) {
  const session = store.get(id)
  if (!session) return null
  if (userId && session.user_id !== userId) return null
  return session
}

export function listCoachSessions(userId: string) {
  return Array.from(store.values())
    .filter((session) => session.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function updateCoachSession(id: string, userId: string, patch: Partial<CoachSessionRecord>) {
  const session = getCoachSession(id, userId)
  if (!session) return null
  const updated = { ...session, ...patch }
  store.set(id, updated)
  return updated
}

export function deleteCoachSessions(userId: string) {
  for (const [id, session] of store.entries()) {
    if (session.user_id === userId) {
      store.delete(id)
    }
  }
}

export function deleteCoachSession(id: string, userId?: string) {
  const session = store.get(id)
  if (!session) return false
  if (userId && session.user_id !== userId) return false
  return store.delete(id)
}
