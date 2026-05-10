const SITE_SELECTORS = {
  linkedin: {
    // LinkedIn changes class names frequently — ordered from most to least specific
    title: [
      // 2025 layout
      '[class*="job-details-jobs-unified-top-card"] h1',
      '[class*="top-card-layout"] h1',
      '[class*="jobs-unified-top-card"] h1',
      // 2024 legacy
      '.job-details-jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title',
      'h1.t-24',
      'h1[class*="t-24"]',
      '.job-view-layout h1',
      // broad fallback
      '.jobs-search__job-details h1',
      'h1'
    ],
    company: [
      // 2025 layout
      '[class*="top-card-layout"] [class*="company"] a',
      '[class*="top-card-layout"] [class*="company"]',
      '[class*="jobs-unified-top-card"] [class*="company"] a',
      // 2024 legacy
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      'a[data-tracking-control-name*="topcard-org-name"]',
      'a[data-tracking-control-name*="company"]',
      // attribute fallback
      '[data-company-name]'
    ],
    location: [
      '[class*="top-card-layout"] [class*="bullet"]',
      '[class*="top-card-layout"] [class*="location"]',
      '.job-details-jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description-container .t-black--light',
      '.jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__workplace-type'
    ],
    salary: [
      '[class*="top-card-layout"] [class*="salary"]',
      '.job-details-jobs-unified-top-card__job-insight span',
      '.compensation__salary-range',
      '.job-details-preferences-and-skills__pill span'
    ],
    description: [
      '#job-details',
      '.jobs-description-content__text',
      '.jobs-description__content',
      '[class*="jobs-description"] [class*="content"]',
      '.job-view-layout .description'
    ]
  },
  indeed: {
    title: [
      '[data-testid="jobsearch-JobInfoHeader-title"]',
      'h1.jobsearch-JobInfoHeader-title',
      'h1[class*="jobTitle"]',
      '.jobsearch-JobInfoHeader-title'
    ],
    company: [
      '[data-testid="inlineHeader-companyName"] a',
      '[data-testid="inlineHeader-companyName"]',
      '.jobsearch-CompanyInfoContainer a',
      '[data-company-name]'
    ],
    location: [
      '[data-testid="job-location"]',
      '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
      '.jobsearch-JobInfoHeader-subtitle .jobsearch-JobInfoHeader-locationWrapper'
    ],
    salary: [
      '[data-testid="salaryInfoAndJobType"]',
      '#salaryInfoAndJobType',
      '[class*="salary"]'
    ],
    description: [
      '#jobDescriptionText',
      '.jobsearch-jobDescriptionText',
      '[data-testid="jobsearch-JobComponent-description"]'
    ]
  },
  glassdoor: {
    title: [
      '[data-test="job-title"]',
      'h1[class*="JobTitle"]',
      'h1.job-title',
      '[class*="JobTitle"]'
    ],
    company: [
      '[data-test="employer-name"]',
      '[class*="EmployerName"]',
      'h4[class*="employer"]'
    ],
    location: [
      '[data-test="location"]',
      '[class*="Location"]',
      '[data-test="job-location"]'
    ],
    salary: [
      '[data-test="detailSalary"]',
      '[class*="SalaryEstimate"]',
      '[class*="salary"]'
    ],
    description: [
      '[data-test="description"]',
      '[class*="JobDescription"]',
      '[class*="desc"]'
    ]
  },
  greenhouse: {
    title: ['h1.app-title', 'h1.posting-headline', 'h1'],
    location: ['#header .location', '[data-qa="job-location"]', '.location'],
    salary: ['[data-qa="salary"]', '.salary'],
    description: ['#content', '.content'],
    companyMeta: 'meta[property="og:site_name"]'
  },
  lever: {
    title: ['.posting-headline h2', 'h2'],
    location: ['.posting-categories .sort-by-location', '.posting-categories .location', '.location'],
    salary: ['.posting-categories .salary', '[data-qa="salary"]'],
    description: ['.posting-description', '.content']
  },
  workday: {
    title: [
      '[data-automation-id="jobPostingHeader"]',
      'h2[data-automation-id="jobPostingHeader"]',
      '[class*="jobTitle"]'
    ],
    company: [
      '[data-automation-id="companyName"]',
      '[data-automation-id="jobPostingCompany"]',
      '[class*="companyName"]'
    ],
    location: [
      '[data-automation-id="locations"]',
      '[data-automation-id="jobPostingLocation"]'
    ],
    salary: [
      '[data-automation-id="salary"]',
      '[data-automation-id="jobPostingCompensation"]',
      '[class*="compensation"]'
    ],
    description: [
      '[data-automation-id="jobPostingDescription"]',
      '[class*="jobDescription"]'
    ]
  },
  naukri: {
    // Naukri redesigned in 2024 — CSS modules with random suffixes, match by prefix
    title: [
      'h1.styles_jd-header-title__rZwM1',
      '[class*="jd-header-title"]',
      'h1[class*="title"]',
      'h1[class*="jd-header"]',
      'h1'
    ],
    company: [
      'a[class*="jd-header-comp-name"]',
      '[class*="jd-header-comp-name"] a',
      '[class*="comp-name"] a',
      '[class*="companyInfo"] a',
      'a[class*="comp-name"]'
    ],
    location: [
      '[class*="location"] span',
      '[class*="loc"] span',
      '.locWdth',
      '[class*="locWdth"]',
      'span[class*="location"]'
    ],
    salary: [
      '[class*="salary-container"]',
      '[class*="salary"] span',
      '.salary',
      '[class*="sal-wrap"]'
    ],
    description: [
      '[class*="dang-inner-html"]',
      '[class*="job-desc"]',
      '[class*="JDC"]',
      '.job-desc',
      '.dang-inner-html'
    ]
  },
  internshala: {
    title: [
      '.profile h1', '.profile-main-info h1',
      'h1[class*="profile"]', 'h1[class*="title"]', 'h1'
    ],
    company: [
      '.company-name a', '.company_name a', '[class*="company-name"] a',
      '.ic-company-name a', 'a[class*="company"]'
    ],
    location: [
      '.location_link', '[class*="location"] a',
      '.ic-location span', '.location span'
    ],
    salary: [
      '.salary', '[class*="salary"]', '.ic-16-money + span'
    ],
    description: [
      '.internship_other_details_container', '.about-internship',
      '[class*="about-internship"]', '[class*="job-description"]'
    ]
  },
  ziprecruiter: {
    title: ['.job_title', 'h1.job-title', '[data-testid="job-title"]', 'h1'],
    company: ['.hiring_company_name', '.company-name', '[data-testid="company-name"]'],
    location: ['.job_location', '[data-testid="job-location"]', '.location'],
    salary: ['.compensation_guesses', '.salary', '[data-testid="salary"]'],
    description: ['.jobDescriptionSection', '.job_description', '[data-testid="job-description"]']
  },
  monster: {
    title: ['h1.job-title', '[data-testid="job-title"]', 'h1'],
    company: ['[data-testid="company-name"]', '.company-name', 'a[data-testid="company"]'],
    location: ['[data-testid="job-location"]', '.location'],
    salary: ['[data-testid="salary"]', '.salary'],
    description: ['[data-testid="job-description"]', '.job-description']
  },
  wellfound: {
    title: ['h1', '.listing-title', '[class*="title"]'],
    company: ['.company-name', '[data-test="company-name"]', 'a[class*="company"]'],
    location: ['.location', '[data-test="location"]'],
    salary: ['.salary', '[data-test="compensation"]', '[class*="compensation"]'],
    description: ['.description', '[data-test="description"]', '[class*="description"]']
  },
  dice: {
    title: ['h1.jobTitle', '[data-cy="jobTitle"]', 'h1'],
    company: ['[data-cy="companyNameLink"]', '.companyName a'],
    location: ['[data-cy="locationText"]', '.location'],
    salary: ['[data-cy="compensationText"]', '.salary'],
    description: ['[data-cy="jobDescription"]', '.job-description']
  },
  simplyhired: {
    title: ['h1[data-testid="viewJobTitle"]', 'h2.viewjob-jobTitle', 'h1'],
    company: ['[data-testid="viewJobCompanyName"]', '.viewjob-labelWithIcon'],
    location: ['[data-testid="viewJobCompanyLocation"]', '.viewjob-labelWithIcon + span'],
    salary: ['.viewjob-salary', '[data-testid="viewJobSalary"]'],
    description: ['.viewjob-jobDescription', '[data-testid="viewJobBody"]']
  },
  remoteok: {
    title: ['h1', '.company_and_position h2'],
    company: ['.company h3', '.companyLink'],
    location: ['.location'],
    salary: ['.salary'],
    description: ['.description', '.markdown']
  },
  weworkremotely: {
    title: ['.listing-header-container h1', 'h1'],
    company: ['.listing-header-container h2 a', '.company-name'],
    location: ['.region'],
    salary: ['.salary'],
    description: ['.listing-container']
  }
};

