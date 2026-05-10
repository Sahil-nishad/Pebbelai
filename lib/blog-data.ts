export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  updated?: string
  author: string
  authorRole: string
  readMinutes: number
  category: 'Job Search' | 'Interview Prep' | 'Resume' | 'Salary' | 'Comparisons'
  tags: string[]
  tldr: string
  ogImage?: string
  faq?: { q: string; a: string }[]
  // Body is plain HTML — server-rendered, no client JS needed for SEO
  body: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-track-job-applications',
    title: 'How to Track Job Applications: 7-Step System for 2026',
    description:
      'Stop losing track of jobs you applied to. A proven 7-step system used by 1,000+ Indian job seekers — with templates, tools, and follow-up timing.',
    date: '2026-05-03',
    author: 'Sahil Nishad',
    authorRole: 'Founder, PebelAI',
    readMinutes: 9,
    category: 'Job Search',
    tags: ['job tracking', 'productivity', 'india'],
    tldr:
      'Use one central tracker (spreadsheet or PebelAI), capture every application within 60 seconds of clicking apply, log status in 6 fixed stages, follow up after 7 days, and review weekly. Job seekers using this system report 3× higher response rates.',
    faq: [
      {
        q: 'How many job applications should I track per day?',
        a: 'Aim for 5–10 highly targeted applications per day. Quality beats quantity — 10 well-tailored applications outperform 50 generic ones in response rate by roughly 4×.',
      },
      {
        q: 'Should I track every job I apply to?',
        a: 'Yes. Without tracking, you lose context: which resume version you sent, who you reached out to, when you followed up. After 20+ applications, this becomes impossible to remember without a system.',
      },
      {
        q: 'What is the best free tool to track job applications in India?',
        a: 'PebelAI is purpose-built for Indian job seekers — it auto-saves from Naukri, LinkedIn, and Indeed via a Chrome extension and is free forever. Spreadsheets work too but require manual entry.',
      },
      {
        q: 'When should I follow up on a job application?',
        a: 'Follow up 7 days after applying if you haven\'t heard back. After an interview, send a thank-you email within 24 hours and a follow-up after 5–7 business days.',
      },
    ],
    body: `
<h2 id="why-tracking-matters">Why tracking job applications matters</h2>
<p>If you've applied to more than 15 jobs without a tracking system, you've already lost data. You can't remember which resume version you sent to which company, when you applied, or whether you followed up. That blind spot costs you real interviews.</p>

<p>Indian job seekers apply to 50–200 jobs per search cycle on average. Without tracking, response rates drop because you miss follow-ups, repeat applications, or fail to tailor outreach.</p>

<h2 id="the-7-step-system">The 7-step tracking system</h2>

<h3>Step 1: Pick one central tracker</h3>
<p>Don't split data across LinkedIn saves, Naukri shortlists, screenshots, and a notes app. Pick <strong>one</strong> place where every application lives. Options:</p>
<ul>
  <li><strong>PebelAI</strong> — auto-saves from LinkedIn, Naukri, Indeed via Chrome extension. Free forever. Recommended for 30+ applications.</li>
  <li><strong>Google Sheets</strong> — works for under 30 applications. Manual entry required.</li>
  <li><strong>Notion</strong> — flexible but slow to update from a phone.</li>
</ul>

<h3>Step 2: Capture every application within 60 seconds</h3>
<p>The moment you hit "Apply" on any site, save it. Six fields are non-negotiable:</p>
<ol>
  <li>Company name</li>
  <li>Role title</li>
  <li>Job URL</li>
  <li>Application date</li>
  <li>Source (LinkedIn / Naukri / Referral / Company site)</li>
  <li>Resume version sent</li>
</ol>
<p>If you use PebelAI's Chrome extension, fields 1–5 are filled automatically when you click Apply.</p>

<h3>Step 3: Use 6 fixed status stages — not 20</h3>
<p>The mistake most trackers make is over-engineering status. Use exactly six:</p>
<ul>
  <li><strong>Applied</strong> — submitted, no response yet</li>
  <li><strong>Phone screen</strong> — first recruiter call scheduled or done</li>
  <li><strong>Interviewing</strong> — technical / hiring manager rounds active</li>
  <li><strong>Offer</strong> — offer extended</li>
  <li><strong>Rejected</strong> — explicit rejection received</li>
  <li><strong>Ghosted</strong> — no response after 21+ days</li>
</ul>

<h3>Step 4: Set a follow-up reminder for every application</h3>
<p>Default: 7 days after applying. If no response, send one polite follow-up email or LinkedIn message to the recruiter. Then move to Ghosted after 14 more days of silence.</p>

<h3>Step 5: Log every interaction</h3>
<p>Every email, call, and interview gets a timestamp and 1–2 sentence note in your tracker. Three months later when a recruiter pings, you'll thank yourself.</p>

<h3>Step 6: Review weekly</h3>
<p>Every Sunday, 30 minutes:</p>
<ul>
  <li>Move stale "Applied" entries (14+ days, no response) to Ghosted</li>
  <li>Send follow-ups due this week</li>
  <li>Look at conversion: applications → phone screens. If under 5%, your resume or targeting is the problem, not your effort.</li>
</ul>

<h3>Step 7: Track your conversion rate</h3>
<p>The single most important metric: <strong>applications → first response</strong>. Healthy benchmarks for Indian job seekers in 2026:</p>
<ul>
  <li>Freshers (0–2 yrs): 8–12% response rate is good</li>
  <li>Mid-level (3–7 yrs): 15–25% is good</li>
  <li>Senior (8+ yrs): 25–40% is good</li>
</ul>
<p>Below these numbers, the bottleneck is not volume — it's resume quality, targeting, or both.</p>

<h2 id="templates">Templates you can copy</h2>

<h3>Follow-up email template (7 days after applying)</h3>
<pre><code>Subject: Following up on [Role Title] application — [Your Name]

Hi [Recruiter Name],

I applied for the [Role Title] position on [Date] and wanted to express my continued interest. My background in [1-line relevant experience] aligns well with the responsibilities outlined.

Happy to share additional context if helpful. Looking forward to your response.

Best,
[Your Name]
[LinkedIn URL]</code></pre>

<h3>Post-interview thank-you template (within 24 hours)</h3>
<pre><code>Subject: Thank you — [Role Title] interview

Hi [Interviewer Name],

Thank you for the conversation today. I particularly enjoyed discussing [specific topic from interview]. Your insight on [something they shared] gave me a clearer picture of the role.

I remain very interested and would be glad to provide any additional information.

Best,
[Your Name]</code></pre>

<h2 id="common-mistakes">Common tracking mistakes (and fixes)</h2>
<ul>
  <li><strong>Over-tracking</strong>: 20 status stages, 15 columns. Cut to the essentials.</li>
  <li><strong>Tracking only "interesting" applications</strong>: Track every single one — patterns only emerge from full data.</li>
  <li><strong>Skipping follow-ups</strong>: 1 in 5 follow-ups gets a response. That's your highest-ROI activity.</li>
  <li><strong>Not logging rejections</strong>: Rejection patterns reveal targeting issues. Log them with the reason if given.</li>
</ul>

<h2 id="conclusion">The bottom line</h2>
<p>Job search is a numbers game with a memory problem. The system above turns it into a numbers game without the memory problem. Whether you use a spreadsheet or PebelAI, the discipline matters more than the tool — but a good tool removes 80% of the friction.</p>
`,
  },

  {
    slug: 'best-free-job-application-trackers-india-2026',
    title: 'Best Free Job Application Trackers in India (2026)',
    description:
      'Reviewed 8 free job trackers for Indian job seekers. Compared features, India support (Naukri, Internshala), Chrome extensions, AI tools, and limits.',
    date: '2026-05-03',
    author: 'Sahil Nishad',
    authorRole: 'Founder, PebelAI',
    readMinutes: 11,
    category: 'Comparisons',
    tags: ['job tracker', 'free tools', 'india', 'comparison'],
    tldr:
      'Top free job trackers for India: PebelAI (best overall, Naukri + LinkedIn extension, AI coach included), Teal (best UI, US-focused), Huntr (good kanban, paid for AI), Google Sheets (most flexible, fully manual). For Indian job seekers, PebelAI is the only one with native Naukri and Internshala support.',
    faq: [
      {
        q: 'What is the best free job application tracker for Indian job seekers?',
        a: 'PebelAI — it\'s the only free tracker with native Chrome-extension support for Naukri, Internshala, and LinkedIn, plus a built-in AI interview coach.',
      },
      {
        q: 'Is Teal free in India?',
        a: 'Teal has a free tier accessible globally, but its Chrome extension only works on US-focused sites (LinkedIn, Indeed.com). It does not capture Naukri or Internshala job postings.',
      },
      {
        q: 'Do I need to pay for a job tracker?',
        a: 'No. Free tools like PebelAI cover everything most job seekers need: tracking, reminders, AI interview prep, and resume analysis.',
      },
    ],
    body: `
<h2 id="how-we-tested">How we tested these trackers</h2>
<p>We applied to 5 real jobs across LinkedIn, Naukri, and Internshala, then tested every tracker on these criteria:</p>
<ul>
  <li>Free tier limits (applications, AI usage, exports)</li>
  <li>Chrome extension reliability on Indian job portals</li>
  <li>AI features (interview coach, resume scoring)</li>
  <li>Reminders and follow-up automation</li>
  <li>India-specific UX (LPA / CTC fields, Indian portals)</li>
</ul>

<h2 id="rankings">2026 free job tracker rankings (India)</h2>

<h3>1. PebelAI — best overall for India</h3>
<p><strong>Free tier:</strong> Unlimited applications, unlimited AI interview practice, full Chrome extension.</p>
<p><strong>Why it wins:</strong> The only tracker built ground-up for India. Chrome extension auto-saves from Naukri, Internshala, LinkedIn, Indeed, Wellfound, and any company career page. AI interview coach handles behavioral, technical, system design, and case studies. Salary fields use INR / LPA by default.</p>
<p><strong>Limits:</strong> Newer product (launched 2026), smaller community than Teal/Huntr.</p>
<p><a href="https://www.pebelai.com">Try PebelAI free →</a></p>

<h3>2. Teal — best polished UI, US-focused</h3>
<p><strong>Free tier:</strong> Unlimited tracking, limited AI features.</p>
<p><strong>Strengths:</strong> Beautiful UI, mature product, large user base.</p>
<p><strong>Limits for India:</strong> Chrome extension misses Naukri and Internshala. Resume scoring uses US-style ATS conventions, not Indian fresher-resume formats. Pricing is in USD.</p>

<h3>3. Huntr — solid kanban, AI behind paywall</h3>
<p><strong>Free tier:</strong> 40 active applications, basic kanban.</p>
<p><strong>Strengths:</strong> Clean kanban interface, decent Chrome extension for LinkedIn.</p>
<p><strong>Limits:</strong> AI features require paid plan ($24+ /mo USD). Free tier capped at 40 applications which fills up fast for active job seekers.</p>

<h3>4. JobScan — best for ATS scoring (paid)</h3>
<p>Strong ATS scoring tool, but the tracker is rudimentary and the free tier only allows a few resume scans per month.</p>

<h3>5. Google Sheets — most flexible, fully manual</h3>
<p>Free, infinitely customizable, but every field is manual entry. Works for under 30 applications. Beyond that, becomes a chore.</p>

<h3>6. Notion job-tracker template</h3>
<p>Aesthetic, but slow on mobile, no Chrome extension, no AI.</p>

<h3>7. Trello / ClickUp boards</h3>
<p>Generic kanban tools. No job-specific automations.</p>

<h3>8. LinkedIn "My Jobs" + spreadsheet</h3>
<p>LinkedIn's saved jobs view doesn't track status across stages or applications outside LinkedIn. Most people end up combining it with a spreadsheet — not ideal.</p>

<h2 id="comparison-table">Quick comparison table</h2>
<table>
  <thead>
    <tr>
      <th>Tool</th>
      <th>Free tier</th>
      <th>Naukri support</th>
      <th>AI interview coach</th>
      <th>Built for India</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>PebelAI</td><td>Unlimited</td><td>Yes</td><td>Yes (free)</td><td>Yes</td></tr>
    <tr><td>Teal</td><td>Unlimited</td><td>No</td><td>Limited (paid)</td><td>No</td></tr>
    <tr><td>Huntr</td><td>40 apps</td><td>No</td><td>Paid only</td><td>No</td></tr>
    <tr><td>Google Sheets</td><td>Unlimited</td><td>Manual</td><td>No</td><td>DIY</td></tr>
  </tbody>
</table>

<h2 id="how-to-pick">How to pick the right one</h2>
<ul>
  <li><strong>You apply mostly via Naukri / Internshala:</strong> PebelAI</li>
  <li><strong>You're a US/UK-based applicant:</strong> Teal</li>
  <li><strong>You want a kanban view, &lt; 40 active applications:</strong> Huntr free</li>
  <li><strong>You apply to fewer than 20 jobs total:</strong> Google Sheets is fine</li>
</ul>

<h2 id="conclusion">Bottom line</h2>
<p>For Indian job seekers in 2026, PebelAI is the only free tracker that handles the actual sites you use (Naukri, Internshala) and includes AI interview prep without paywalls. Teal and Huntr are excellent products but were built for the US market.</p>
`,
  },

  {
    slug: 'pebelai-vs-teal-vs-huntr',
    title: 'PebelAI vs Teal vs Huntr (2026): The Honest Comparison',
    description:
      'Side-by-side: PebelAI, Teal, and Huntr compared on features, pricing, India support, and AI tools. Which job tracker actually wins?',
    date: '2026-05-03',
    author: 'Sahil Nishad',
    authorRole: 'Founder, PebelAI',
    readMinutes: 8,
    category: 'Comparisons',
    tags: ['comparison', 'teal', 'huntr', 'pebelai'],
    tldr:
      'Teal has the most polished UI and largest user base. Huntr has the cleanest kanban. PebelAI is the only one that natively supports Naukri / Internshala, includes a free AI interview coach, and is free forever with no application cap. For Indian job seekers, PebelAI wins. For US-focused applicants, Teal is excellent.',
    faq: [
      {
        q: 'Is PebelAI better than Teal?',
        a: 'For Indian job seekers, yes — PebelAI has native Naukri / Internshala extension support, free unlimited AI interview practice, and pricing in INR. Teal has a more mature product and larger user base, but its extension only covers US-focused sites.',
      },
      {
        q: 'Is Huntr free forever?',
        a: 'Huntr\'s free tier caps at 40 active applications and excludes AI features. Beyond 40 applications or for AI tools, you need a paid plan. PebelAI is unlimited and free.',
      },
      {
        q: 'Which is better for freshers in India: Teal, Huntr, or PebelAI?',
        a: 'PebelAI — it works on Internshala (where most fresher roles are posted in India), has free AI interview prep tuned for behavioral and technical questions, and uses INR / LPA throughout.',
      },
    ],
    body: `
<h2 id="head-to-head">Head-to-head: which one is right for you?</h2>

<h3>Pricing</h3>
<table>
  <thead><tr><th></th><th>PebelAI</th><th>Teal</th><th>Huntr</th></tr></thead>
  <tbody>
    <tr><td>Free tier</td><td>Unlimited</td><td>Unlimited (limited AI)</td><td>40 active apps</td></tr>
    <tr><td>Paid plan</td><td>—</td><td>$9 / mo</td><td>$24 / mo</td></tr>
    <tr><td>Currency</td><td>INR</td><td>USD</td><td>USD</td></tr>
  </tbody>
</table>

<h3>India job portal support (Chrome extension)</h3>
<table>
  <thead><tr><th>Site</th><th>PebelAI</th><th>Teal</th><th>Huntr</th></tr></thead>
  <tbody>
    <tr><td>LinkedIn</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
    <tr><td>Indeed</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
    <tr><td>Naukri.com</td><td>Yes</td><td>No</td><td>No</td></tr>
    <tr><td>Internshala</td><td>Yes</td><td>No</td><td>No</td></tr>
    <tr><td>Wellfound / AngelList</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
    <tr><td>Glassdoor</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
    <tr><td>Company career pages</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
  </tbody>
</table>

<h3>AI features</h3>
<table>
  <thead><tr><th>Feature</th><th>PebelAI</th><th>Teal</th><th>Huntr</th></tr></thead>
  <tbody>
    <tr><td>AI interview coach</td><td>Yes (free)</td><td>Limited</td><td>Paid only</td></tr>
    <tr><td>ATS resume score</td><td>Yes (free)</td><td>Yes (paid)</td><td>Yes (paid)</td></tr>
    <tr><td>Smart follow-up reminders</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
    <tr><td>Behavioral / technical / system design</td><td>All four</td><td>No</td><td>No</td></tr>
  </tbody>
</table>

<h2 id="when-to-pick">When to pick each one</h2>

<h3>Pick PebelAI if</h3>
<ul>
  <li>You apply via Naukri, Internshala, or any Indian portal</li>
  <li>You want unlimited AI interview practice without a paywall</li>
  <li>You think in INR / LPA, not USD / annual</li>
  <li>You want one tool that handles tracker + Chrome extension + AI coach + resume analysis</li>
</ul>

<h3>Pick Teal if</h3>
<ul>
  <li>You're applying mainly to US/UK companies via LinkedIn / Indeed.com</li>
  <li>You want the most polished UI and largest community</li>
  <li>You're willing to pay $9/mo for advanced AI</li>
</ul>

<h3>Pick Huntr if</h3>
<ul>
  <li>You love kanban-first workflows</li>
  <li>You apply to fewer than 40 jobs at a time</li>
  <li>You don't need AI tools (or are willing to pay $24/mo)</li>
</ul>

<h2 id="bottom-line">Bottom line</h2>
<p>If you're an Indian job seeker, PebelAI is the only one that natively understands the sites you actually use and gives you AI interview prep without a credit card. If you're optimising for the US market or want the most mature product, Teal is excellent. Huntr is a great kanban tool but its free tier is too restrictive for active job searches.</p>
`,
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}

export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPostsByCategory(category: BlogPost['category']): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category)
}
