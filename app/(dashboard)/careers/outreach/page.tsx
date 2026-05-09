'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Send, Bot } from 'lucide-react'
import toast from 'react-hot-toast'

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
  const [customNotes, setCustomNotes] = useState('')
  const [draft, setDraft] = useState<GeneratedOutreach | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    Promise.all([getResumes(), getRecruiterFeed()])
      .then(([resumeData, recruiterData]) => {
        setResumes(resumeData)
        setRecruiters(recruiterData)
        setResumeId(resumeData[0]?.id || '')
        setPostId(recruiterData[0]?.recruiter_post_id || '')
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Could not load resumes or recruiter feed.'))
      .finally(() => setDataLoading(false))
  }, [])

  async function handleGenerate() {
    if (!resumeId || !postId) {
      toast.error('Please select a resume and a recruiter post first.')
      return
    }
    setGenerating(true)
    const toastId = toast.loading('Generating personalized email…')
    try {
      const generated = await generateOutreachEmail({
        recruiter_post_id: postId,
        resume_id: resumeId,
        custom_notes: customNotes || undefined,
      })
      setDraft(generated)
      setSubject(generated.subject)
      setBody(generated.body)
      toast.success('Draft generated. Review before sending.', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed.', { id: toastId })
    } finally {
      setGenerating(false)
    }
  }

  async function handleSend() {
    if (!resumeId || !postId || !subject || !body) {
      toast.error('Fill in the subject and body before sending.')
      return
    }
    setSending(true)
    const toastId = toast.loading('Sending email…')
    try {
      const sent = await sendOutreachEmail({ recruiter_post_id: postId, resume_id: resumeId, subject, body })
      toast.success(`Email sent! Status: ${sent.sent_status}.`, { id: toastId })
      setDraft(null)
      setSubject('')
      setBody('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed.', { id: toastId })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px,minmax(0,1fr)]">
      {/* Controls panel */}
      <Card className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AI outreach generator</h2>
          <p className="text-sm text-slate-500">Choose a resume and recruiter post, then generate a personalized cold email.</p>
        </div>

        {dataLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-11 rounded-xl" />
            <div className="skeleton h-11 rounded-xl" />
          </div>
        ) : (
          <>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Resume
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {!resumes.length && <option value="">No resumes uploaded</option>}
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.parsed_name || 'Uploaded resume'} · {new Date(resume.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Recruiter post
              <select
                value={postId}
                onChange={(e) => setPostId(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {!recruiters.length && <option value="">No recruiter posts — search first</option>}
                {recruiters.map((item) => (
                  <option key={item.recruiter_post_id} value={item.recruiter_post_id}>
                    {item.role || 'Open role'} · {item.company || item.recruiter_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Custom notes (optional)
              <Input
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="E.g. mention SQL expertise, available to join immediately…"
                className="mt-1"
              />
            </label>
          </>
        )}

        <Button 
          onClick={() => {
            if (!resumeId || !postId) {
              toast.error(
                !resumeId 
                  ? 'Please upload a resume in the "Resume" tab first.' 
                  : 'Please search for recruiters in the "Recruiters" tab first.'
              )
              return
            }
            handleGenerate()
          }} 
          disabled={generating} 
          className="w-full rounded-xl"
        >
          <Bot className="h-4 w-4 mr-2" />
          {generating ? 'Generating…' : 'Generate AI cold email'}
        </Button>

        {!resumes.length && (
          <p className="mt-2 text-xs text-amber-600 font-medium">
            ⚠️ No resumes found. <Link href="/careers/resume" className="underline">Go to Resume tab</Link> to upload one.
          </p>
        )}
        {!recruiters.length && (
          <p className="mt-1 text-xs text-amber-600 font-medium">
            ⚠️ No recruiter posts found. <Link href="/careers/recruiters" className="underline">Go to Recruiters tab</Link> to find posts.
          </p>
        )}

        {draft && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{draft.match.score}% ATS match</Badge>
              <span className="text-xs font-semibold text-emerald-700">Manual approval required</span>
            </div>
            <p className="text-sm text-emerald-900">{draft.match.summary}</p>
            {draft.match.missing_skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-800 mb-1.5">Missing skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.match.missing_skills.map((s) => (
                    <Badge key={s} variant="warning">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Approval workspace */}
      <Card className="space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Approval workspace</h2>
            <p className="text-sm text-slate-500">Edit the draft before sending. Emails go out via Gmail.</p>
          </div>
        </div>

        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          Subject line
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Generated subject line appears here"
            className="mt-1"
          />
        </label>

        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          Email body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            placeholder="AI-generated email body will appear here after you click Generate…"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 resize-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => {
              if (!subject || !body) {
                toast.error('Please generate or write a subject and body first.')
                return
              }
              handleSend()
            }}
            disabled={sending}
            className="rounded-xl px-5"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending…' : 'Approve and send'}
          </Button>
          {!draft && !body && (
            <p className="text-sm text-slate-400">Generate an email first using the controls on the left.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