const AUTH_MESSAGE_TYPES = new Set(['PEBELAI_AUTH_TOKEN', 'pebelai:auth']);

const APPLY_SELECTORS = {
  linkedin: [
    // Class-based (most common)
    'button.jobs-apply-button',
    '.jobs-apply-button--top-card',
    // aria-label is reliable — LinkedIn sets it to "Easy Apply to [Job Title]"
    'button[aria-label*="Easy Apply"]',
    'button[aria-label*="easy apply"]',
    // Final submit button only — NOT "Continue to next step" or "Review your application"
    'button[aria-label*="Submit application"]',
    // data-control-name: final submit only
    'button[data-control-name="submit_unify"]'
  ],
  indeed: [
    '[data-testid="indeedApplyButton"]',
    '#indeedApplyButton',
    'button[aria-label*="Apply"]',
    'a[aria-label*="Apply"]',
    'button[class*="ApplyButton"]',
    'a[class*="ApplyButton"]'
  ],
  glassdoor: [
    '[data-test*="apply"]',
    'button[aria-label*="Apply"]',
    'a[aria-label*="Apply"]',
    'button[class*="apply" i]'
  ],
  greenhouse: [
    '#apply_button',
    'a[href*="#app"]',
    'button[class*="apply" i]'
  ],
  lever: [
    'a.postings-btn',
    'a[href*="apply"]',
    'button[class*="apply" i]'
  ],
  workday: [
    'button[data-automation-id="applyButton"]',
    'button[data-automation-id="applyManually"]',
    'button[data-automation-id="submitApplication"]'
  ],
  naukri: [
    '#apply-button',
    'button[id*="apply" i]',
    'button[class*="apply" i]',
    'a[class*="apply" i]',
    // 2024+ Naukri redesign
    '[class*="apply-btn"]',
    '[class*="applyBtn"]'
  ],
  internshala: [
    '.apply_now_btn',
    'button[class*="apply"]',
    'a[class*="apply"]',
    '#apply-now-btn',
    '[data-gtm-track*="apply" i]'
  ]
};

