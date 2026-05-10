'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-[400px] text-center">
        <div className="mb-8">
          <Image src="/pebelai-logo.svg" alt="PebelAI" width={130} height={34} className="object-contain mx-auto" />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-[#16a34a]" />
        </div>

        <h1 className="text-[26px] font-bold text-slate-900 mb-2 tracking-tight">Check your inbox</h1>
        <p className="text-[14px] text-slate-500 leading-relaxed mb-1">
          We sent a verification link to
        </p>
        {email && (
          <p className="text-[15px] font-semibold text-slate-800 mb-1">{email}</p>
        )}
        <p className="text-[13px] text-slate-400 leading-relaxed mb-8">
          Click the link in the email to activate your account.<br />The link expires in 24 hours.
        </p>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left mb-8">
          <p className="text-[12px] text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700">Didn&apos;t receive it?</span>{' '}
            Check your spam or junk folder. If it&apos;s not there, go back and create your account again with the correct email address.
          </p>
        </div>

        <Link href="/login" className="text-[13px] text-[#16a34a] font-semibold hover:text-emerald-700 transition-colors">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
