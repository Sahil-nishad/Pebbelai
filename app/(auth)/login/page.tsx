'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Bot, BarChart3, LayoutGrid, Loader2, Eye, EyeOff } from 'lucide-react'
import { signIn } from 'next-auth/react'

const features = [
  {
    icon: Bot,
    title: 'AI Matching',
    desc: 'Personalized coaching that aligns your skills with the exact role you\'re interviewing for.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    desc: 'Get insights into your application performance and interview conversion rates.',
  },
  {
    icon: LayoutGrid,
    title: 'Kanban Tracking',
    desc: 'A streamlined system to manage every stage of your job search in one place.',
  },
]

function getOAuthErrorMessage(code: string | null): string {
  switch (code) {
    case 'OAuthCallback':
    case 'OAuthCallbackError': return 'Google sign-in failed. Please try again.'
    case 'OAuthAccountNotLinked': return 'This email is already registered. Sign in with your password instead.'
    case 'Callback': return 'Sign-in callback error. Please try again.'
    case 'AccessDenied': return 'Access denied. Please try again.'
    case 'EmailNotVerified': return 'Please verify your email first. Check your inbox for the verification link.'
    case 'InvalidVerificationLink': return 'Invalid or already used verification link. Please sign up again.'
    case 'VerificationLinkExpired': return 'Verification link expired. Please sign up again to get a new one.'
    default: return code ? 'Sign-in failed. Please try again.' : ''
  }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const ott = searchParams.get('ott') || ''
  const routeError =
    searchParams.get('hint') === 'exists'
      ? 'An account with this email already exists. Sign in below.'
      : getOAuthErrorMessage(searchParams.get('error'))
  const visibleError = error || routeError
  const verifiedSuccess = searchParams.get('verified') === '1'

  // Auto-sign in using the one-time token issued after email verification
  useEffect(() => {
    if (!ott) return
    setLoading(true)
    signIn('credentials', { ott, redirect: false }).then((result) => {
      if (result?.ok) {
        router.push('/dashboard')
      } else {
        setLoading(false)
        setError('Auto sign-in failed. Please enter your credentials below.')
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Incorrect email or password.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
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
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl" />

        {/* Top — logo */}
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

        {/* Bottom */}
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

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Image src="/pebelai-logo.svg" alt="PebelAI" width={130} height={34} className="object-contain" />
          </div>

          <h2 className="text-[26px] font-bold text-slate-900 mb-1 tracking-tight font-[family-name:var(--font-heading)]">
            Welcome back
          </h2>
          <p className="text-[14px] text-slate-400 mb-8">
            Sign in to your curated workspace
          </p>

          {verifiedSuccess && (
            <div className="mb-5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-[13px] text-emerald-700 font-medium">
              Email verified! You can now sign in.
            </div>
          )}

          {visibleError && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
              {visibleError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                Email address
              </label>
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-medium text-slate-600">Password</label>
                <Link href="/forgot-password" className="text-[12px] text-emerald-600 hover:text-emerald-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[#16a34a] text-white text-[14px] font-semibold hover:bg-[#15803d] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[11px] text-slate-300 uppercase tracking-widest">or continue with</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full h-10 rounded-lg border border-slate-200 bg-white text-[14px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-2.5"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
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
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#16a34a] font-semibold hover:text-emerald-700 transition-colors">
              Sign up free
            </Link>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoadingShell />}>
      <LoginForm />
    </Suspense>
  )
}