const GENERIC_APPLY_SELECTORS = [
  'button[class*="apply" i]',
  'a[class*="apply" i]',
  'button[id*="apply" i]',
  'a[id*="apply" i]',
  'input[type="submit"][value*="apply" i]',
  'button[data-testid*="apply" i]',
  'a[data-testid*="apply" i]'
];

const TOKEN_FIELD_NAMES = [
  'token',
  'access_token',
  'accesstoken',
  'auth_token',
  'authtoken',
  'jwt',
  'id_token',
  'idtoken'
];

const APPLICATION_CONFIRMED_PATTERNS = [
  'application submitted',
  'successfully applied',
  'thanks for applying',
  'thank you for applying',
  'application received',
  'we have received your application',
  'your application has been submitted',
  // LinkedIn modal confirmation
  'your application was sent',
  'application was sent to',
  // Indeed confirmation
  'application sent',
  'you have applied',
  'your resume was sent',
  // Naukri
  'applied successfully',
  'you have successfully applied',
  // Glassdoor
  'your application has been received',
  // Workday
  'thank you for your interest'
];

// Known job portals mapped to a site key
const JOB_SITE_PATTERNS = [
  { pattern: 'linkedin.com', site: 'linkedin' },
  { pattern: 'indeed.', site: 'indeed' },
  { pattern: 'glassdoor.', site: 'glassdoor' },
  { pattern: 'jobs.greenhouse.io', site: 'greenhouse' },
  { pattern: 'boards.greenhouse.io', site: 'greenhouse' },
  { pattern: 'jobs.lever.co', site: 'lever' },
  { pattern: 'myworkdayjobs.com', site: 'workday' },
  { pattern: 'workday.com', site: 'workday' },
  { pattern: 'naukri.com', site: 'naukri' },
  { pattern: 'ziprecruiter.com', site: 'ziprecruiter' },
  { pattern: 'monster.com', site: 'monster' },
  { pattern: 'wellfound.com', site: 'wellfound' },
  { pattern: 'angel.co', site: 'wellfound' },
  { pattern: 'dice.com', site: 'dice' },
  { pattern: 'simplyhired.com', site: 'simplyhired' },
  { pattern: 'remoteok.com', site: 'remoteok' },
  { pattern: 'weworkremotely.com', site: 'weworkremotely' },
  { pattern: 'jobs.ashbyhq.com', site: 'generic' },
  { pattern: 'apply.workable.com', site: 'generic' },
  { pattern: 'smartrecruiters.com', site: 'generic' },
  { pattern: 'icims.com', site: 'generic' },
  { pattern: 'jobvite.com', site: 'generic' },
  { pattern: 'breezy.hr', site: 'generic' },
  { pattern: 'recruitee.com', site: 'generic' },
  { pattern: 'zohorecruit.com', site: 'generic' },
  { pattern: 'adzuna.com', site: 'generic' },
  { pattern: 'reed.co.uk', site: 'generic' },
  { pattern: 'totaljobs.com', site: 'generic' },
  { pattern: 'seek.com', site: 'generic' },
  { pattern: 'flexjobs.com', site: 'generic' },
  { pattern: 'hired.com', site: 'generic' },
  { pattern: 'internshala.com', site: 'internshala' }
];

// URL path/hostname patterns that are NEVER individual job listings
// These are listing pages, dashboards, feeds, etc.
const EXCLUDED_URL_PATTERNS = [
  // LinkedIn non-job pages
  /linkedin\.com\/feed/,
  /linkedin\.com\/jobs\/?$/,
  /linkedin\.com\/jobs\/search/,
  /linkedin\.com\/jobs\/collections/,
  /linkedin\.com\/jobs\/recommended/,
  /linkedin\.com\/my-items/,
  /linkedin\.com\/notifications/,
  /linkedin\.com\/messaging/,
  /linkedin\.com\/in\//,
  /linkedin\.com\/company\//,
  // Indeed non-job pages
  /indeed\.com\/?$/,
  /indeed\.com\/jobs\/?$/,
  /indeed\.com\/browsejobs/,
  // Glassdoor non-job pages
  /glassdoor\.[a-z]+\/?$/,
  /glassdoor\.[a-z]+\/Reviews/,
  /glassdoor\.[a-z]+\/Salaries/,
  // Naukri listing pages
  /naukri\.com\/?$/,
  /naukri\.com\/[a-z-]+-jobs$/,
  /naukri\.com\/[a-z-]+-jobs-in-/,
  // Generic confirmation / error pages that shouldn't be saved
  /\/apply-confirmation/,
  /\/application-confirmation/
];

// URL path keywords that suggest a SPECIFIC job detail page
const JOB_DETAIL_URL_KEYWORDS = [
  '/jobs/view/',
  '/jobs/detail/',
  '/job-detail/',
  '/job/',
  '/apply/',
  '/posting/',
  '/positions/',
  '/openings/',
  '/vacancies/',
  '/vacancy/',
  '/requisition/',
  '/careers/job',
  '/careers/detail',
  '/career/job'
];

// Known site name suffixes to strip from page titles
const TITLE_SITE_SUFFIXES = [
  ' | LinkedIn',
  ' - LinkedIn',
  ' | Indeed',
  ' - Indeed',
  ' | Glassdoor',
  ' - Glassdoor',
  ' | Naukri',
  ' - Naukri',
  ' | ZipRecruiter',
  ' | Monster',
  ' | Dice',
  ' | SimplyHired',
  ' | Wellfound',
  ' | AngelList',
  ' | RemoteOK',
  ' | We Work Remotely',
  ' | Greenhouse',
  ' | Lever',
  ' | Workday',
  ' | Glassdoor'
];

