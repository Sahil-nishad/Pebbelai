'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong.')
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-10">
          <Image src="/pebelai-logo.svg" alt="PebelAI" width={180} height={47} className="h-10 w-auto max-w-[180px]" />
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Check your inbox</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              If an account exists for <strong>{email}</strong>, we sent a password reset link. Check your spam folder if you don&apos;t see it.
            </p>
            <Link href="/login" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors text-sm">
              &larr; Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Forgot your password?</h2>
            <p className="text-slate-500 text-sm mb-8">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Mail className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                Send Reset Link
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-8">
              <Link href="/login" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
                &larr; Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
