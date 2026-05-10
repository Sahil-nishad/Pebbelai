import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "@/components/session-provider";
import "./globals.css";

const BASE_URL = "https://www.pebelai.com"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "PebelAI — Free AI Job Application Tracker for India",
    template: "%s | PebelAI",
  },
  description:
    "Track every job you apply to, practice interviews with AI, and never miss a follow-up. Free Chrome extension for LinkedIn, Naukri, Indeed. Built for Indian job seekers.",
  keywords: [
    "job application tracker", "free job tracker india", "ai interview coach",
    "ats resume checker", "linkedin job tracker", "naukri job tracker",
    "chrome extension job tracker", "teal alternative", "huntr alternative",
    "interview prep india", "resume tracker", "job search organizer",
    "follow up reminders", "career tracker free",
  ],
  authors: [{ name: "Sahil Nishad", url: `${BASE_URL}/about` }],
  creator: "PebelAI",
  publisher: "PebelAI",
  category: "Productivity",

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "PebelAI",
    title: "PebelAI — Free AI Job Application Tracker for India",
    description:
      "Track every job application, practice interviews with AI, and never miss a follow-up. Free forever — no credit card.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PebelAI — AI-Powered Job Application Tracker",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "PebelAI — Free AI Job Tracker & Interview Coach",
    description:
      "Track applications, practice interviews with AI, and land your dream job faster. Free forever.",
    images: ["/og-image.png"],
    creator: "@pebelai",
    site: "@pebelai",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },

  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },

  verification: {
    google: "76627f6cd45198c1",
  },

  other: {
    "format-detection": "telephone=no",
  },
};

const jsonLdGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#org`,
      name: 'PebelAI',
      alternateName: 'Pebel AI',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/pebelai-logo.svg`,
        width: 256,
        height: 256,
      },
      description:
        'AI-powered job application tracker built for Indian job seekers. Free kanban tracker, AI interview coach, smart follow-up reminders, and Chrome extension for LinkedIn, Naukri, Indeed.',
      foundingDate: '2026',
      founder: {
        '@type': 'Person',
        name: 'Sahil Nishad',
        url: `${BASE_URL}/about`,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@pebelai.com',
        availableLanguage: ['English', 'Hindi'],
      },
      sameAs: [
        'https://twitter.com/pebelai',
        'https://www.linkedin.com/company/pebelai',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'PebelAI',
      description: 'Free AI job application tracker and interview coach for India.',
      publisher: { '@id': `${BASE_URL}/#org` },
      inLanguage: 'en-IN',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/blog?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${BASE_URL}/#software`,
      name: 'PebelAI',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Job Application Tracker',
      operatingSystem: 'Web, Chrome, Brave, Edge',
      url: BASE_URL,
      description:
        'Free AI-powered job application tracker. Auto-saves jobs from LinkedIn, Naukri, Indeed via Chrome extension. AI interview coach, smart reminders, ATS resume analysis.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '120',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Kanban job application tracking',
        'AI interview practice (behavioral, technical, system design)',
        'Smart follow-up reminders',
        'ATS resume analysis',
        'Chrome extension for LinkedIn, Naukri, Indeed',
        'Career analytics dashboard',
      ],
      author: { '@id': `${BASE_URL}/#org` },
      publisher: { '@id': `${BASE_URL}/#org` },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              background: "#FFFFFF",
              color: "#13211B",
              border: "1px solid rgba(19,33,27,0.08)",
              boxShadow: "0 18px 44px rgba(15,23,42,0.08)",
            },
          }}
        />
      </body>
    </html>
  );
}