// Titles that indicate a listing/search/feed page — not a real job
const FAKE_JOB_TITLE_PATTERNS = [
  /^feed$/i,
  /^jobs$/i,
  /^job search$/i,
  /^search results$/i,
  /^job listings$/i,
  /top job picks/i,
  /jobs for you/i,
  /recommended jobs/i,
  /apply confirmation/i,
  /application confirmation/i,
  /^\(\d+\)/,   // starts with "(17)" notification counts
  // Multi-step application step names — not real job titles
  /^upload resume/i,
  /^upload cv/i,
  /^answer questions/i,
  /^review (your )?application/i,
  /^personal information/i,
  /^work (experience|history)/i,
  /^additional (information|questions)/i,
  /^voluntary disclosure/i,
  /^equal employment/i,
  /^submit application/i
];

const AUTO_SAVE_ENABLED_KEY = 'pebelaiAutoSaveEnabled';

async function getAutoSaveEnabled() {
  try {
    const data = await chrome.storage.local.get(AUTO_SAVE_ENABLED_KEY);
    return data[AUTO_SAVE_ENABLED_KEY] !== false; // default ON
  } catch (_e) {
    return true;
  }
}

let lastSyncedToken = '';
let lastAutoSaveSignature = '';  // job identity only — prevents same-job duplicates
let autoSaveTimerId = null;
let hasConfirmationAutoSaved = false;
let hasApplyIntentSaved = false;  // only one apply-intent save per page session

// Cached last-good job data for this page — used when extraction fails at click time
let cachedJobData = null;
let extractionRetryCount = 0;
const MAX_EXTRACTION_RETRIES = 8;

function detectJobSite(hostname = window.location.hostname) {
  for (const entry of JOB_SITE_PATTERNS) {
    if (hostname.includes(entry.pattern)) {
      return entry.site;
    }
  }
  return null;
}

function isExcludedUrl() {
  const url = window.location.href;
  return EXCLUDED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

function isSpecificJobDetailPage() {
  const url = window.location.href.toLowerCase();
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // Never save excluded pages
  if (isExcludedUrl()) {
    return false;
  }

  // LinkedIn: only specific job view pages
  if (hostname.includes('linkedin.com')) {
    return /\/jobs\/view\/\d+/.test(url);
  }

  // Indeed: job detail pages have jk= query param
  if (hostname.includes('indeed.')) {
    return url.includes('jk=') || pathname.includes('/viewjob') || pathname.includes('/job/');
  }

  // Glassdoor: job listings have partner/jobListing in URL
  if (hostname.includes('glassdoor.')) {
    return pathname.includes('/job-listing/') || pathname.includes('/partner/jobListing') || pathname.includes('/Jobs/') && url.includes('jl=');
  }

  // Greenhouse, Lever: all paths are specific jobs
  if (hostname === 'jobs.greenhouse.io' || hostname === 'boards.greenhouse.io' || hostname === 'jobs.lever.co') {
    return pathname.split('/').filter(Boolean).length >= 2;
  }

  // Workday: job posting pages have specific paths
  if (hostname.includes('myworkdayjobs.com') || hostname.includes('workday.com')) {
    return pathname.includes('/job/');
  }

  // Naukri: job detail pages
  if (hostname.includes('naukri.com')) {
    return pathname.includes('-JD') || pathname.includes('/job-listings-');
  }

  // For known job portals, check if URL has job-detail keywords
  if (detectJobSite(hostname)) {
    return JOB_DETAIL_URL_KEYWORDS.some((kw) => url.includes(kw));
  }

  // Unknown sites: require job-detail URL keywords
  return JOB_DETAIL_URL_KEYWORDS.some((kw) => url.includes(kw));
}

function isLikelyRealJobData(jobData) {
  if (!jobData) {
    return false;
  }

  const title = String(jobData.job_title || '').trim();
  const company = String(jobData.company_name || '').trim();
  const description = String(jobData.job_description || '').trim();

  // Must have a company name
  if (!company) {
    return false;
  }

  // Must have a job title that doesn't look like a page/nav title
  if (!title) {
    return false;
  }

  if (FAKE_JOB_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
    return false;
  }

  // Title shouldn't still contain site suffixes (wasn't cleaned)
  if (TITLE_SITE_SUFFIXES.some((suffix) => title.endsWith(suffix))) {
    return false;
  }

  // Need at least a title+company, or substantial description
  return Boolean(title && company) || description.length > 120;
}

function isLikelyJobPage(jobData) {
  return Boolean(jobData.job_title || jobData.company_name || (jobData.job_description || '').length > 80);
}

function cleanJobTitle(raw) {
  let title = normalizeWhitespace(raw || '');
  for (const suffix of TITLE_SITE_SUFFIXES) {
    if (title.endsWith(suffix)) {
      title = title.slice(0, title.length - suffix.length).trim();
    }
  }
  return title;
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function isLikelyJwt(value) {
  return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(String(value || '').trim());
}

function tokenFromRawValue(raw, allowOpaque = false) {
  if (raw === undefined || raw === null) {
    return '';
  }

  const text = String(raw).trim();
  if (!text) {
    return '';
  }

  if (text.toLowerCase().startsWith('bearer ')) {
    const bearer = text.slice(7).trim();
    if (isLikelyJwt(bearer) || (allowOpaque && bearer.length >= 16 && !/\s/.test(bearer))) {
      return bearer;
    }
  }

  if (isLikelyJwt(text)) {
    return text;
  }

  if (allowOpaque && text.length >= 16 && !/\s/.test(text)) {
    return text;
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      for (const field of TOKEN_FIELD_NAMES) {
        if (typeof parsed[field] === 'string' && parsed[field].trim()) {
          const candidate = tokenFromRawValue(parsed[field], true);
          if (candidate) {
            return candidate;
          }
        }
      }
    }
  } catch (_error) {
    // Not JSON; ignore.
  }

  return '';
}

function tokenFromStorage(storageObj) {
  if (!storageObj) {
    return '';
  }

  for (let index = 0; index < storageObj.length; index += 1) {
    const key = storageObj.key(index);
    if (!key) {
      continue;
    }

    let value = '';
    try {
      value = storageObj.getItem(key) || '';
    } catch (_error) {
      continue;
    }

    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('token') || lowerKey.includes('auth') || lowerKey.includes('jwt')) {
      const candidate = tokenFromRawValue(value, true);
      if (candidate) {
        return candidate;
      }
    }

    const fallbackCandidate = tokenFromRawValue(value);
    if (fallbackCandidate) {
      return fallbackCandidate;
    }
  }

  return '';
}

