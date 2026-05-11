'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Upload, 
  Loader2, 
  AlertCircle, 
  Check, 
  Trash2, 
  Sparkles
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import * as careers from '@/services/careers'
import type { Resume } from '@/types/careers'
import { cn } from '@/lib/utils'

export default function CareersResumePage() {
  const { user } = useUser()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
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

  const handleUpload = async (file: File) => {
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
    try {
      await careers.deleteResume(id)
      setResumes(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
            <FileText className="h-3 w-3" />
            Resume Parsing Active
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Resume <span className="text-indigo-600">Vault</span>
          </h1>
          <p className="text-slate-500 mt-2">
            Store and manage multiple versions of your resume for different roles.
          </p>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 shadow-sm"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative group cursor-pointer rounded-[2.5rem] border-2 border-dashed p-12 transition-all duration-300",
          dragActive 
            ? "border-indigo-400 bg-indigo-50/50 scale-[1.01]" 
            : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50"
        )}
        onClick={() => fileInput.current?.click()}
      >
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          className="hidden"
        />
        
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            "p-5 rounded-[2rem] transition-all duration-500",
            uploading ? "bg-indigo-100 animate-pulse" : "bg-indigo-50 group-hover:scale-110"
          )}>
            {uploading ? (
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-indigo-600" />
            )}
          </div>
          <div className="mt-6 space-y-2">
            <h3 className="text-xl font-bold text-slate-900">
              {uploading ? "Uploading your resume..." : "Drop your resume here"}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Support PDF, DOCX up to 8MB. AI will automatically parse skills and experience.
            </p>
          </div>
          {!uploading && (
            <div className="mt-8 px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 transition-all">
              Choose File
            </div>
          )}
        </div>
      </motion.div>

      {/* Resume List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-bold text-slate-900">Your Resumes</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{resumes.length} Total</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 w-full bg-slate-50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-12 text-center">
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <p className="mt-4 text-slate-500 font-medium">No resumes found. Upload your first one above!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {resumes.map((resume, i) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative flex items-center gap-4 p-5 rounded-[2rem] border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-md transition-all"
                >
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <FileText className="h-7 w-7" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 truncate">{resume.original_name}</p>
                      {i === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider">Default</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-slate-500 font-medium">
                        {(resume.file_size / 1024).toFixed(1)} KB • {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                      {resume.parsed_skills?.length > 0 && (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                          <Sparkles className="h-3 w-3" />
                          AI Parsed
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="p-3 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}