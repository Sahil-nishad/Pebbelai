import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up Free — PebelAI Job Tracker',
  description: 'Create a free PebelAI account in 30 seconds. Track job applications, practice interviews with AI, and never miss a follow-up. Free forever.',
  alternates: { canonical: 'https://www.pebelai.com/signup' },
  openGraph: {
    title: 'Sign Up Free — PebelAI Job Tracker',
    description: 'Free forever. No credit card required.',
    url: 'https://www.pebelai.com/signup',
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