function tokenFromCookies() {
  const cookieText = String(document.cookie || '');
  if (!cookieText) {
    return '';
  }

  const parts = cookieText.split(';');
  for (const part of parts) {
    const [rawKey, ...rawValueParts] = part.split('=');
    const key = (rawKey || '').trim().toLowerCase();
    const rawValue = rawValueParts.join('=').trim();
    if (!key || !rawValue) {
      continue;
    }

    if (key.includes('token') || key.includes('auth') || key.includes('jwt')) {
      const decoded = decodeURIComponent(rawValue);
      const candidate = tokenFromRawValue(decoded, true);
      if (candidate) {
        return candidate;
      }
    }
  }

  return '';
}

function findPebelToken() {
  return (
    tokenFromStorage(window.localStorage) ||
    tokenFromStorage(window.sessionStorage) ||
    tokenFromCookies()
  );
}

function syncAuthTokenToExtension(token) {
  const normalized = String(token || '').trim();
  if (!normalized || normalized === lastSyncedToken) {
    return;
  }

  lastSyncedToken = normalized;
  chrome.runtime.sendMessage(
    {
      type: 'PEBELAI_AUTH_TOKEN',
      token: normalized
    },
    () => {
      void chrome.runtime.lastError;
    }
  );
}

function attemptPebelTokenAutoSync() {
  const token = findPebelToken();
  if (token) {
    syncAuthTokenToExtension(token);
    return true;
  }
  return false;
}

function getElementActionText(element) {
  if (!element) {
    return '';
  }

  const textParts = [
    element.textContent || '',
    element.getAttribute('aria-label') || '',
    element.getAttribute('title') || '',
    element.getAttribute('value') || ''
  ];
  return normalizeWhitespace(textParts.join(' ')).toLowerCase();
}

function isApplyIntentText(text) {
  if (!text) {
    return false;
  }

  const positive = /\b(apply|easy apply|submit application|continue application|complete application|submit resume|submit your application)\b/i.test(text);
  if (!positive) {
    return false;
  }

  return !/\b(filter|job alert|saved search|auto-apply settings)\b/i.test(text);
}

// Stricter check — only the FINAL submit action, not initial "Apply" or intermediate steps.
// "Submit application", "Submit your application", "Send application", "Confirm application"
// Excludes: "Apply", "Easy Apply", "Apply Now", "Next", "Continue", "Review"
function isFinalSubmitText(text) {
  if (!text) {
    return false;
  }
  return /\b(submit\s+(your\s+|my\s+)?(application|resume)|send\s+(your\s+|my\s+)?application|confirm\s+(your\s+|my\s+)?application)\b/i.test(text);
}

function findApplyIntentElement(target, site) {
  if (!(target instanceof Element)) {
    return null;
  }

  // Check site-specific selectors first
  const siteSelectors = APPLY_SELECTORS[site] || [];
  for (const selector of siteSelectors) {
    const matched = target.closest(selector);
    if (matched) {
      return matched;
    }
  }

  // Check generic apply selectors
  for (const selector of GENERIC_APPLY_SELECTORS) {
    try {
      const matched = target.closest(selector);
      if (matched) {
        return matched;
      }
    } catch (_e) {
      // invalid selector
    }
  }

  // Fall back to text-based detection.
  // Known portals (LinkedIn, Indeed, Naukri, etc.) have explicit selectors above,
  // so a strict final-submit check is enough to catch any remaining cases without
  // firing on "Next" / "Continue" steps in multi-step flows.
  // Unknown / generic company career pages don't have multi-step flows in most cases,
  // so we also accept "Apply", "Apply Now", "Quick Apply", etc. for those.
  const isKnownPortal = Boolean(APPLY_SELECTORS[site]) && site !== 'generic';
  const clickable = target.closest('button,a,input[type="submit"],input[type="button"],div[role="button"]');
  if (!clickable) {
    return null;
  }

  const text = getElementActionText(clickable);
  if (isFinalSubmitText(text)) return clickable;
  if (isApplyIntentText(text)) return clickable;
  return null;
}

