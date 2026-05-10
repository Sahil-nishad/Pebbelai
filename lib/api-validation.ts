import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const applicationStatuses = ['applied', 'phone_screen', 'interviewing', 'offer', 'rejected', 'ghosted'] as const
const applicationSources = ['linkedin', 'indeed', 'referral', 'company_site', 'cold', 'other', 'chrome_extension'] as const
const reminderTypes = ['follow_up', 'thank_you', 'check_in', 'deadline', 'interview_prep'] as const
const emailDigests = ['daily', 'weekly', 'instant', 'never'] as const
const jobTypes = ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Any'] as const
const experienceLevels = ['Entry', 'Mid', 'Senior', 'Executive'] as const

type ValidationResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: NextResponse }

type ObjectBody = Record<string, unknown>

const rateLimitStore = new Map<string, number[]>()

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function readJsonObject(req: NextRequest): Promise<ValidationResult<ObjectBody>> {
  try {
    const data = await req.json()
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { error: jsonError('Invalid request body.') }
    }
    return { data: data as ObjectBody }
  } catch {
    return { error: jsonError('Invalid request body.') }
  }
}

export function getClientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const windowStart = now - windowMs
  const hits = (rateLimitStore.get(key) || []).filter((hit) => hit > windowStart)

  if (hits.length >= limit) {
    rateLimitStore.set(key, hits)
    return false
  }

  hits.push(now)
  rateLimitStore.set(key, hits)
  return true
}

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function optionalString(value: unknown, max: number) {
  if (value == null || value === '') return null
  if (typeof value !== 'string') return undefined
  return value.trim().slice(0, max) || null
}

function requiredString(value: unknown, max: number) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

function optionalNumber(value: unknown, min = 0, max = 1_000_000_000) {
  if (value == null || value === '') return null
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(number) || number < min || number > max) return undefined
  return Math.round(number)
}

function optionalBoolean(value: unknown) {
  if (value == null) return undefined
  return typeof value === 'boolean' ? value : undefined
}

function enumValue<T extends readonly string[]>(value: unknown, allowed: T) {
  return typeof value === 'string' && allowed.includes(value) ? value as T[number] : undefined
}

function optionalDateString(value: unknown) {
  if (value == null || value === '') return null
  if (typeof value !== 'string') return undefined
  return Number.isNaN(Date.parse(value)) ? undefined : value
}

function requiredDateString(value: unknown) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return undefined
  return value
}

function stringArray(value: unknown, maxItems = 25, maxLen = 120) {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > maxItems) return undefined
  const items: string[] = []
  for (const item of value) {
    const parsed = requiredString(item, maxLen)
    if (!parsed) return undefined
    items.push(parsed)
  }
  return items
}

function safeObjectArray(value: unknown, maxItems = 50) {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > maxItems) return undefined
  if (!value.every((item) => item && typeof item === 'object' && !Array.isArray(item))) return undefined
  return value
}

export function normalizeApplicationInput(body: ObjectBody, partial = false): ValidationResult<ObjectBody> {
  const updates: ObjectBody = {}

  if (!partial || 'company_name' in body) {
    const value = requiredString(body.company_name, 160)
    if (!value) return { error: jsonError('Company name is required.') }
    updates.company_name = value
  }

  if (!partial || 'role_title' in body) {
    const value = requiredString(body.role_title, 160)
    if (!value) return { error: jsonError('Role title is required.') }
    updates.role_title = value
  }

  for (const [field, max] of [
    ['job_url', 2048],
    ['job_description', 20000],
    ['location', 160],
    ['next_action', 240],
    ['notes', 20000],
  ] as const) {
    if (field in body) {
      const value = optionalString(body[field], max)
      if (value === undefined) return { error: jsonError(`Invalid ${field}.`) }
      updates[field] = value
    }
  }

  for (const field of ['salary_min', 'salary_max'] as const) {
    if (field in body) {
      // Values below 100 are likely noise (e.g. experience "0-1 years" parsed as 0/1)
      const raw = body[field]
      const num = raw == null || raw === '' ? null
        : typeof raw === 'number' || typeof raw === 'string' ? Number(raw) : NaN
      if (num !== null && !Number.isFinite(num)) return { error: jsonError(`Invalid ${field}.`) }
      updates[field] = (num !== null && num < 100) ? null : (num === null ? null : Math.round(num))
    }
  }

  if ('status' in body) {
    const value = enumValue(body.status, applicationStatuses)
    if (!value) return { error: jsonError('Invalid application status.') }
    updates.status = value
  } else if (!partial) {
    updates.status = 'applied'
  }

  if ('source' in body) {
    const value = enumValue(body.source, applicationSources)
    if (!value) return { error: jsonError('Invalid application source.') }
    updates.source = value
  } else if (!partial) {
    updates.source = 'other'
  }

  if ('applied_date' in body) {
    const value = optionalDateString(body.applied_date)
    if (value === undefined) return { error: jsonError('Invalid applied date.') }
    updates.applied_date = value
  } else if (!partial) {
    updates.applied_date = new Date().toISOString().slice(0, 10)
  }

  if ('next_action_date' in body) {
    const value = optionalDateString(body.next_action_date)
    if (value === undefined) return { error: jsonError('Invalid next action date.') }
    updates.next_action_date = value
  }

  if ('contacts' in body) {
    const value = safeObjectArray(body.contacts)
    if (!value) return { error: jsonError('Invalid contacts.') }
    updates.contacts = value
  }

  if ('interview_rounds' in body) {
    const value = safeObjectArray(body.interview_rounds)
    if (!value) return { error: jsonError('Invalid interview rounds.') }
    updates.interview_rounds = value
  }

  if ('excitement_level' in body) {
    const value = optionalNumber(body.excitement_level, 1, 5)
    if (value === undefined || value === null) return { error: jsonError('Invalid excitement level.') }
    updates.excitement_level = value
  } else if (!partial) {
    updates.excitement_level = 3
  }

  return { data: updates }
}

