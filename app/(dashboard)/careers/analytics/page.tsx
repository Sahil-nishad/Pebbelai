'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Target, 
  PieChart, 
  Activity,
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import * as careers from '@/services/careers'
import type { AnalyticsSummary } from '@/types/careers'
import { cn } from '@/lib/utils'

export default function CareersAnalyticsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadAnalytics()
  }, [user?.id])

  const loadAnalytics = async () => {
    try {
      const data = await careers.getAnalytics()
      setAnalytics(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[2rem]" />)}
        </div>
        <div className="h-64 bg-slate-50 rounded-[2.5rem]" />
      </div>
    )
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Activity className="h-3 w-3" />
            Performance Insights
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Advanced <span className="text-blue-600">Analytics</span>
          </h1>
          <p className="text-slate-500">Deep dive into your job application funnel performance.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {analytics ? (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatBox 
              label="Efficiency" 
              value={`${analytics.response_rate.toFixed(1)}%`} 
              icon={Zap} 
              color="emerald" 
              desc="Response rate"
            />
            <StatBox 
              label="Reach" 
              value={analytics.sent} 
              icon={Send} 
              color="blue" 
              desc="Emails delivered"
            />
            <StatBox 
              label="Quality" 
              value={analytics.avg_ats_score.toFixed(0)} 
              icon={Target} 
              color="indigo" 
              desc="Avg. ATS match"
            />
            <StatBox 
              label="Success" 
              value={analytics.replied} 
              icon={Sparkles} 
              color="amber" 
              desc="Recruiter replies"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Conversion Funnel */}
            <motion.div variants={item} className="lg:col-span-2 rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
               <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                 <PieChart className="h-5 w-5 text-blue-500" />
                 Application Funnel
               </h3>
               
               <div className="space-y-6">
                 <FunnelStep label="Total Applications" value={analytics.total_applications} percent={100} color="bg-slate-900" />
                 <FunnelStep label="AI Outreach Sent" value={analytics.sent} percent={(analytics.sent / analytics.total_applications) * 100} color="bg-blue-600" />
                 <FunnelStep label="Recruiter Responses" value={analytics.replied} percent={(analytics.replied / analytics.total_applications) * 100} color="bg-emerald-600" />
                 <FunnelStep label="Pending Action" value={analytics.pending} percent={(analytics.pending / analytics.total_applications) * 100} color="bg-amber-500" />
               </div>
            </motion.div>

            {/* Growth Card */}
            <motion.div variants={item} className="rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
               <div className="relative z-10">
                 <h3 className="text-lg font-bold">Optimization Score</h3>
                 <div className="mt-6 flex items-baseline gap-2">
                   <span className="text-6xl font-black tracking-tighter">84</span>
                   <span className="text-xl font-bold opacity-60">/100</span>
                 </div>
                 <p className="mt-4 text-sm text-blue-100 leading-relaxed">
                   Your profile is performing better than 78% of candidates in your niche.
                 </p>
                 <div className="mt-8 p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
                   <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Recommendation</p>
                   <p className="text-sm font-medium">Add 3 more case studies to increase your ATS match for Senior roles.</p>
                 </div>
               </div>
            </motion.div>
          </div>
        </>
      ) : (
        <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-slate-50/50 p-20 text-center">
          <BarChart className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold">No performance data available yet.</p>
        </div>
      )}
    </motion.div>
  )
}

function StatBox({ label, value, icon: Icon, color, desc }: any) {
  const colors: any = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100'
  }
  
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
      className={cn("p-6 rounded-[2rem] border bg-white hover:shadow-lg transition-all duration-300", colors[color])}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2 rounded-xl bg-white shadow-sm", colors[color].split(' ')[0])}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
      </div>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      <p className="text-xs text-slate-500 font-medium mt-1">{desc}</p>
    </motion.div>
  )
}

function FunnelStep({ label, value, percent, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <p className="text-sm font-bold text-slate-700">{label}</p>
        <p className="text-sm font-black text-slate-900">{value}</p>
      </div>
      <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-0.5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(percent, 2)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full shadow-sm", color)}
        />
      </div>
    </div>
  )
}

function Send(props: any) {
  return <Mail {...props} />
}