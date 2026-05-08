'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { generateOutreachEmail, getRecruiterFeed, getResumes, sendOutreachEmail } from '@/services/careers'
import type { CareerResume, GeneratedOutreach, RecruiterFeedItem } from '@/types/careers'

export default function CareersOutreachPage() {
  const [resumes, setResumes] = useState<CareerResume[]>([])
  const [recruiters, setRecruiters] = useState<RecruiterFeedItem[]>([])
  const [resumeId, setResumeId] = useState('')
  const [postId, setPostId] = useState('')
  const [draft, setDraft] = useState<GeneratedOutreach | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getResumes(), getRecruiterFeed()]).then(([resumeData, recruiterData]) => {
      setResumes(resumeData)
      setRecruiters(recruiterData)
      setResumeId(resumeData[0]?.id || '')
      setPostId(recruiterData[0]?.recruiter_post_id || '')
    }).catch(() => {})
  }, [])

  async function handleGenerate() {
    if (!resumeId || !postId) return
    setError(null)
    const generated = await generateOutreachEmail({ recruiter_post_id: postId, resume_id: resumeId }).catch((err: Error) => {
      setError(err.message)
      return null
    })
    if (!generated) return
    setDraft(generated)
    setSubject(generated.subject)
    setBody(generated.body)
    setStatus('Draft generated. Review and approve before sending.')
  }

  async function handleSend() {
    if (!resumeId || !postId || !subject || !body) return
    setError(null)
    const sent = await sendOutreachEmail({ recruiter_post_id: postId, resume_id: resumeId, subject, body }).catch((err: Error) => {
      setError(err.message)
      return null
    })
    if (!sent) return
    setStatus(`Email sent successfully with status: ${sent.sent_status}.`)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Draft controls</h2>
          <p className="text-sm text-slate-500">Choose a resume and recruiter post before generating outreach.</p>
        </div>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Resume
          <select value={resumeId} onChange={(event) => setResumeId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>{resume.parsed_name || 'Uploaded resume'} • {new Date(resume.created_at).toLocaleDateString()}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Recruiter post
          <select value={postId} onChange={(event) => setPostId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
            {recruiters.map((item) => (
              <option key={item.recruiter_post_id} value={item.recruiter_post_id}>{item.role || 'Open role'} • {item.company || item.recruiter_name}</option>
            ))}
          </select>
        </label>
        <Button onClick={handleGenerate} className="w-full rounded-xl">Generate AI cold email</Button>
        {draft ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="flex items-center gap-2">
              <Badge variant="success">{draft.match.score}% ATS match</Badge>
              <span className="text-sm text-emerald-800">Manual approval required</span>
            </div>
            <p className="mt-3 text-sm text-emerald-900">{draft.match.summary}</p>
            {draft.match.missing_skills.length ? (
              <p className="mt-2 text-sm text-emerald-900">Missing skills: {draft.match.missing_skills.join(', ')}</p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Approval workspace</h2>
          <p className="text-sm text-slate-500">Edit the generated email before sending it through Gmail.</p>
        </div>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Subject
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Generated subject line" />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Email body
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={14} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSend} className="rounded-xl px-5">Approve and send</Button>
          {status ? <span className="text-sm text-emerald-700">{status}</span> : null}
          {error ? <span className="text-sm text-rose-600">{error}</span> : null}
        </div>
      </Card>
    </div>
  )
}