export function normalizeReminderInput(body: ObjectBody, partial = false): ValidationResult<ObjectBody> {
  const updates: ObjectBody = {}

  if (!partial || 'title' in body) {
    const value = requiredString(body.title, 180)
    if (!value) return { error: jsonError('Title is required.') }
    updates.title = value
  }

  if ('description' in body) {
    const value = optionalString(body.description, 2000)
    if (value === undefined) return { error: jsonError('Invalid description.') }
    updates.description = value
  }

  if (!partial || 'due_date' in body) {
    const value = requiredDateString(body.due_date)
    if (!value) return { error: jsonError('Valid due date is required.') }
    updates.due_date = value
  }

  if (!partial || 'reminder_type' in body) {
    const value = enumValue(body.reminder_type, reminderTypes)
    if (!value) return { error: jsonError('Invalid reminder type.') }
    updates.reminder_type = value
  }

  if ('is_done' in body) {
    const value = optionalBoolean(body.is_done)
    if (value === undefined) return { error: jsonError('Invalid completion status.') }
    updates.is_done = value
  } else if (!partial) {
    updates.is_done = false
  }

  if ('application_id' in body) {
    const value = optionalString(body.application_id, 120)
    if (value === undefined) return { error: jsonError('Invalid application id.') }
    updates.application_id = value
  }

  return { data: updates }
}

export function normalizeNotificationSettings(body: ObjectBody): ValidationResult<ObjectBody> {
  const email_digest = enumValue(body.email_digest ?? 'daily', emailDigests)
  const follow_up_days = optionalNumber(body.follow_up_days ?? 7, 1, 365)
  const interview_prep_days = optionalNumber(body.interview_prep_days ?? 2, 0, 365)

  if (!email_digest || follow_up_days == null || interview_prep_days == null) {
    return { error: jsonError('Invalid notification settings.') }
  }

  return { data: { email_digest, follow_up_days, interview_prep_days } }
}

export function normalizeProfileUpdates(body: ObjectBody): ValidationResult<ObjectBody> {
  const updates: ObjectBody = {}

  for (const [field, max] of [
    ['name', 120],
    ['phone', 80],
    ['title', 160],
    ['linkedin', 2048],
    ['location', 160],
    ['job_type', 80],
    ['experience_level', 80],
  ] as const) {
    if (field in body) {
      const value = optionalString(body[field], max)
      if (value === undefined) return { error: jsonError(`Invalid ${field}.`) }
      updates[field] = value
    }
  }

  if ('job_type' in updates && updates.job_type && !jobTypes.includes(updates.job_type as typeof jobTypes[number])) {
    return { error: jsonError('Invalid job type.') }
  }
  if ('experience_level' in updates && updates.experience_level && !experienceLevels.includes(updates.experience_level as typeof experienceLevels[number])) {
    return { error: jsonError('Invalid experience level.') }
  }

  for (const field of ['target_roles', 'target_companies'] as const) {
    if (field in body) {
      const value = stringArray(body[field])
      if (!value) return { error: jsonError(`Invalid ${field}.`) }
      updates[field] = value
    }
  }

  for (const field of ['salary_min', 'salary_max'] as const) {
    if (field in body) {
      const value = optionalNumber(body[field])
      if (value === undefined) return { error: jsonError(`Invalid ${field}.`) }
      updates[field] = value
    }
  }

  if ('email_digest' in body) {
    const value = body.email_digest == null ? null : enumValue(body.email_digest, emailDigests)
    if (value === undefined) return { error: jsonError('Invalid email digest.') }
    updates.email_digest = value
  }

  for (const field of ['follow_up_days', 'interview_prep_days'] as const) {
    if (field in body) {
      const value = optionalNumber(body[field], 0, 365)
      if (value === undefined) return { error: jsonError(`Invalid ${field}.`) }
      updates[field] = value
    }
  }

  return { data: updates }
}
