'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, MessageSquare, Bell, BarChart3, Loader2, Eye, EyeOff } from 'lucide-react'
import { signIn } from 'next-auth/react'


const features = [
  { icon: LayoutDashboard, title: 'Kanban Tracking', desc: 'A streamlined system to manage every stage of your job search.' },
  { icon: MessageSquare, title: 'AI Interview Coach', desc: 'Practice with an AI that knows the role and gives real feedback.' },
  { icon: Bell, title: 'Smart Reminders', desc: 'Never miss a follow-up with AI-suggested timing.' },
  { icon: BarChart3, title: 'Career Analytics', desc: 'Track response rates and interview conversion in real time.' },
]

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const visibleError = error || (searchParams.get('error') ? 'Google sign-in failed. Please try again.' : '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      if (res.status === 409) {
        router.push('/login?hint=exists')
        return
      }
      setError(data.error || 'Signup failed.')
      setLoading(false)
      return
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`)
  }

  async function handleGoogleSignIn() {
    setError('')
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="flex min-h-screen">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between bg-[#0d2818] p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="mb-16">
            <Image src="/pebelai-logo.svg" alt="PebelAI" width={150} height={39} className="object-contain brightness-0 invert" />
          </div>

          <h1 className="text-[38px] font-bold text-white leading-[1.15] tracking-[-0.025em] mb-10 font-[family-name:var(--font-heading)]">
            Land your<br />dream job,<br />organized.
          </h1>

          <div className="space-y-6">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white mb-0.5">{f.title}</p>
                  <p className="text-[12px] text-white/45 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[10px] text-white/25 font-semibold tracking-widest uppercase">Powered by Dune AI</p>
          <div className="flex items-center gap-4">
            {[['Twitter', 'https://twitter.com'], ['Terms', '/terms'], ['Privacy', '/privacy']].map(([l, href]) => (
              <a key={l} href={href} className="text-[10px] text-white/25 hover:text-white/50 transition-colors tracking-wide">{l}</a>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[380px]">

          <div className="lg:hidden mb-8">
            <Image src="/pebelai-logo.svg" alt="PebelAI" width={130} height={34} className="object-contain" />
          </div>

          <h2 className="text-[26px] font-bold text-slate-900 mb-1 tracking-tight font-[family-name:var(--font-heading)]">
            Create your account
          </h2>
          <p className="text-[14px] text-slate-400 mb-8">Start tracking your job search today.</p>

          {visibleError && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">{visibleError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Full name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[#16a34a] text-white text-[14px] font-semibold hover:bg-[#15803d] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Free Account'}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="underline hover:text-slate-500 transition-colors">Terms</Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline hover:text-slate-500 transition-colors">Privacy Policy</Link>.
            </p>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[11px] text-slate-300 uppercase tracking-widest">or continue with</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full h-10 rounded-lg border border-slate-200 bg-white text-[14px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-2.5"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-center text-[13px] text-slate-400 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-[#16a34a] font-semibold hover:text-emerald-700 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function AuthLoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-600" />
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthLoadingShell />}>
      <SignupForm />
    </Suspense>
  )
}
