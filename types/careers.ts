export interface Resume {
  id: string
  user_id: string
  filename: string
  original_name: string
  file_path: string
  file_size: number
  mime_type: string
  parsed_skills: string[]
  parsed_experience: Experience[]
  parsed_education: Education[]
  parsed_projects: Project[]
  parsed_summary: string | null
  created_at: string
  updated_at: string
}

export interface Experience {
  title: string
  company: string
  duration: string
  description?: string
}

export interface Education {
  degree: string
  institution: string
  year: string
}

export interface Project {
  name: string
  description?: string
  technologies?: string[]
}

export interface GmailConnection {
  id: string
  user_id: string
  email: string
  scopes: string[]
  is_active: boolean
  emails_sent_today: number
  daily_limit: number
  token_expiry: string | null
  created_at: string
  updated_at: string
}

export interface Recruiter {
  id: string
  user_id: string
  name: string
  email: string | null
  company: string | null
  linkedin_url: string | null
  is_verified: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RecruiterPost {
  id: string
  user_id: string
  recruiter_id: string
  title: string
  company: string
  content: string
  post_url: string | null
  location: string | null
  required_skills: string[]
  experience_level: string | null
  salary_range: string | null
  ats_match_score: number | null
  is_saved: boolean
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  recruiter_post_id: string
  resume_id: string | null
  subject: string | null
  body: string | null
  status: 'pending' | 'sent' | 'replied' | 'rejected' | 'no_response'
  ats_score: number | null
  sent_at: string | null
  replied_at: string | null
  follow_up_sent: boolean
  follow_up_at: string | null
  created_at: string
  updated_at: string
}

export interface AnalyticsSummary {
  total_applications: number
  sent: number
  replied: number
  rejected: number
  no_response: number
  pending: number
  response_rate: number
  avg_ats_score: number
}