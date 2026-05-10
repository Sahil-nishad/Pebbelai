'use client'

import { useEffect, useState } from 'react'
import { Radar, Search, Loader2, UserPlus, Check, MessageSquare, Trash2 } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import * as careers from '@/services/careers'
import type { Recruiter, RecruiterPost } from '@/types/careers'

export default function CareersRecruitersPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [posts, setPosts] = useState<RecruiterPost[]>([])
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'recruiters' | 'posts'>('recruiters')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user?.id])

  const loadData = async () => {
    try {
      const [recruitersData, postsData] = await Promise.all([
        careers.getRecruiters(),
        careers.getPosts(),
      ])
      setRecruiters(recruitersData)
      setPosts(postsData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!search.trim()) return
    setLoading(true)
    try {
      const data = await careers.getRecruiters(search)
      setRecruiters(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRecruiter = async () => {
    const name = prompt('Recruiter name:')
    if (!name) return
    const company = prompt('Company (optional):') || undefined
    const email = prompt('Email (optional):') || undefined
    const linkedin = prompt('LinkedIn URL (optional):') || undefined

    try {
      const recruiter = await careers.createRecruiter({ name, company, email, linkedin_url: linkedin })
      setRecruiters(prev => [recruiter, ...prev])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSavePost = async (postId: string, saved: boolean) => {
    try {
      const updated = await careers.savePost(postId, saved)
      setPosts(prev => prev.map(p => p.id === postId ? updated : p))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recruiter Feed</h1>
        <p className="text-slate-500 mt-1">Discover and track recruiter hiring posts</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setView('recruiters')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'recruiters' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Recruiters
        </button>
        <button
          onClick={() => setView('posts')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'posts' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Posts
        </button>
      </div>

      {view === 'recruiters' && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search recruiters..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
          <button
            onClick={handleAddRecruiter}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : view === 'recruiters' ? (
        recruiters.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
            <Radar className="h-8 w-8 mx-auto text-slate-400" />
            <p className="mt-2 text-slate-600">No recruiters found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recruiters.map(recruiter => (
              <div
                key={recruiter.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  {recruiter.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{recruiter.name}</p>
                  <p className="text-sm text-slate-500 truncate">{recruiter.company}</p>
                </div>
                {recruiter.is_verified && (
                  <Check className="h-4 w-4 text-emerald-600" />
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        posts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
            <Radar className="h-8 w-8 mx-auto text-slate-400" />
            <p className="mt-2 text-slate-600">No posts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div
                key={post.id}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{post.title}</p>
                  <p className="text-sm text-slate-500">{post.company} • {post.location}</p>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{post.content}</p>
                  {post.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.required_skills.slice(0, 5).map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleSavePost(post.id, !post.is_saved)}
                  className={`p-2 rounded-lg transition-colors ${
                    post.is_saved
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}