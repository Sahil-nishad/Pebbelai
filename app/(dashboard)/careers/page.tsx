'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Radar, 
  Mail, 
  BarChart, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Briefcase,
  Zap
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import * as careers from '@/services/careers'
import type { AnalyticsSummary } from '@/types/careers'
import Link from 'next/link'

export default function CareersDashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    careers.getAnalytics()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [user?.id])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-[2rem]" />
          ))}
        </div>
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
            <TrendingUp className="h-3 w-3" />
            Active Job Hunt
          </motion.div>
          <motion.h1 variants={item} className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Careers <span className="text-emerald-600">Overview</span>
          </motion.h1>
          <motion.p variants={item} className="text-slate-500 mt-2 text-lg">
            Track your applications and network with top recruiters in real-time.
          </motion.p>
        </div>
        
        <motion.div variants={item} className="flex items-center gap-2">
           <Link
            href="/careers/settings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:-translate-y-1"
          >
            <Zap className="h-4 w-4" />
            Connect Gmail
          </Link>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Applications" 
          value={stats?.total_applications || 0} 
          icon={FileText} 
          color="emerald"
          trend="+2 this week"
        />
        <StatCard 
          label="Outreach" 
          value={stats?.sent || 0} 
          icon={Mail} 
          color="blue"
          trend="85% open rate"
        />
        <StatCard 
          label="Replies" 
          value={stats?.replied || 0} 
          icon={CheckCircle} 
          color="indigo"
          trend="Excellent"
        />
        <StatCard 
          label="Avg. Match" 
          value={`${stats?.avg_ats_score || 0}%`} 
          icon={Radar} 
          color="amber"
          trend="Top 5% candidate"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div variants={item} className="group relative rounded-[2rem] overflow-hidden border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Briefcase className="h-32 w-32 text-emerald-600" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-slate-900">Recommended for You</h3>
              <p className="text-slate-500 mt-1">Based on your parsed resume and skills</p>
              
              <div className="mt-8 space-y-4">
                {[
                  { title: 'Senior Product Designer', company: 'Linear', location: 'Remote', salary: '$160k - $220k', match: 94 },
                  { title: 'Frontend Engineer', company: 'Vercel', location: 'New York, NY', salary: '$140k - $190k', match: 89 },
                  { title: 'UX Lead', company: 'Stripe', location: 'San Francisco, CA', salary: '$180k - $250k', match: 87 }
                ].map((job, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all cursor-pointer group/item">
                    <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover/item:text-emerald-600 group-hover/item:border-emerald-200 transition-all">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{job.title}</p>
                      <p className="text-sm text-slate-500">{job.company} • {job.location}</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                        {job.match}% Match
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{job.salary}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                Explore All Opportunities
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          <motion.div variants={item} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Checklist
            </h3>
            <div className="mt-6 space-y-4">
              <CheckItem label="Update Resume Skills" done />
              <CheckItem label="Connect Gmail Account" done />
              <CheckItem label="Upload 3+ Target Roles" />
              <CheckItem label="Send 5 AI Outreaches" />
            </div>
          </motion.div>

          <motion.div variants={item} className="rounded-[2rem] bg-slate-900 p-6 text-white overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-20">
               <AlertCircle className="h-20 w-20" />
             </div>
             <h3 className="text-lg font-bold relative z-10 text-emerald-400">Pro Tip</h3>
             <p className="mt-2 text-sm text-slate-300 leading-relaxed relative z-10">
               Candidates who follow up within 3 days have a 45% higher response rate. Set a reminder now!
             </p>
             <button className="mt-4 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest">
               Set Reminder
             </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ label, value, icon: Icon, color, trend }: any) {
  const colors: any = {
    emerald: 'from-emerald-50 to-emerald-100/50 text-emerald-700 border-emerald-100',
    blue: 'from-blue-50 to-blue-100/50 text-blue-700 border-blue-100',
    indigo: 'from-indigo-50 to-indigo-100/50 text-indigo-700 border-indigo-100',
    amber: 'from-amber-50 to-amber-100/50 text-amber-700 border-amber-100'
  }

  const iconColors: any = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500'
  }

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
      }}
      className={`relative group rounded-[2.5rem] border ${colors[color]} bg-gradient-to-br p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${iconColors[color]} text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">{label}</p>
          <h4 className="text-3xl font-black mt-1 text-slate-900 tracking-tight">{value}</h4>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold">
        <TrendingUp className="h-3 w-3" />
        {trend}
      </div>
    </motion.div>
  )
}

function CheckItem({ label, done }: any) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all ${
        done 
          ? 'bg-emerald-500 border-emerald-500 text-white' 
          : 'border-slate-200 group-hover:border-emerald-300'
      }`}>
        {done && <CheckCircle className="h-3.5 w-3.5" />}
      </div>
      <span className={`text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-600 group-hover:text-slate-900'}`}>
        {label}
      </span>
    </div>
  )
}