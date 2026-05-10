import { MetadataRoute } from 'next'

const BASE_URL = 'https://www.pebelai.com'

export default function robots(): MetadataRoute.Robots {
  const sharedDisallow = [
    '/api/',
    '/dashboard',
    '/applications',
    '/coach',
    '/reminders',
    '/resume',
    '/settings',
    '/admin',
    '/verify-email',
    '/reset-password',
    '/forgot-password',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: sharedDisallow,
      },
      // AI crawlers — explicitly allow content, deny app
      { userAgent: 'GPTBot', allow: '/', disallow: sharedDisallow },
      { userAgent: 'ClaudeBot', allow: '/', disallow: sharedDisallow },
      { userAgent: 'anthropic-ai', allow: '/', disallow: sharedDisallow },
      { userAgent: 'PerplexityBot', allow: '/', disallow: sharedDisallow },
      { userAgent: 'Google-Extended', allow: '/', disallow: sharedDisallow },
      { userAgent: 'CCBot', allow: '/', disallow: sharedDisallow },
      { userAgent: 'Applebot-Extended', allow: '/', disallow: sharedDisallow },
      { userAgent: 'Bingbot', allow: '/', disallow: sharedDisallow },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
