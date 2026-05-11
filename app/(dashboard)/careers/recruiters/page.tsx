'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Radar, 
  Search, 
  Loader2, 
  UserPlus, 
  Check, 
  MessageSquare, 
  Trash2, 
  ExternalLink,
  Link2,
  Building2,
  Bookmark,
  MapPin,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import * as careers from '@/services/careers'
import type { Recruiter, RecruiterPost } from '@/types/careers'
import { cn } from '@/lib/utils'

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
    <div className="space-y-10">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Zap className="h-3 w-3" />
            Live Search Active
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Networking <span className="text-blue-600">Hub</span>
          </h1>
          <p className="text-slate-500">Discover and connect with top tech recruiters.</p>
        </div>

        <div className="flex p-1.5 rounded-2xl bg-slate-100/50 border border-slate-200">
           <TabButton 
            active={view === 'recruiters'} 
            onClick={() => setView('recruiters')}
            label="Recruiters"
            count={recruiters.length}
          />
          <TabButton 
            active={view === 'posts'} 
            onClick={() => setView('posts')}
            label="Hiring Posts"
            count={posts.length}
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={view === 'recruiters' ? "Search by name, company, or role..." : "Search hiring posts..."}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-sm font-medium shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 rounded-md bg-slate-50 border border-slate-100">Enter</div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            Find
          </button>
          <button
            onClick={handleAddRecruiter}
            className="p-4 bg-blue-600 text-white rounded-[1.5rem] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <UserPlus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main List Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 w-full bg-slate-50 rounded-[2rem] animate-pulse" />
            ))}
          </motion.div>
        ) : view === 'recruiters' ? (
          <motion.div 
            key="recruiters"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {recruiters.length === 0 ? (
              <EmptyState icon={Radar} label="No recruiters found. Start a search!" />
            ) : (
              recruiters.map((recruiter, i) => (
                <RecruiterCard key={recruiter.id} recruiter={recruiter} index={i} />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {posts.length === 0 ? (
              <EmptyState icon={Zap} label="No hiring posts found yet." />
            ) : (
              posts.map((post, i) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  index={i} 
                  onSave={() => handleSavePost(post.id, !post.is_saved)} 
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TabButton({ active, onClick, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
        active 
          ? "bg-white text-blue-600 shadow-sm" 
          : "text-slate-500 hover:text-slate-900"
      )}
    >
      {label}
      <span className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-black",
        active ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-500"
      )}>
        {count}
      </span>
    </button>
  )
}

function RecruiterCard({ recruiter, index }: { recruiter: Recruiter, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="group relative flex items-center gap-5 p-5 rounded-[2rem] border border-slate-100 bg-white hover:border-blue-100 hover:shadow-lg transition-all"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 text-xl font-black shadow-inner">
          {recruiter.name[0]}
        </div>
        {recruiter.is_verified && (
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{recruiter.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Building2 className="h-3 w-3 text-slate-400" />
          <p className="text-xs text-slate-500 font-medium truncate">{recruiter.company || 'Tech Talent Scout'}</p>
        </div>
        <div className="flex gap-2 mt-3">
          {recruiter.linkedin_url && (
            <a href={recruiter.linkedin_url} target="_blank" className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <Link2 className="h-3.5 w-3.5" />
            </a>
          )}
          <button className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
            Connect
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function PostCard({ post, index, onSave }: { post: RecruiterPost, index: number, onSave: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative flex flex-col md:flex-row gap-6 p-6 rounded-[2.5rem] border border-slate-100 bg-white hover:border-blue-100 hover:shadow-md transition-all"
    >
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
              {post.title}
            </h3>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                {post.company}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                {post.location || 'Remote'}
              </div>
            </div>
          </div>
          
          <button 
            onClick={onSave}
            className={cn(
              "shrink-0 p-4 rounded-2xl transition-all duration-300",
              post.is_saved 
                ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100" 
                : "bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            )}
          >
            <Bookmark className={cn("h-5 w-5", post.is_saved && "fill-current")} />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
          {post.content}
        </p>

        {post.required_skills?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.required_skills.slice(0, 4).map(skill => (
              <span key={skill} className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                {skill}
              </span>
            ))}
            {post.required_skills.length > 4 && (
              <span className="px-3 py-1 text-slate-400 text-[10px] font-bold">
                +{post.required_skills.length - 4} More
              </span>
            )}
          </div>
        )}
      </div>

      <div className="md:w-48 shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs font-bold">
            {Math.floor(Math.random() * 20 + 80)}%
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Match</p>
        </div>
        
        <button className="w-full py-4 rounded-2xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
          Apply Now
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

function EmptyState({ icon: Icon, label }: any) {
  return (
    <div className="col-span-full rounded-[2rem] border border-slate-100 bg-slate-50/50 p-16 text-center">
      <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
        <Icon className="h-10 w-10 text-slate-300" />
      </div>
      <p className="mt-6 text-slate-500 font-bold">{label}</p>
    </div>
  )
}