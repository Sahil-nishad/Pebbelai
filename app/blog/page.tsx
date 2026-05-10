import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/public-nav'
import { getAllPosts } from '@/lib/blog-data'

const BASE_URL = 'https://www.pebelai.com'

export const metadata: Metadata = {
  title: 'PebelAI Blog — Job Search, Interview & Resume Guides for India',
  description:
    'Practical guides on job applications, interview prep, ATS resumes, and salary negotiation — written for Indian job seekers. Updated weekly.',
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'PebelAI Blog — Job Search Guides for India',
    description:
      'Practical guides on job applications, interview prep, ATS resumes, and salary negotiation — written for Indian job seekers.',
    url: `${BASE_URL}/blog`,
    type: 'website',
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${BASE_URL}/blog`,
    url: `${BASE_URL}/blog`,
    name: 'PebelAI Blog',
    description:
      'Practical guides on job applications, interview prep, ATS resumes, and salary negotiation — written for Indian job seekers.',
    publisher: { '@id': `${BASE_URL}/#org` },
    inLanguage: 'en-IN',
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${BASE_URL}/blog/${p.slug}`,
      datePublished: p.date,
      dateModified: p.updated || p.date,
      author: { '@type': 'Person', name: p.author },
    })),
  }

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      <PublicNav />

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-[12px] font-bold tracking-widest text-emerald-700 uppercase mb-3">PebelAI Blog</p>
          <h1 className="text-[40px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4 max-w-3xl">
            Job search guides written for Indian job seekers.
          </h1>
          <p className="text-[16px] text-slate-500 leading-relaxed max-w-2xl">
            Practical, no-fluff articles on tracking applications, cracking interviews, writing ATS-friendly
            resumes, and negotiating salary. Updated weekly.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col p-6 rounded-2xl border border-slate-100 bg-white hover:border-[#0A6A47]/30 hover:shadow-[0_4px_20px_rgba(10,106,71,0.06)] transition-all"
            >
              <span className="text-[11px] font-semibold tracking-wide uppercase text-emerald-700 mb-3">
                {post.category}
              </span>
              <h2 className="text-[20px] font-bold text-slate-900 mb-3 leading-snug group-hover:text-[#0A6A47] transition-colors">
                {post.title}
              </h2>
              <p className="text-[14px] text-slate-500 leading-relaxed mb-5">
                {post.description}
              </p>
              <div className="mt-auto flex items-center gap-3 text-[12px] text-slate-400">
                <span>{post.author}</span>
                <span>•</span>
                <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                <span>•</span>
                <span>{post.readMinutes} min read</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center text-[12px] text-slate-400">
          © {new Date().getFullYear()} PebelAI · <Link href="/privacy" className="hover:text-slate-600">Privacy</Link> · <Link href="/terms" className="hover:text-slate-600">Terms</Link>
        </div>
      </footer>
    </main>
  )
}