async function emitAutoSave(reason) {
  const enabled = await getAutoSaveEnabled();
  if (!enabled) {
    return;
  }

  const isApplyIntent = /apply_click|application_submit|application_confirmed/.test(reason);

  // Only one apply-intent save per page session — prevents click + confirmation double-save
  if (isApplyIntent && hasApplyIntentSaved) {
    return;
  }

  // Try live extraction, then fall back to cache from earlier on this page
  let payload = extractJobData();
  if (!isLikelyJobPage(payload) && cachedJobData) {
    payload = { ...cachedJobData, job_url: window.location.href };
  }

  // For apply-intent on a recognized job site: always proceed even with minimal data.
  // The URL alone is enough to record that an application happened.
  // For non-apply-intent: require at least some meaningful content.
  const onKnownSite = Boolean(detectJobSite());
  if (!isLikelyJobPage(payload)) {
    if (!isApplyIntent || !onKnownSite) {
      return;
    }
    // Minimal payload — URL is the only guaranteed field
    payload = {
      site: detectJobSite(),
      job_title: cleanJobTitle(document.title || ''),
      company_name: '',
      location: '',
      salary: '',
      salary_min: null,
      salary_max: null,
      job_description: '',
      job_url: window.location.href
    };
  }

  // Deduplicate by job identity (URL + title + company) — reason excluded
  const signature = `${payload.job_url}|${payload.job_title}|${payload.company_name}`.toLowerCase();
  if (!isApplyIntent && signature === lastAutoSaveSignature) {
    return;
  }

  if (isApplyIntent) {
    hasApplyIntentSaved = true;
  }

  lastAutoSaveSignature = signature;
  chrome.runtime.sendMessage(
    {
      type: 'AUTO_SAVE_APPLICATION',
      payload,
      trigger: reason,
      occurred_at: new Date().toISOString()
    },
    () => {
      void chrome.runtime.lastError;
    }
  );
}

// Debounced auto-save — cancels any pending timer and fires only ONE save after 600ms silence.
// This means rapid events (click + modal open + submit) collapse into a single save.
function scheduleAutoSave(reason) {
  if (autoSaveTimerId) {
    clearTimeout(autoSaveTimerId);
  }

  autoSaveTimerId = setTimeout(() => {
    autoSaveTimerId = null;
    emitAutoSave(reason);
  }, 600);
}

function pageShowsApplicationConfirmation() {
  const bodyText = normalizeWhitespace((document.body && document.body.innerText) || '').toLowerCase();
  if (!bodyText) {
    return false;
  }

  return APPLICATION_CONFIRMED_PATTERNS.some((pattern) => bodyText.includes(pattern));
}

function setupApplicationConfirmationObserver() {
  const maybeEmitConfirmationSave = () => {
    if (hasConfirmationAutoSaved) {
      return;
    }

    if (pageShowsApplicationConfirmation()) {
      hasConfirmationAutoSaved = true;
      scheduleAutoSave('application_confirmed');
    }
  };

  setTimeout(maybeEmitConfirmationSave, 1200);
  setTimeout(maybeEmitConfirmationSave, 3200);

  if (!document.body) {
    return;
  }

  const observer = new MutationObserver(() => {
    maybeEmitConfirmationSave();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function setupApplyAutomation() {
  document.addEventListener(
    'click',
    (event) => {
      const site = detectJobSite() || 'generic';
      const applyElement = findApplyIntentElement(event.target, site);
      if (!applyElement) {
        return;
      }

      scheduleAutoSave('apply_click');
    },
    true
  );

  // Form submit listener intentionally removed — it fires on every intermediate step
  // in multi-step application forms (Greenhouse, Workday, Lever, etc.), causing
  // partial in-progress steps to be saved as separate applications.
  // Saves are now triggered only by final-submit button clicks or confirmation text.
}

function titleCaseFromSlug(slug) {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
    .trim();
}

function companyFromGreenhouseUrl() {
  const pathBits = window.location.pathname.split('/').filter(Boolean);
  if (!pathBits.length) {
    return '';
  }

  const companySlug = decodeURIComponent(pathBits[0]);
  return titleCaseFromSlug(companySlug);
}

function companyFromLeverUrl() {
  const pathBits = window.location.pathname.split('/').filter(Boolean);
  if (!pathBits.length) {
    return '';
  }

  const companySlug = decodeURIComponent(pathBits[0]);
  return titleCaseFromSlug(companySlug);
}

function parseSalaryValue(raw) {
  if (!raw) {
    return null;
  }

  const normalized = raw.toLowerCase().replace(/,/g, '').trim();
  const value = parseFloat(normalized.replace(/[^\d.k]/g, ''));
  if (Number.isNaN(value)) {
    return null;
  }

  if (normalized.includes('k')) {
    return Math.round(value * 1000);
  }

  return Math.round(value);
}

function extractSalaryRange(text) {
  const source = String(text || '');
  if (!source) {
    return { salary: '', salary_min: null, salary_max: null };
  }

  // Skip experience ranges like "0-1 years", "2 Yrs", "0 to 1 year"
  // unless a currency symbol or LPA/lakhs keyword is also present
  if (/\b\d[\d\s]*(?:[-–to]+\s*)?\d*\s*(?:years?|yrs?)\b/i.test(source) &&
      !/[$₹€£]|lpa|lakhs?|per\s+annum|ctc/i.test(source)) {
    return { salary: '', salary_min: null, salary_max: null };
  }

  const rangeMatch = source.match(/(?:\$|usd|inr|₹|€|£)?\s*([\d,.kK]+)\s*(?:-|to|–|—)\s*(?:\$|usd|inr|₹|€|£)?\s*([\d,.kK]+)/i);
  if (rangeMatch) {
    const salaryMin = parseSalaryValue(rangeMatch[1]);
    const salaryMax = parseSalaryValue(rangeMatch[2]);
    const salaryLabel = salaryMin && salaryMax ? `${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}` : rangeMatch[0];
    return {
      salary: salaryLabel,
      salary_min: salaryMin,
      salary_max: salaryMax
    };
  }

  const singleMatch = source.match(/(?:\$|usd|inr|₹|€|£)\s*([\d,.kK]+)/i);
  if (singleMatch) {
    const salaryValue = parseSalaryValue(singleMatch[1]);
    const salaryLabel = salaryValue ? `${salaryValue.toLocaleString()}` : singleMatch[0];
    return {
      salary: salaryLabel,
      salary_min: salaryValue,
      salary_max: null
    };
  }

  return { salary: '', salary_min: null, salary_max: null };
}

function readText(selectorOrList) {
  if (!selectorOrList) {
    return '';
  }

  const selectors = Array.isArray(selectorOrList) ? selectorOrList : [selectorOrList];
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (!element) {
        continue;
      }

      const value = (element.textContent || '').trim();
      if (value) {
        return normalizeWhitespace(value);
      }
    } catch (_e) {
      // invalid selector, skip
    }
  }

  return '';
}

function readMeta(selector) {
  const node = selector ? document.querySelector(selector) : null;
  if (!node) {
    return '';
  }

  const value = (node.getAttribute('content') || '').trim();
  return normalizeWhitespace(value);
}

// Extract from JSON-LD schema.org/JobPosting — most reliable source
function extractFromJsonLd() {
  const result = { job_title: '', company_name: '', location: '', salary: '', salary_min: null, salary_max: null, job_description: '' };

  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const raw = JSON.parse(script.textContent || '');
      const items = Array.isArray(raw) ? raw : [raw];

      for (const item of items) {
        let posting = null;
        if (item['@type'] === 'JobPosting') {
          posting = item;
        } else if (item['@graph']) {
          posting = item['@graph'].find((g) => g['@type'] === 'JobPosting');
        }

        if (!posting) {
          continue;
        }

        result.job_title = normalizeWhitespace(posting.title || '');
        result.job_description = normalizeWhitespace(
          typeof posting.description === 'string'
            ? posting.description.replace(/<[^>]*>/g, ' ')
            : ''
        );

        if (posting.hiringOrganization) {
          const org = posting.hiringOrganization;
          result.company_name = normalizeWhitespace(typeof org === 'string' ? org : org.name || '');
        }

        if (posting.jobLocation) {
          const loc = Array.isArray(posting.jobLocation) ? posting.jobLocation[0] : posting.jobLocation;
          if (loc && loc.address) {
            const addr = loc.address;
            result.location = normalizeWhitespace(
              [addr.addressLocality, addr.addressRegion, addr.addressCountry]
                .filter(Boolean)
                .join(', ')
            );
          } else if (typeof loc === 'string') {
            result.location = normalizeWhitespace(loc);
          }
        }

        if (posting.baseSalary) {
          const sal = posting.baseSalary;
          if (sal.value) {
            const v = sal.value;
            result.salary_min = typeof v.minValue === 'number' ? v.minValue : null;
            result.salary_max = typeof v.maxValue === 'number' ? v.maxValue : null;
            if (result.salary_min && result.salary_max) {
              result.salary = `${result.salary_min.toLocaleString()} - ${result.salary_max.toLocaleString()}`;
            } else if (typeof v.value === 'number') {
              result.salary_min = v.value;
              result.salary = `${v.value.toLocaleString()}`;
            }
          }
        }

        return result;
      }
    } catch (_e) {
      // ignore
    }
  }

  return result;
}

