export interface CareerResume {
  id: string
  file_url: string
  parsed_name: string | null
  extracted_skills: string[]
  extracted_projects: string[]
  extracted_education: string[]
  extracted_experience: Array<Record<string, unknown>>
  created_at: string
}

export interface CareerMatch {
  score: number
  missing_skills: string[]
  summary: string
}

export interface RecruiterFeedItem {
  recruiter_post_id: string
  recruiter_id?: string | null
  recruiter_name: string
  company?: string | null
  email?: string | null
  role?: string | null
  location?: string | null
  source_url: string
  source_platform?: string | null
  post_content: string
  extracted_skills: string[]
  match: CareerMatch
}

export interface RecruiterSearchPayload {
  query_terms?: string[]
  location?: string
  limit?: number
  resume_id?: string
  auto_from_resume?: boolean
}

export interface CareerApplication {
  id: string
  recruiter_id?: string | null
  recruiter_post_id?: string | null
  email_subject: string
  email_body: string
  match_percentage: number
  missing_skills: string[]
  match_summary?: string | null
  sent_status: string
  reply_status: 'pending' | 'replied' | 'rejected' | 'no_response' | string
  created_at: string
}

export interface CareerAnalytics {
  total_applications: number
  pending_replies: number
  recruiter_responses: number
  response_rate: number
  recent_outreach: CareerApplication[]
}

export interface GeneratedOutreach {
  subject: string
  body: string
  match: CareerMatch
}

export interface CareerFollowUp {
  id: string
  application_id: string
  subject: string
  body: string
  sent_status: string
  gmail_message_id: string | null
  created_at: string
}

export interface GmailConnectionStatus {
  id: string
  email: string
  is_active: boolean
  emails_sent_today: number
  daily_limit: number
  created_at: string
}
