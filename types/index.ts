export type ApplicationStatus =
  | 'applied'
  | 'phone_screen'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'ghosted'

export type InterviewType =
  | 'phone_screen'
  | 'technical'
  | 'system_design'
  | 'behavioral'
  | 'case_study'
  | 'final'

export type InterviewFormat = 'video' | 'phone' | 'onsite' | 'take_home'

export type InterviewOutcome = 'passed' | 'failed' | 'pending'

export type ApplicationSource =
  | 'linkedin'
  | 'indeed'
  | 'referral'
  | 'company_site'
  | 'cold'
  | 'other'
  | 'chrome_extension'

export type ReminderType =
  | 'follow_up'
  | 'thank_you'
  | 'check_in'
  | 'deadline'
  | 'interview_prep'

export type CoachSessionType =
  | 'behavioral'
  | 'technical'
  | 'case'
  | 'salary'
  | 'general'

export interface Contact {
  name: string
  title: string
  email: string
  linkedin: string
}

export interface InterviewRound {
  round: string
  date: string
  type: InterviewType
  format: InterviewFormat
  interviewer?: string
  notes: string
  outcome: InterviewOutcome
}

export interface Application {
  id: string
  user_id: string
  company_name: string
  role_title: string
  job_url: string | null
  job_description: string | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
  status: ApplicationStatus
  applied_date: string
  next_action: string | null
  next_action_date: string | null
  notes: string | null
  contacts: Contact[]
  interview_rounds: InterviewRound[]
  excitement_level: number
  source: ApplicationSource
  created_at: string
}

export interface Reminder {
  id: string
  user_id: string
  application_id: string
  title: string
  description: string | null
  due_date: string
  is_done: boolean
  reminder_type: ReminderType
  created_at: string
  application?: Application
}

export interface CoachMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface CoachSession {
  id: string
  user_id: string
  application_id: string | null
  company: string
  role: string
  session_type: CoachSessionType
  messages: CoachMessage[]
  question_count: number
  avg_score: number | null
  created_at: string
}


export interface AnalysisResult {
  score: number
  summary: string
  keywords_found: string[]
  keywords_missing: string[]
  skills_strong: string[]
  skills_partial: { skill: string; reason: string }[]
  skills_missing: string[]
  suggestions: string[]
  ats_issues: string[]
  bullet_rewrites: { original: string; improved: string }[]
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  job_type: string | null
  experience_level: string | null
  target_roles: string[]
  target_companies: string[]
  plan: 'free' | 'pro'
  stripe_customer_id: string | null
  subscription_id: string | null
  /** 'daily' | 'weekly' | 'instant' | 'never' */
  email_digest: string | null
  follow_up_days: number | null
  interview_prep_days: number | null
  created_at: string
}

export interface ActivityLogEntry {
  id: string
  user_id: string
  application_id: string
  event_type: string
  event_data: Record<string, unknown>
  created_at: string
}
