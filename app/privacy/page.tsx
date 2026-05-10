import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How PebelAI collects, uses, and protects your personal data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <Image src="/pebelai-logo.svg" alt="PebelAI" width={130} height={34} className="object-contain" />
          </Link>
          <div className="flex items-center gap-6 text-[13px] text-slate-500">
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="/about" className="hover:text-slate-900 transition-colors">About</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-[11px] font-semibold tracking-widest text-[#2d8a52] uppercase mb-3">Legal</p>
        <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-12">Last updated: April 19, 2026</p>

        <div className="prose prose-slate max-w-none space-y-10 text-[15px] leading-relaxed text-slate-700">

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
            <p>When you create a PebelAI account we collect your name, email address, and a hashed password. When you use the app, we store job applications, interview session transcripts, and profile preferences you enter. We do not collect payment information — PebelAI is free.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To operate and improve the PebelAI service</li>
              <li>To generate AI coaching responses tailored to your job and company</li>
              <li>To send account-related emails (password reset, product updates)</li>
              <li>To analyze aggregate, anonymized usage and improve the product</li>
            </ul>
            <p className="mt-3">We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. AI Processing</h2>
            <p>Interview coaching messages are sent to third-party AI providers (Groq / underlying LLM providers) to generate responses. These providers process data under their own privacy terms. We do not share your name or email with AI providers — only the text content of sessions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Storage & Security</h2>
            <p>Your data is stored in Supabase (PostgreSQL) hosted on secure cloud infrastructure. Passwords are never stored in plain text. We use HTTPS for all data in transit. We apply reasonable administrative and technical safeguards, but no system is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Cookies & Analytics</h2>
            <p>We use session cookies required for authentication. We may use privacy-respecting analytics (no cross-site tracking) to understand how features are used. You can disable cookies in your browser settings, though this will prevent login.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by emailing <a href="mailto:sahilsahani13@gmail.com" className="text-[#2d8a52] underline">sahilsahani13@gmail.com</a>. We will respond within 30 days. You may also delete your account directly from your settings page.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Children</h2>
            <p>PebelAI is not directed at children under 13. We do not knowingly collect data from children. If you believe a child has provided us data, please contact us and we will delete it.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you of material changes by email or by displaying a notice in the app. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Contact</h2>
            <p>Questions about this policy? Email us at <a href="mailto:sahilsahani13@gmail.com" className="text-[#2d8a52] underline">sahilsahani13@gmail.com</a>.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-8 mt-8">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 tracking-widest uppercase">Powered by Dune AI</p>
          <div className="flex gap-5 text-[12px] text-slate-400">
            <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
            <Link href="/about" className="hover:text-slate-700 transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