function extractJobData() {
  const site = detectJobSite();
  const baseData = {
    site: site || null,
    job_title: '',
    company_name: '',
    location: '',
    salary: '',
    salary_min: null,
    salary_max: null,
    job_description: '',
    job_url: window.location.href
  };

  // 1. Try JSON-LD first (most accurate, no selector guessing)
  const ldData = extractFromJsonLd();

  // 2. Try site-specific selectors
  let siteData = { job_title: '', company_name: '', location: '', salary: '', salary_min: null, salary_max: null, job_description: '' };
  if (site && SITE_SELECTORS[site]) {
    const selectors = SITE_SELECTORS[site];
    const salaryText = readText(selectors.salary);
    const salaryInfo = extractSalaryRange(salaryText || '');

    let companyName = readText(selectors.company);
    if (!companyName && site === 'greenhouse') {
      companyName = companyFromGreenhouseUrl() || readMeta(selectors.companyMeta);
    }
    if (!companyName && site === 'lever') {
      companyName = companyFromLeverUrl();
    }

    siteData = {
      job_title: readText(selectors.title),
      company_name: companyName,
      location: readText(selectors.location),
      salary: salaryInfo.salary,
      salary_min: salaryInfo.salary_min,
      salary_max: salaryInfo.salary_max,
      job_description: readText(selectors.description)
    };
  }

  // Merge: prefer site-specific > JSON-LD
  baseData.job_title = cleanJobTitle(siteData.job_title || ldData.job_title);
  baseData.company_name = siteData.company_name || ldData.company_name;
  baseData.location = siteData.location || ldData.location;
  baseData.salary = siteData.salary || ldData.salary;
  baseData.salary_min = siteData.salary_min || ldData.salary_min;
  baseData.salary_max = siteData.salary_max || ldData.salary_max;
  baseData.job_description = siteData.job_description || ldData.job_description;

  // Last-resort fallback on recognized job sites: parse document.title.
  // Format is usually "Role at Company | Site" or "Role - Company | Site".
  // cleanJobTitle already strips " | LinkedIn" etc., giving us "Role at Company".
  if (!baseData.job_title && site) {
    const rawTitle = cleanJobTitle(document.title || '');
    if (rawTitle && !FAKE_JOB_TITLE_PATTERNS.some((p) => p.test(rawTitle))) {
      baseData.job_title = rawTitle;
    }
  }

  // Last-resort company: og:site_name if it's not a generic job portal name
  if (!baseData.company_name) {
    const ogSite = readMeta('meta[property="og:site_name"]') || '';
    const isPortalName = /linkedin|indeed|glassdoor|naukri|monster|dice|ziprecruiter|wellfound|angel|internshala/i.test(ogSite);
    if (ogSite && !isPortalName) {
      baseData.company_name = ogSite;
    }
  }

  // Last-resort title: og:title (site suffixes already stripped by cleanJobTitle)
  if (!baseData.job_title) {
    const ogTitle = cleanJobTitle(readMeta('meta[property="og:title"]') || '');
    if (ogTitle && !FAKE_JOB_TITLE_PATTERNS.some((p) => p.test(ogTitle))) {
      // Only strip " at Company" suffix — leave everything else intact
      baseData.job_title = ogTitle.replace(/\s+(?:at|@)\s+[A-Z].+$/i, '').trim() || ogTitle;
    }
  }

  // Last-resort description: og:description
  if (!baseData.job_description) {
    const ogDesc = readMeta('meta[property="og:description"]') || readMeta('meta[name="description"]') || '';
    if (ogDesc.length > 40) {
      baseData.job_description = ogDesc;
    }
  }

  // Cache as soon as we have a title OR company — apply-intent needs this
  if (baseData.job_title || baseData.company_name) {
    cachedJobData = baseData;
  }

  return baseData;
}

