'use client'

import { useEffect, useState } from 'react'
import { Search, Radar, ExternalLink, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getRecruiterFeed, getResumes, searchRecruiters } from '@/services/careers'
import type { CareerResume, RecruiterFeedItem } from '@/types/careers'

const DEFAULT_QUERY = 'data analyst hiring, business analyst hiring'

function RecruiterSkeleton() {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-48 rounded" />
          <div className="skeleton h-4 w-64 rounded" />
          <div className="skeleton h-4 w-56 rounded" />
        </div>
        <div className="skeleton h-6 w-12 rounded-full" />
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-5 w-16 rounded-md" />)}
      </div>
    </Card>
  )
}

export default function CareersRecruitersPage() {
  const [items, setItems] = useState<RecruiterFeedItem[]>([])
  const [resumes, setResumes] = useState<CareerResume[]>([])
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getRecruiterFeed(), getResumes()])
      .then(async ([feed, resumeData]) => {
        setItems(feed)
        setResumes(resumeData)
        if (!feed.length && resumeData.length) {
          const results = await searchRecruiters({
            resume_id: resumeData[0].id,
            auto_from_resume: true,
            query_terms: DEFAULT_QUERY.split(',').map((item) => item.trim()).filter(Boolean),
            limit: 12,
          })
          setItems(results)
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load feed.')
      })
      .finally(() => setLoading(false))
  }, [])

  async function runResumeSearch(resume: CareerResume, silent = false) {
    const toastId = silent ? null : toast.loading('Finding recruiter posts from your resume...')
    const results = await searchRecruiters({
      resume_id: resume.id,
      auto_from_resume: true,
      query_terms: query.split(',').map((item) => item.trim()).filter(Boolean),
      location: location || undefined,
      limit: 12,
    })
    if (toastId) {
      toast.success(`Found ${results.length} recruiter posts.`, { id: toastId })
    }
    return results
  }

  async function handleSearch() {
    setSearching(true)
    setError(null)
    const toastId = toast.loading('Scanning recruiter posts...')
    try {
      const results = await searchRecruiters({
        query_terms: query.split(',').map((item) => item.trim()).filter(Boolean),
        location: location || undefined,
        resume_id: resumes[0]?.id,
        auto_from_resume: Boolean(resumes[0]),
        limit: 12,
      })
      setItems(results)
      toast.success(`Found ${results.length} recruiter posts.`, { id: toastId })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Search failed.'
      setError(msg)
      toast.error(msg, { id: toastId })
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,244,0.95))]">
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">Resume-powered recruiter discovery</p>
            <p className="text-sm text-slate-600">
              This tab can scan LinkedIn, Naukri, Indeed, Wellfound, Glassdoor, and public career pages for hiring posts that fit the skills in your uploaded resume.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-11 pl-9"
              placeholder="Search terms separated by commas"
            />
          </div>
          <Input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="h-11 lg:w-52"
            placeholder="Location (optional)"
          />
          <Button onClick={handleSearch} disabled={searching} className="h-11 rounded-xl px-5">
            {searching ? 'Scanning recruiters...' : 'Refresh recruiter feed'}
          </Button>
          <Button
            variant="secondary"
            disabled={searching || !resumes.length}
            onClick={async () => {
              if (!resumes.length) {
                toast.error('Upload a resume first so the agent can find matching recruiter posts.')
                return
              }
              setSearching(true)
              setError(null)
              try {
                const results = await runResumeSearch(resumes[0])
                setItems(results)
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'Resume-based search failed.'
                setError(msg)
                toast.error(msg)
              } finally {
                setSearching(false)
              }
            }}
            className="h-11 rounded-xl px-5"
          >
            Match my resume
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </Card>

      <div className="grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <RecruiterSkeleton key={i} />)
        ) : items.length ? (
          items.map((item) => (
            <Card key={item.recruiter_post_id} hover className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{item.role || 'Open role'}</h2>
                    <Badge variant={item.match.score >= 70 ? 'success' : item.match.score >= 40 ? 'warning' : 'ghost'}>
                      {item.match.score}% match
                    </Badge>
                    <Badge variant="ghost">{item.source_platform || 'web'}</Badge>
                    {item.email ? (
                      <Badge variant="info">{item.email}</Badge>
                    ) : (
                      <Badge variant="ghost">Email not found</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    {item.recruiter_name}
                    {item.company ? ` at ${item.company}` : ''}
                    {item.location ? ` · ${item.location}` : ''}
                  </p>
                  <p className="text-sm text-slate-500">{item.match.summary}</p>
                </div>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 shrink-0"
                >
                  Open source <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="text-sm leading-6 text-slate-600 line-clamp-4">{item.post_content}</p>
              <div className="flex flex-wrap gap-2">
                {item.extracted_skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </Card>
          ))
        ) : (
          <Card className="py-14 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Radar className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900">No recruiter posts yet</p>
              <p className="max-w-sm text-sm text-slate-500">
                Upload a resume and run a search to let the platform agent discover matching recruiter posts.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
