'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, FileText, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getResumes, uploadResume } from '@/services/careers'
import type { CareerResume } from '@/types/careers'

function ResumeSkeleton() {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        <div className="skeleton h-5 w-20 rounded" />
      </div>
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-5 w-14 rounded-md" />)}
      </div>
    </Card>
  )
}

export default function CareersResumePage() {
  const [resumes, setResumes] = useState<CareerResume[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    const data = await getResumes()
    setResumes(data)
  }

  useEffect(() => {
    refresh()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    const toastId = toast.loading(`Uploading ${file.name}…`)
    try {
      const created = await uploadResume(file)
      setResumes((current) => [created, ...current])
      event.target.value = ''
      toast.success(`Resume parsed successfully: ${created.extracted_skills.length} skills extracted.`, { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
      {/* Upload panel */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upload resume</h2>
          <p className="text-sm text-slate-500">Securely upload PDF or DOCX files for skills extraction and outreach personalization.</p>
        </div>

        <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.9),rgba(255,255,255,0.95))] px-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            {uploading ? (
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
            ) : (
              <Upload className="h-6 w-6 text-emerald-600" />
            )}
          </div>
          <span className="text-base font-semibold text-slate-900">
            {uploading ? 'Parsing resume…' : 'Choose resume file'}
          </span>
          <span className="text-sm text-slate-500">PDF or DOCX · up to 8 MB</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>

        <Button
          onClick={() => refresh().catch(() => toast.error('Refresh failed.'))}
          variant="secondary"
          className="w-full rounded-xl"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh parsed resumes
        </Button>
      </Card>

      {/* Resume list */}
      <div className="space-y-4">
        {loading ? (
          [...Array(2)].map((_, i) => <ResumeSkeleton key={i} />)
        ) : resumes.length ? (
          resumes.map((resume) => (
            <Card key={resume.id} className="space-y-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <FileText className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{resume.parsed_name || 'Uploaded resume'}</h2>
                    <p className="text-xs text-slate-500">{new Date(resume.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                  ID {resume.id.slice(0, 8)}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Extracted skills</p>
                <div className="flex flex-wrap gap-2">
                  {resume.extracted_skills.length ? (
                    resume.extracted_skills.map((skill) => <Badge key={skill}>{skill}</Badge>)
                  ) : (
                    <span className="text-sm text-slate-500">No skills extracted.</span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Projects</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    {resume.extracted_projects.slice(0, 4).map((project) => (
                      <li key={project} className="flex items-start gap-1.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        {project}
                      </li>
                    ))}
                    {!resume.extracted_projects.length && <li className="text-slate-400">None extracted.</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Education</p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    {resume.extracted_education.slice(0, 4).map((entry) => (
                      <li key={entry} className="flex items-start gap-1.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                        {entry}
                      </li>
                    ))}
                    {!resume.extracted_education.length && <li className="text-slate-400">None extracted.</li>}
                  </ul>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="py-14 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <FileText className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900">No resumes uploaded</p>
              <p className="max-w-sm text-sm text-slate-500">
                Upload a PDF or DOCX resume to auto-extract your skills, projects, and experience.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