function emitJobData() {
  const payload = extractJobData();
  if (!isLikelyJobPage(payload)) {
    return;
  }

  chrome.runtime.sendMessage(
    {
      type: 'JOB_DATA_EXTRACTED',
      payload
    },
    () => {
      void chrome.runtime.lastError;
    }
  );
}

// Retry extraction for SPAs like LinkedIn where content loads after navigation.
// Polls every 1.2s up to MAX_EXTRACTION_RETRIES times until real data is found.
function startExtractionRetryLoop() {
  if (extractionRetryCount >= MAX_EXTRACTION_RETRIES) {
    return;
  }

  const interval = setInterval(() => {
    extractionRetryCount += 1;

    const payload = extractJobData();
    if (isLikelyRealJobData(payload)) {
      // Good data found — notify popup and stop retrying
      chrome.runtime.sendMessage(
        { type: 'JOB_DATA_EXTRACTED', payload },
        () => { void chrome.runtime.lastError; }
      );
      clearInterval(interval);
      return;
    }

    if (extractionRetryCount >= MAX_EXTRACTION_RETRIES) {
      clearInterval(interval);
    }
  }, 1200);
}

// page_view auto-save intentionally removed.
// Saving only happens when the user actually clicks Apply (apply_click / application_confirmed).
// This prevents duplicate records: one "saved" + one "applied" per job.

function handleAuthPostMessage(event) {
  if (event.source !== window || !event.data || typeof event.data !== 'object') {
    return;
  }

  const messageType = event.data.type;
  const token = event.data.token;
  if (!AUTH_MESSAGE_TYPES.has(messageType) || typeof token !== 'string' || !token.trim()) {
    return;
  }

  syncAuthTokenToExtension(token.trim());
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    return;
  }

  if (message.type === 'REQUEST_JOB_DATA') {
    // Return live data, fall back to cache
    let payload = extractJobData();
    if (!isLikelyJobPage(payload) && cachedJobData) {
      payload = { ...cachedJobData, job_url: window.location.href };
    }
    sendResponse({
      ok: true,
      payload,
      isJobPage: isLikelyJobPage(payload)
    });
    return;
  }

  if (message.type === 'REQUEST_AUTH_SYNC') {
    const found = attemptPebelTokenAutoSync();
    sendResponse({ ok: true, found });
  }
});

// PebelAI site: sync auth token
if (window.location.hostname.endsWith('pebelai.com')) {
  window.addEventListener('message', handleAuthPostMessage);
  window.addEventListener('storage', () => {
    attemptPebelTokenAutoSync();
  });
  setTimeout(() => { attemptPebelTokenAutoSync(); }, 300);
  setTimeout(() => { attemptPebelTokenAutoSync(); }, 1800);
  setInterval(() => { attemptPebelTokenAutoSync(); }, 5000);
}

// Only run job detection on non-excluded pages
if (!isExcludedUrl()) {
  setupApplyAutomation();
  setupApplicationConfirmationObserver();

  // Extract and cache job data for popup display
  setTimeout(emitJobData, 800);

  // Retry loop for SPAs (LinkedIn, Indeed, etc.) that render content after navigation
  setTimeout(startExtractionRetryLoop, 1000);

  // Re-run on SPA navigation (URL change without page reload)
  let lastHref = window.location.href;
  let lastNavHostname = window.location.hostname;
  setInterval(() => {
    if (window.location.href !== lastHref) {
      const prevHostname = lastNavHostname;
      lastHref = window.location.href;
      lastNavHostname = window.location.hostname;

      lastAutoSaveSignature = '';
      hasConfirmationAutoSaved = false;
      hasApplyIntentSaved = false;
      extractionRetryCount = 0;

      // Preserve cached job data when navigating within the same domain.
      // Multi-step application flows (Greenhouse, Workday, Lever) change URLs between
      // steps, and without this, the step-page title (e.g. "Upload Resume | Greenhouse")
      // would overwrite the real job title in cachedJobData.
      if (window.location.hostname !== prevHostname) {
        cachedJobData = null;
      }

      if (!isExcludedUrl()) {
        setTimeout(emitJobData, 800);
        setTimeout(startExtractionRetryLoop, 1000);
      }
    }
  }, 1200);
}

// Reset the per-session apply flag when navigating away from a job page
// so applying to the next job works correctly
window.addEventListener('popstate', () => {
  hasApplyIntentSaved = false;
});
