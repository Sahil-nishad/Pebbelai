'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  Loader2, 
  Send, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Sparkles, 
  Activity, 
  History, 
  Plus, 
  ArrowRight,
  MessageSquare,
  Trash2,
  Copy,
  ExternalLink,
  Zap,
  Target
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import * as careers from '@/services/careers'
import type { Application, RecruiterPost } from '@/types/careers'
import { cn } from '@/lib/utils'

const statusIcons: any = {
  pending: Clock,
  sent: Send,
  replied: CheckCircle,
  rejected: XCircle,
  no_response: XCircle,
}

const statusColors: any = {
  pending: 'text-amber-500 bg-amber-50',
  sent: 'text-blue-500 bg-blue-50',
  replied: 'text-emerald-500 bg-emerald-50',
  rejected: 'text-red-500 bg-red-50',
  no_response: 'text-slate-400 bg-slate-50',
}

export default function CareersOutreachPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [posts, setPosts] = useState<RecruiterPost[]>([])
  const [selectedPost, setSelectedPost] = useState<RecruiterPost | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator')

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
    setError(null)
    try {
      const app = await careers.createApplication({
        recruiter_post_id: postId,
        subject: `Application for ${postId}`,
        body: 'Generated email content would go here...',
        status: 'pending',
      })
      setApplications(prev => [app, ...prev])
      setSelectedPost(null)
      setActiveTab('history')
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
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Activity className="h-3 w-3" />
            AI Outreach Active
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Outreach <span className="text-emerald-600">Commander</span>
          </h1>
          <p className="text-slate-500">Generate high-conversion emails with AI and track status.</p>
        </div>

        <div className="flex p-1 rounded-2xl bg-slate-100/50 border border-slate-200">
           <button 
            onClick={() => setActiveTab('generator')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'generator' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
            )}
          >
            <Sparkles className="h-4 w-4" />
            Generator
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'history' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
            )}
          >
            <History className="h-4 w-4" />
            History
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'generator' ? (
          <motion.div 
            key="generator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            {/* Sidebar List */}
            <div className="lg:col-span-4 space-y-4">
               <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Saved Posts</h3>
                <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{posts.length}</span>
              </div>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                {loading ? (
                   [1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)
                ) : posts.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl border border-dashed border-slate-200">
                    <Target className="h-8 w-8 mx-auto text-slate-300" />
                    <p className="mt-2 text-xs text-slate-500">Save some posts first!</p>
                  </div>
                ) : (
                  posts.map(post => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all duration-300",
                        selectedPost?.id === post.id
                          ? "border-emerald-500 bg-emerald-50 shadow-md translate-x-1"
                          : "border-slate-100 bg-white hover:border-emerald-200 hover:shadow-sm"
                      )}
                    >
                      <p className="font-bold text-slate-900 truncate">{post.title}</p>
                      <p className="text-xs text-slate-500 font-medium">{post.company}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Main Stage */}
            <div className="lg:col-span-8">
              {selectedPost ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm h-full flex flex-col"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedPost.title}</h2>
                      <p className="text-slate-500 font-medium">{selectedPost.company}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-10 flex-1 flex flex-col items-center justify-center text-center p-12 rounded-[2rem] bg-slate-50 border border-dashed border-slate-200">
                     <div className="h-20 w-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                        <Activity className={cn("h-10 w-10 text-emerald-600", generating && "animate-pulse")} />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900">Personalized Outreach</h3>
                     <p className="mt-2 text-slate-500 text-sm max-w-sm">
                       AI will analyze your resume and the job description to craft a high-impact intro.
                     </p>
                     
                     <button
                        onClick={() => handleGenerateEmail(selectedPost.id)}
                        disabled={generating}
                        className="mt-8 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center gap-3"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            Draft with AI
                            <Zap className="h-4 w-4 fill-current" />
                          </>
                        )}
                      </button>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 rounded-[2.5rem] bg-slate-50/50 border border-dashed border-slate-200">
                   <div className="h-20 w-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                      <MessageSquare className="h-10 w-10 text-slate-200" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900">No Post Selected</h3>
                   <p className="mt-2 text-slate-500 text-sm max-w-sm">
                     Select a saved post from the sidebar to start drafting your personalized outreach.
                   </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {applications.length === 0 ? (
              <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-slate-50/50 p-20 text-center">
                 <History className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                 <p className="text-slate-500 font-bold">No applications history yet.</p>
              </div>
            ) : (
              applications.map((app, i) => {
                const StatusIcon = statusIcons[app.status]
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-[2.5rem] border border-slate-100 bg-white hover:border-emerald-100 hover:shadow-md transition-all"
                  >
                    <div className={cn("p-4 rounded-2xl", statusColors[app.status])}>
                      <StatusIcon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-900 truncate">{app.subject}</h3>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          statusColors[app.status]
                        )}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Last updated {new Date(app.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                       {app.status === 'pending' && (
                        <button
                          onClick={() => handleSendEmail(app.id)}
                          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
                        >
                          Send
                          <Send className="h-3 w-3" />
                        </button>
                      )}
                      <button className="p-3 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all">
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}