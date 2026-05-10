'use client'

import { useEffect, useState, useRef } from 'react'
import { FileText, Upload, Loader2, AlertCircle, Check, Trash2 } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import * as careers from '@/services/careers'
import type { Resume } from '@/types/careers'

export default function CareersResumePage() {
  const { user } = useUser()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    loadResumes()
  }, [user?.id])

  const loadResumes = async () => {
    try {
      const data = await careers.getResumes()
      setResumes(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/careers/resume/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload resume')

      const resume = await response.json()
      setResumes(prev => [resume, ...prev])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resume?')) return
    try {
      await careers.deleteResume(id)
      setResumes(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resume Manager</h1>
        <p className="text-slate-500 mt-1">Upload and manage your resumes</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.docx"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading...' : 'Upload Resume'}
        </button>
        <p className="mt-2 text-sm text-slate-500">Supports PDF and DOCX files</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : resumes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <FileText className="h-8 w-8 mx-auto text-slate-400" />
          <p className="mt-2 text-slate-600">No resumes uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map(resume => (
            <div
              key={resume.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white"
            >
              <FileText className="h-8 w-8 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{resume.original_name}</p>
                <p className="text-sm text-slate-500">
                  {(resume.file_size / 1024).toFixed(1)} KB • {new Date(resume.created_at).toLocaleDateString()}
                </p>
              </div>
              {resume.parsed_skills?.length > 0 && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Parsed</span>
                </div>
              )}
              <button
                onClick={() => handleDelete(resume.id)}
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}