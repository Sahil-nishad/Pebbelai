'use client'

import { useEffect, useState } from 'react'
import { Mail, Loader2, Send, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import * as careers from '@/services/careers'
import type { Application, RecruiterPost } from '@/types/careers'

const statusIcons = {
  pending: Clock,
  sent: Send,
  replied: CheckCircle,
  rejected: XCircle,
  no_response: XCircle,
}

const statusColors = {
  pending: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  replied: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  no_response: 'bg-slate-100 text-slate-500',
}

export default function CareersOutreachPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [posts, setPosts] = useState<RecruiterPost[]>([])
  const [selectedPost, setSelectedPost] = useState<RecruiterPost | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user?.id])

  const loadData = async () => {
    try {
      const [apps, postsData] = await Promise.all([
        careers.getApplications(),
        careers.getPosts(),
      ])
      setApplications(apps)
      setPosts(postsData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateEmail = async (postId: string) => {
    setGenerating(true)
    try {
      // AI generation would happen here - for now just create a pending application
      const app = await careers.createApplication({
        recruiter_post_id: postId,
        subject: `Application for ${postId}`,
        body: 'Generated email content would go here...',
        status: 'pending',
      })
      setApplications(prev => [app, ...prev])
      setSelectedPost(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSendEmail = async (appId: string) => {
    try {
      const updated = await careers.updateApplication(appId, { status: 'sent' })
      setApplications(prev => prev.map(a => a.id === appId ? updated : a))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Outreach Center</h1>
        <p className="text-slate-500 mt-1">Generate and send personalized outreach emails</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Posts to Apply */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Available Posts</h2>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No posts available</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {posts.map(post => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedPost?.id === post.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <p className="font-medium text-slate-900">{post.title}</p>
                  <p className="text-sm text-slate-500">{post.company}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Applications */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Your Applications</h2>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : applications.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No applications yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {applications.map(app => {
                const StatusIcon = statusIcons[app.status]
                return (
                  <div
                    key={app.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-200"
                  >
                    <StatusIcon className="h-4 w-4 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{app.subject}</p>
                      <p className="text-sm text-slate-500">{app.status}</p>
                    </div>
                    {app.status === 'pending' && (
                      <button
                        onClick={() => handleSendEmail(app.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">Generate Email</h3>
            <p className="text-sm text-slate-500 mt-1">
              Generate personalized email for {selectedPost.title} at {selectedPost.company}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedPost(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerateEmail(selectedPost.id)}
                disabled={generating}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}