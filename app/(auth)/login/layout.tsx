import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log in to PebelAI',
  description: 'Log in to your PebelAI account to track job applications, practice interviews with AI, and manage your job search.',
  alternates: { canonical: 'https://www.pebelai.com/login' },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Log in to PebelAI',
    description: 'Log in to your PebelAI account.',
    url: 'https://www.pebelai.com/login',
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
