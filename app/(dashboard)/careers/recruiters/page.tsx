'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getRecruiterFeed, searchRecruiters } from '@/services/careers'
import type { RecruiterFeedItem } from '@/types/careers'

export default function CareersRecruitersPage() {
  const [items, setItems] = useState<RecruiterFeedItem[]>([])
  const [query, setQuery] = useState('data analyst hiring, business analyst hiring')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRecruiterFeed().then(setItems).catch(() => {})
  }, [])

  async function handleSearch() {
    setLoading(true)
    setError(null)
    try {
      const results = await searchRecruiters({
        query_terms: query.split(',').map((item) => item.trim()).filter(Boolean),
        limit: 10,
      })
      setItems(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,244,0.95))]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 pl-9" placeholder="Search terms separated by commas" />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="h-11 rounded-xl px-5">
            {loading ? 'Searching...' : 'Refresh recruiter feed'}
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </Card>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.recruiter_post_id} hover className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">{item.role || 'Open role'}</h2>
                  <Badge variant="success">{item.match.score}% match</Badge>
                  {item.email ? <Badge variant="info">{item.email}</Badge> : <Badge variant="ghost">Email not found</Badge>}
                </div>
                <p className="text-sm text-slate-600">
                  {item.recruiter_name} {item.company ? `at ${item.company}` : ''} {item.location ? `• ${item.location}` : ''}
                </p>
                <p className="text-sm text-slate-500">{item.match.summary}</p>
              </div>
              <a href={item.source_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                Open source
              </a>
            </div>
            <p className="text-sm leading-6 text-slate-600">{item.post_content}</p>
            <div className="flex flex-wrap gap-2">
              {item.extracted_skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}
            </div>
          </Card>
        ))}
        {!items.length ? <Card className="text-sm text-slate-500">No recruiter posts yet. Run a recruiter search to populate the feed.</Card> : null}
      </div>
    </div>
  )
}

