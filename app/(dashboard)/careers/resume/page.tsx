'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getResumes, uploadResume } from '@/services/careers'
import type { CareerResume } from '@/types/careers'

export default function CareersResumePage() {
  const [resumes, setResumes] = useState<CareerResume[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const data = await getResumes()
    setResumes(data)
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [])

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const created = await uploadResume(file)
      setResumes((current) => [created, ...current])
      event.target.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upload resume</h2>
          <p className="text-sm text-slate-500">Securely upload PDF or DOCX files for skills extraction and outreach personalization.</p>
        </div>
        <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.9),rgba(255,255,255,0.95))] px-6 text-center">
          <span className="text-base font-semibold text-slate-900">{uploading ? 'Uploading...' : 'Choose resume file'}</span>
          <span className="mt-2 text-sm text-slate-500">PDF or DOCX, up to 8 MB</span>
          <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleUpload} />
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button onClick={() => refresh().catch(() => {})} variant="secondary" className="w-full rounded-xl">Refresh parsed resumes</Button>
      </Card>

      <div className="space-y-4">
        {resumes.map((resume) => (
          <Card key={resume.id} className="space-y-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{resume.parsed_name || 'Uploaded resume'}</h2>
                <p className="text-sm text-slate-500">{new Date(resume.created_at).toLocaleString()}</p>
              </div>
              <span className="text-sm font-semibold text-emerald-700">Resume ID: {resume.id.slice(0, 8)}</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Extracted skills</p>
              <div className="flex flex-wrap gap-2">
                {resume.extracted_skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}
                {!resume.extracted_skills.length ? <span className="text-sm text-slate-500">No skills extracted yet.</span> : null}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Projects</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {resume.extracted_projects.slice(0, 4).map((project) => <li key={project}>{project}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Education</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {resume.extracted_education.slice(0, 4).map((entry) => <li key={entry}>{entry}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        ))}
        {!resumes.length ? <Card className="text-sm text-slate-500">No resumes uploaded yet.</Card> : null}
      </div>
    </div>
  )
}
