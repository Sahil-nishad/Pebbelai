import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  generateResume,
  ROLE_PACKS,
  calculateJDMatchDetails,
  generateApplicationFeedback,
} from './resumeEngine';

import {
  supabase,
  signInUser,
  signUpUser,
  signOutUser,
  signInWithGoogle,
  fetchUserResumes,
  saveResumeToDB,
  deleteResumeFromDB
} from './supabaseClient';

import { enhanceWithGroq, checkBackendHealth, scoreATSWithGroq } from './groqService';
import { TEMPLATES, downloadLatex } from './latexTemplates2';
import {
  FileText, Sparkles, Download, Plus, Trash2, ChevronDown, ChevronUp,
  User, Briefcase, GraduationCap, Code2, Target, Lightbulb,
  CheckCircle2, AlertCircle, ArrowRight, Shield, ClipboardList, Wand2, Copy,
  TrendingUp, Award, Search, Layout, FileCode2,
  Server, ServerOff, LogIn, Lock, Mail, Star, ArrowLeft, Check,
  KanbanSquare, CalendarClock, BellRing, BarChart3
} from 'lucide-react';

/* ===================== PDF EXPORT ===================== */
function exportToPDF(elementId) {
  const el = document.getElementById(elementId);
  if (!el) { alert('No resume to export. Please generate first.'); return; }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  // Extract all stylesheets
  const styles = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules).map(rule => rule.cssText).join(' ');
      } catch (e) { return ''; }
    }).join(' ');

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Resume</title>
        <style>
          ${styles}
          @page { size: A4 portrait; margin: 0; }
          body { 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            background: white !important;
          }
          #resume-render {
            width: 210mm !important;
            padding: 15mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
            filter: none !important;
            backdrop-filter: none !important;
            position: static !important;
          }
        </style>
      </head>
      <body>
        ${el.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 350);
          }
        </script>
      </body>
    </html>
  `);
  doc.close();

  // Cleanup after print dialog
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 4000);
}

/* ===================== AUTO TEXTAREA ===================== */
function AutoTextarea({ value, onChange, placeholder, rows }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      className="form-textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows || 3}
      style={{ overflow: 'hidden', resize: 'vertical', minHeight: '80px' }}
    />
  );
}

function safeCopy(text, onOk, onErr) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(onOk).catch(onErr);
}

const LANDING_FAQS = [
  {
    q: 'Is PEBELai good for ATS resumes?',
    a: 'Yes. PEBELai helps create ATS-friendly resumes with cleaner structure, keyword guidance, one-page fitting, and AI-powered ATS scoring.',
  },
  {
    q: 'Can I check my resume against a job description?',
    a: 'Yes. You can compare your resume with a target job description, review missing keywords, and improve role alignment before applying.',
  },
  {
    q: 'Does PEBELai include resume templates for freshers and experienced professionals?',
    a: 'Yes. The platform includes multiple professional LaTeX resume templates suitable for students, freshers, experienced candidates, and technical roles.',
  },
  {
    q: 'Can I track applications inside PEBELai?',
    a: 'Yes. PEBELai includes an application tracker with pipeline stages, follow-up reminders, interview round notes, deadlines, analytics, and weekly progress reporting.',
  },
];

const SEO_ROLE_TERMS = [
  'software engineer resume builder',
  'data analyst resume builder',
  'resume checker for ATS',
  'AI resume builder',
  'professional resume templates',
  'resume builder for freshers',
];

function ensureMetaTag(attr, value) {
  const selector = attr === 'name' ? `meta[name="${value}"]` : `meta[property="${value}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  return el;
}

function setSeoMeta(data) {
  const origin = window.location.origin;
  const canonicalUrl = data.url || origin;
  document.title = data.title;
  ensureMetaTag('name', 'description').setAttribute('content', data.description);
  ensureMetaTag('name', 'robots').setAttribute('content', data.robots || 'index,follow');
  ensureMetaTag('property', 'og:title').setAttribute('content', data.title);
  ensureMetaTag('property', 'og:description').setAttribute('content', data.description);
  ensureMetaTag('property', 'og:type').setAttribute('content', data.ogType || 'website');
  ensureMetaTag('property', 'og:url').setAttribute('content', canonicalUrl);
  ensureMetaTag('property', 'og:site_name').setAttribute('content', 'PEBELai');
  ensureMetaTag('property', 'og:image').setAttribute('content', `${origin}/pebel-logo.png`);
  ensureMetaTag('name', 'twitter:card').setAttribute('content', 'summary_large_image');
  ensureMetaTag('name', 'twitter:title').setAttribute('content', data.title);
  ensureMetaTag('name', 'twitter:description').setAttribute('content', data.description);
  ensureMetaTag('name', 'twitter:image').setAttribute('content', `${origin}/pebel-logo.png`);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalUrl);

  let schema = document.head.querySelector('#seo-structured-data');
  if (!schema) {
    schema = document.createElement('script');
    schema.id = 'seo-structured-data';
    schema.type = 'application/ld+json';
    document.head.appendChild(schema);
  }
  schema.textContent = JSON.stringify(data.schema);
}

const STORAGE_KEYS = {
  resumeHistory: 'pabbleai_resume_history_v1',
  applications: 'pabbleai_applications',
  userProfile: 'pabbleai_user_profile_v1',
  credentials: 'pabbleai_credentials_v1',
};

function readStorageArray(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function readStorageObject(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/* ===================== TOAST ===================== */
function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={'toast toast-' + type}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

function MobileBottomNav({ user, view, onViewChange, onOpenTracker }) {
  if (!user || view === 'landing' || view === 'login') return null;

  return (
    <div className="mobile-bottom-nav">
      <button 
        className={`m-nav-item ${view === 'gallery' || view === 'builder' ? 'active' : ''}`} 
        onClick={() => onViewChange('gallery')}
      >
        <Layout size={20} />
        <span>Resumes</span>
      </button>
      <button 
        className={`m-nav-item ${view === 'tracker' ? 'active' : ''}`} 
        onClick={onOpenTracker}
      >
        <ClipboardList size={20} />
        <span>Tracker</span>
      </button>
      <button 
        className={`m-nav-item ${view === 'profile' ? 'active' : ''}`} 
        onClick={() => onViewChange('profile')}
      >
        <User size={20} />
        <span>Profile</span>
      </button>
    </div>
  );
}
/* ===================== NAVBAR ===================== */
function Navbar({
  user,
  onUserProfile,
  onOpenTracker,
  onLogout,
  onLogoClick,
  onSignIn,
  view,
  hasResume,
  selectedTemplate,
  resumeData,
  menuOpen,
  setMenuOpen
}) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a href="/" className="navbar-logo" onClick={e => { e.preventDefault(); onLogoClick(); }}>
          <img src="/pebel-logo.svg" alt="PEBELai" className="navbar-logo-img" />
        </a>
        
        <div className="navbar-actions">
          {user ? (
            <>
              {/* Contextual Toggle Button */}
              {view === 'tracker' ? (
                <button className="btn btn-black btn-sm" onClick={onLogoClick}>
                  <FileText size={14} /> Resume Builder
                </button>
              ) : (
                <button className="btn btn-black btn-sm" onClick={onOpenTracker}>
                  <ClipboardList size={14} /> Tracker Mode
                </button>
              )}

              {/* Minimalist Builder Actions (Only in Builder mode and if resume exists) */}
              {hasResume && view === 'builder' && (
                <div className="navbar-builder-actions hide-on-mobile">
                  <button className="btn btn-outline btn-sm" onClick={() => exportToPDF('resume-render')}>
                    <Download size={14} /> Export PDF
                  </button>
                </div>
              )}
              
              <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <Plus size={24} style={{ transform: 'rotate(45deg)' }} /> : <Layout size={24} />}
              </button>

              {menuOpen && (
                <div className="nav-menu-overlay" onClick={() => setMenuOpen(false)}>
                  <div className="nav-menu" onClick={e => e.stopPropagation()}>
                    <div className="nav-menu-header">
                      <div className="user-avatar-large">{(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.name || user?.email || "U").charAt(0).toUpperCase()}</div>
                      <div className="nav-menu-user-info">
                        <strong>{(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.name || user?.email || "User")}</strong>
                        <span>{user?.email}</span>
                      </div>
                    </div>
                    <div className="nav-menu-links">
                      <button onClick={() => { setMenuOpen(false); onUserProfile(); }}>
                        <User size={18} /> My Profile
                      </button>
                      <button onClick={() => { setMenuOpen(false); onOpenTracker(); }}>
                        <ClipboardList size={18} /> Application Tracker
                      </button>
                      <button className="menu-logout-btn" onClick={onLogout}>
                        <LogIn size={18} style={{ transform: 'rotate(180deg)' }} /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            view !== 'login' && (
              <button className="btn btn-black btn-sm" onClick={onSignIn}>
                <LogIn size={14} /> Sign In
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
}


function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>Developed by <strong>DuneAI</strong></span>
    </footer>
  );
}

/* ===================== LANDING PAGE ===================== */
function LandingPage({ onOpenResumeFlow, onOpenTrackerPreview }) {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-content">
          <div className="landing-badge">The Future of Career Building</div>
          <h1 className="landing-title">
            Build Better.<br />Track Smarter.
          </h1>
          <p className="landing-subtitle">
            An architectural approach to resume building and application management.
            Polished, precise, and professional.
          </p>
          <div className="landing-cta-row">
            <button className="btn btn-black btn-xl" onClick={onOpenResumeFlow}>
              Start Building Now <ArrowRight size={18} />
            </button>
            <button className="btn btn-outline btn-xl" onClick={onOpenTrackerPreview}>
              <ClipboardList size={18} /> Application Tracker
            </button>
          </div>
          <div className="landing-stats">
            <div className="stat"><strong>14</strong><span>Templates</span></div>
            <div className="stat-divider" />
            <div className="stat"><strong>ATS</strong><span>Scoring</span></div>
            <div className="stat-divider" />
            <div className="stat"><strong>JD</strong><span>Match Insights</span></div>
            <div className="stat-divider" />
            <div className="stat"><strong>Tracker</strong><span>Job Pipeline</span></div>
          </div>
        </div>
        <div className="landing-resume-visual" aria-hidden="true">
          <div className="resume-sheet">
            <div className="resume-sheet-head">
              <div className="sheet-name">JORDAN HAYES</div>
              <div className="sheet-role">Product-Focused Software Engineer</div>
            </div>
            <div className="sheet-section">
              <div className="sheet-title">SUMMARY</div>
              <div className="sheet-line w-100" />
              <div className="sheet-line w-90" />
            </div>
            <div className="sheet-section">
              <div className="sheet-title">EXPERIENCE</div>
              <div className="sheet-line w-100" />
              <div className="sheet-line w-95" />
              <div className="sheet-line w-88" />
            </div>
            <div className="sheet-section two-col">
              <div>
                <div className="sheet-title">SKILLS</div>
                <div className="sheet-line w-85" />
                <div className="sheet-line w-75" />
              </div>
              <div>
                <div className="sheet-title">EDUCATION</div>
                <div className="sheet-line w-80" />
                <div className="sheet-line w-60" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="landing-platform-split" aria-labelledby="platform-pillars-heading">
        <div className="landing-section-head">
          <h2 id="platform-pillars-heading">The Ecosystem</h2>
          <p>Two essential tools bridged together in a single, high-performance interface.</p>
        </div>
        <div className="platform-pillar-grid">
          <article className="pillar-card pillar-card-builder">
            <div className="pillar-card-top">
              <FileText size={20} />
              <span>Resume Builder</span>
            </div>
            <h3>Create an ATS-ready resume in a focused workspace</h3>
            <p>Use professional templates, live preview, job-description matching, one-page fitting, and AI guidance without losing layout control.</p>
            <ul className="pillar-list">
              <li>Professional LaTeX templates</li>
              <li>Live ATS score syncing</li>
              <li>JD match and keyword guidance</li>
            </ul>
            <button className="btn btn-black btn-sm" onClick={() => handleRequireAuth('gallery')}>
              Go To Resume Builder
            </button>
          </article>
          <article className="pillar-card pillar-card-tracker">
            <div className="pillar-card-top">
              <ClipboardList size={20} />
              <span>Application Tracker</span>
            </div>
            <h3>Track every application after the resume is ready</h3>
            <p>Move opportunities through the pipeline, monitor follow-ups, log interview rounds, and stay on top of deadlines and weekly performance.</p>
            <ul className="pillar-list">
              <li>Kanban pipeline and reminders</li>
              <li>Interview notes and deadlines</li>
              <li>Source analytics and weekly reporting</li>
            </ul>
            <button className="btn btn-outline btn-sm" onClick={onOpenTrackerPreview}>
              Go To Tracker
            </button>
          </article>
        </div>
      </section>
      <section className="landing-workflow" aria-labelledby="workflow-heading">
        <div className="landing-section-head">
          <h2 id="workflow-heading">The Methodology</h2>
          <p>A closed-loop system designed for consistent career growth.</p>
        </div>
        <div className="workflow-grid">
          <div className="workflow-step">
            <span className="workflow-step-num">1</span>
            <h3>Build</h3>
            <p>Choose a template, fill your details, and shape a one-page resume with live preview and ATS guidance.</p>
          </div>
          <div className="workflow-step">
            <span className="workflow-step-num">2</span>
            <h3>Apply</h3>
            <p>Track every application by source, status, deadline, and interview round so nothing slips through.</p>
          </div>
          <div className="workflow-step">
            <span className="workflow-step-num">3</span>
            <h3>Improve</h3>
            <p>Use ATS feedback, weekly performance, and follow-up timing to improve conversion over time.</p>
          </div>
        </div>
      </section>

      <section className="landing-faq" aria-labelledby="faq-heading" style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 60 }}>
        <div className="landing-section-head">
          <h2 id="faq-heading">Frequently asked questions</h2>
          <p>Answers for users looking for a professional resume builder and ATS optimization platform.</p>
        </div>
        <div className="landing-faq-grid">
          {LANDING_FAQS.map(item => (
            <article key={item.q} className="faq-card">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
/* ===================== LOGIN PAGE ===================== */
function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        alert("Google Login Error: " + error.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <img src="/pebel-logo.svg" alt="PEBELai" style={{ height: 100, width: 'auto', marginBottom: 32 }} />
        </div>
        <h1 className="login-headline">Professional results.<br/>Zero friction.</h1>
        <p className="login-subtext">Join 5,000+ professionals building ATS-optimized resumes that actually get read.</p>
        
        <div className="login-testimonial">
          <div className="login-stars">
            <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
          </div>
          <p>&quot;The design is incredible. I finally have a resume I'm proud to send to top-tier companies.&quot;</p>
          <span className="testimonial-author">— Alex D., Sr. Software Engineer</span>
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Welcome Back</h2>
            <p className="login-card-sub">Sign in to your professional workspace</p>
          </div>

          <button className="btn-google" onClick={handleGoogleLogin} disabled={loading}>
            {loading ? (
              <div className="spinner-small" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="divider"><span>OR</span></div>

          <div className="login-form-minimal">
            <div className="field">
              <label>Email Address</label>
              <div className="input-icon-wrap">
                <Mail size={16} className="field-icon" />
                <input type="email" placeholder="name@company.com" className="input" />
              </div>
            </div>
            <button
              className="btn btn-black btn-full btn-xl"
              onClick={() => onLogin({ name: 'Guest User', email: 'guest@example.com' })}
            >
              Sign In
            </button>
            <p className="login-footer-text">
              By continuing, you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== TEMPLATE GALLERY PAGE ===================== */
const GALLERY_DUMMY_DATA = {
  name: "Sophia Reed",
  email: "sophia.reed@example.com",
  phone: "+1 (555) 329-4567",
  location: "San Francisco, CA",
  linkedin: "linkedin.com/in/sophiareed",
  portfolio: "sophiareed.dev",
  summary: "Results-driven Senior Platform Engineer with 6+ years of experience architecting highly concurrent backend systems and scalable cloud infrastructure. Proven track record of optimizing system latency by 40% and leading high-performing functional teams to deliver business-critical products.",
  skills: {
    technical: ["Java", "Go", "TypeScript", "Python", "Node.js", "GraphQL", "PostgreSQL", "Redis"],
    tools: ["Kubernetes", "Docker", "AWS", "Terraform", "Kafka", "DataDog"],
    soft: ["System Architecture", "Agile Leadership", "Cross-functional Collaboration", "Code Review"]
  },
  experience: [
    {
      title: "Senior Platform Engineer",
      company: "Northstar Technologies",
      location: "San Francisco, CA",
      duration: "Jan 2022 - Present",
      bullets: [
        "Architected and deployed a multi-tenant SaaS messaging platform used by 250K+ monthly active users, achieving zero downtime.",
        "Spearheaded the migration from a monolithic backend to containerized Go microservices, dropping cloud costs by 35%.",
        "Orchestrated Kubernetes clusters utilizing Terraform and Helm, achieving 99.99% uptime across US-East regions.",
        "Mentored a team of 5 backend developers, establishing robust CI/CD pipelines that reduced deployment times from hours to minutes."
      ]
    },
    {
      title: "Software Engineer II",
      company: "Orbit Labs",
      location: "Austin, TX (Remote)",
      duration: "May 2019 - Dec 2021",
      bullets: [
        "Developed and maintained critical RESTful APIs in Node.js, processing over 10M transactions daily with sub-50ms latency.",
        "Implemented real-time data synchronization utilizing Apache Kafka to distribute events across distributed systems.",
        "Collaborated cross-functionally with product and design teams to launch 20+ customer-facing features.",
        "Designed and tuned complex PostgreSQL database schemas, improving query retrieval times by scaling indexing techniques."
      ]
    },
    {
      title: "Backend Engineering Intern",
      company: "DataFlow Systems",
      location: "Seattle, WA",
      duration: "Jun 2018 - Aug 2018",
      bullets: [
        "Optimized legacy Python data extraction scripts to run 4x faster using multithreading primitives.",
        "Authored comprehensive unit tests utilizing PyTest, driving codebase coverage up from 45% to over 85%.",
        "Automated regression testing pipelines in Jenkins, cutting manual deployment QA wait times by 2 hours per sprint."
      ]
    }
  ],
  projects: [
    {
      name: "Resume Intelligence Platform",
      techStack: "React, Node.js, OpenAI API, PostgreSQL",
      description: "Designed and shipped end-to-end resume optimization workflows with live ATS scoring mechanism.",
      bullets: [
        "Built template rendering and export pipeline supporting LaTeX, PDF, and print-ready formats.",
        "Implemented role-based recommendation engine that improved user correlation rates by 30%."
      ]
    },
    {
      name: "Operations Analytics Hub",
      techStack: "Next.js, Python, FastAPI, BigQuery",
      description: "Internal business intelligence platform integrating real-time telemetry from core systems.",
      bullets: [
        "Created interactive ROI dashboards with drill-down filtering for product and leadership teams.",
        "Reduced query latency by 55% using pre-aggregation and scheduled data materialization."
      ]
    }
  ],
  education: [
    {
      degree: "M.S. in Computer Science",
      school: "University of California",
      dates: "2017 - 2019",
      details: ""
    },
    {
      degree: "B.S. in Computer Science",
      school: "State University",
      dates: "2013 - 2017"
    }
  ]
};

const FONT_FAMILY_MAP = {
  template: '',
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  lato: "'Lato', 'Inter', sans-serif",
  times: "'Times New Roman', Times, serif",
  georgia: "Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};

function chunkArray(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function ResumeWorkflowPage({ onContinueToTemplates, onOpenTracker }) {
  return (
    <div className="workflow-page">
      <section className="workflow-hero-panel">
        <div className="workflow-hero-copy">
          <div className="landing-badge">Resume Workflow</div>
          <h1>See how PEBELai works before you choose a template</h1>
          <p>
            We separate the workflow from the editor so users understand what happens first,
            what gets optimized automatically, and how the tracker supports the resume after it is built.
          </p>
          <div className="landing-cta-row">
            <button className="btn btn-black btn-xl" onClick={onContinueToTemplates}>
              Choose Resume Template <ArrowRight size={18} />
            </button>
            <button className="btn btn-outline btn-xl" onClick={onOpenTracker}>
              <ClipboardList size={18} /> Open Application Tracker
            </button>
          </div>
        </div>
        <div className="workflow-hero-stack" aria-hidden="true">
          <div className="workflow-mini-card">
            <div className="workflow-mini-top">
              <Layout size={16} />
              <span>Builder</span>
            </div>
            <strong>Template selection to guided form to live preview</strong>
            <p>Professional layout first, then content enhancement and export.</p>
          </div>
          <div className="workflow-mini-card">
            <div className="workflow-mini-top">
              <Shield size={16} />
              <span>ATS Engine</span>
            </div>
            <strong>Real-time score sync while the resume changes</strong>
            <p>Keywords, fit, missing skills, and structure update with the draft.</p>
          </div>
          <div className="workflow-mini-card">
            <div className="workflow-mini-top">
              <ClipboardList size={16} />
              <span>Tracker</span>
            </div>
            <strong>Applications, reminders, rounds, deadlines, follow-ups</strong>
            <p>Everything after the resume is sent stays in one organized system.</p>
          </div>
        </div>
      </section>

      <section className="workflow-stage-panel">
        <div className="landing-section-head">
          <h2>A cleaner journey from resume to application tracking</h2>
          <p>Both core products stay visible, but each one gets its own focused workspace.</p>
        </div>
        <div className="workflow-stage-grid">
          <article className="workflow-stage-card">
            <div className="workflow-step-num">01</div>
            <h3>Choose the right template</h3>
            <p>Start with a polished layout that matches your profile, industry, and level of experience.</p>
            <ul className="pillar-list">
              <li>Minimal, modern, academic, technical, and executive styles</li>
              <li>Readable thumbnail previews and realistic sample data</li>
              <li>Template selection stays separate from editing for better clarity</li>
            </ul>
          </article>

          <article className="workflow-stage-card">
            <div className="workflow-step-num">02</div>
            <h3>Build and optimize in one screen</h3>
            <p>Enter your information once and let the preview, ATS score, and job fit update around it.</p>
            <ul className="pillar-list">
              <li>Real-time ATS score sync with resume changes</li>
              <li>One-page fitting and auto-improvement guidance</li>
              <li>Job description alignment for stronger personalization</li>
            </ul>
          </article>

          <article className="workflow-stage-card">
            <div className="workflow-step-num">03</div>
            <h3>Track the actual job search</h3>
            <p>After exporting the resume, move into the tracker to manage follow-ups, deadlines, and outcomes.</p>
            <ul className="pillar-list">
              <li>Pipeline board, source analytics, and weekly reports</li>
              <li>Interview rounds with notes and reminders</li>
              <li>Focused, collapsible application entries instead of long crowded forms</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}

function TemplateGallery({ templates, onSelect }) {
  const previewVersion = '20260402-rich';
  const [activeIndex, setActiveIndex] = useState(templates.length * 100);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNext = () => setActiveIndex(i => i + 1);
  const handlePrev = () => setActiveIndex(i => i - 1);

  const N = templates.length;
  const modIndex = ((activeIndex % N) + N) % N;

  // Responsive slider offsets based on viewport width
  const isMobile = viewportWidth <= 768;
  const isSmall = viewportWidth <= 460;
  const sliderOffsets = {
    adjacent: isSmall ? 200 : isMobile ? 260 : 330,
    far: isSmall ? 320 : isMobile ? 400 : 500,
    farStep: isSmall ? 80 : isMobile ? 90 : 110,
    activeScale: isSmall ? 1.08 : 1.12,
    adjScale: isSmall ? 0.85 : 0.9,
    farScale: isSmall ? 0.7 : 0.75,
    adjRotate: isMobile ? 8 : 15,
    farRotate: isMobile ? 14 : 25,
  };

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
  };

  return (
    <div className="gallery-page">
      <div className="gallery-header gallery-header-minimal">
        <div className="landing-badge">Template Library</div>
        <h1>Choose a resume layout that already feels finished</h1>
        <p>
          Each template is rendered from LaTeX with realistic A4 previews, so what you pick here
          is much closer to the final exported resume.
        </p>
      </div>

      <div className="gallery-hero-strip">
        <div className="gallery-hero-card">
          <span>{N} templates</span>
          <strong>ATS-friendly formats with clean one-page structure</strong>
        </div>
        <div className="gallery-hero-card">
          <span>Real previews</span>
          <strong>Rendered PDF thumbnails instead of abstract placeholders</strong>
        </div>
        <div className="gallery-hero-card">
          <span>Faster picking</span>
          <strong>Category and design intent shown directly on every card</strong>
        </div>
      </div>

      <div className="gallery-slider-container">
        <button className="slider-btn slider-btn-prev" onClick={handlePrev}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div 
          className="gallery-slider-track"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >

          {templates.map((t, index) => {
            let diff = index - modIndex;
            if (diff > N / 2) diff -= N;
            if (diff < -N / 2) diff += N;

            const absDiff = Math.abs(diff);
            const isActive = diff === 0;

            let zIndex = 100 - absDiff;
            let opacity = 1;
            let scale = 1;
            let translateX = 0;
            let rotateY = 0;
            let blur = 0;

            if (isActive) {
              scale = sliderOffsets.activeScale;
              translateX = 0;
              rotateY = 0;
              opacity = 1;
              blur = 0;
              zIndex = 100;
            } else if (diff === -1) {
              scale = sliderOffsets.adjScale;
              translateX = -sliderOffsets.adjacent;
              rotateY = sliderOffsets.adjRotate;
              opacity = 0.8;
              blur = 0;
              zIndex = 90;
            } else if (diff === 1) {
              scale = sliderOffsets.adjScale;
              translateX = sliderOffsets.adjacent;
              rotateY = -sliderOffsets.adjRotate;
              opacity = 0.8;
              blur = 0;
              zIndex = 90;
            } else if (diff < -1) {
              scale = sliderOffsets.farScale;
              translateX = -sliderOffsets.far - (absDiff - 2) * sliderOffsets.farStep;
              rotateY = sliderOffsets.farRotate;
              opacity = absDiff > 3 ? 0 : 0.4;
              blur = 0;
              zIndex = 80 - absDiff;
            } else if (diff > 1) {
              scale = sliderOffsets.farScale;
              translateX = sliderOffsets.far + (absDiff - 2) * sliderOffsets.farStep;
              rotateY = -sliderOffsets.farRotate;
              opacity = absDiff > 3 ? 0 : 0.4;
              blur = 0;
              zIndex = 80 - absDiff;
            }

            return (
              <article
                key={t.id}
                className={`gallery-slide ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (isActive) onSelect(t.id);
                  else setActiveIndex(activeIndex + diff);
                }}
                style={{
                  transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
                  opacity,
                  zIndex,
                  filter: `blur(${blur}px)`,
                  pointerEvents: absDiff > 2 ? 'none' : 'auto'
                }}
              >
                <div className="gallery-preview-frame">
                  <div className="gallery-preview-html-wrapper">
                    <ResumePreview
                      data={GALLERY_DUMMY_DATA}
                      templateId={t.baseTemplate || t.id}
                      isThumbnail={true}
                      settings={{ fontFamily: 'template', fontSize: 11, maxBullets: 2, compactMode: true }}
                    />
                  </div>
                </div>
                <div className="gallery-item-footer">
                  <div className="gallery-item-meta">
                    <span className="gallery-item-cat">{t.category}</span>
                    {isActive && <span className="gallery-item-arrow"><ArrowRight size={14} /></span>}
                  </div>
                  <span className="gallery-item-name">{t.name}</span>
                  <p className="gallery-item-desc">{t.desc}</p>
                </div>
                {isActive && (
                  <div className="gallery-select-overlay">
                    <span>Use This Template <ArrowRight size={14} /></span>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <button className="slider-btn slider-btn-next" onClick={handleNext}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function UserProfilePage({
  user,
  history,
  onBackToTemplates,
  onOpenTracker,
  onOpenResume,
  onDeleteResume,
  onUpdateProfile,
  onChangePassword,
  onClearHistory,
}) {
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    linkedin: user?.linkedin || '',
    github: user?.github || '',
    portfolio: user?.portfolio || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      linkedin: user?.linkedin || '',
      github: user?.github || '',
      portfolio: user?.portfolio || '',
    });
  }, [user]);

  const updateProfileField = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const updatePasswordField = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileMsg('Name and email are required.');
      return;
    }
    onUpdateProfile(profileForm);
    setProfileMsg('Profile and credentials updated.');
  };

  const handleUpdatePassword = () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg('Please complete all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New password and confirm password do not match.');
      return;
    }
    const result = onChangePassword(currentPassword, newPassword);
    if (result && result.ok === false) {
      setPasswordMsg(result.message || 'Unable to update password.');
      return;
    }
    setPasswordMsg(result?.message || 'Password updated successfully.');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Profile</h1>
        </div>
      </div>

      <div className="profile-overview-card">
        <div className="profile-overview-avatar">
          <span>{(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.name || user?.email || "U").charAt(0).toUpperCase()}</span>
        </div>
        <div className="profile-overview-copy">
          <h2>{user?.name || 'Your Profile'}</h2>
          <p>{user?.email || 'Add your account email and contact details here.'}</p>
        </div>
        <div className="profile-overview-meta">
          <div><strong>{history.length}</strong><span>Saved resumes</span></div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-panel">
          <h3>Personal Information</h3>
          <div className="row-2">
            <div className="field"><label>Full Name</label><input className="input" value={profileForm.name} onChange={e => updateProfileField('name', e.target.value)} /></div>
            <div className="field"><label>Email</label><input className="input" value={profileForm.email} onChange={e => updateProfileField('email', e.target.value)} /></div>
          </div>
          <div className="row-2">
            <div className="field"><label>Phone</label><input className="input" value={profileForm.phone} onChange={e => updateProfileField('phone', e.target.value)} /></div>
            <div className="field"><label>Location</label><input className="input" value={profileForm.location} onChange={e => updateProfileField('location', e.target.value)} /></div>
          </div>
          <div className="row-2">
            <div className="field"><label>LinkedIn</label><input className="input" value={profileForm.linkedin} onChange={e => updateProfileField('linkedin', e.target.value)} /></div>
            <div className="field"><label>GitHub</label><input className="input" value={profileForm.github} onChange={e => updateProfileField('github', e.target.value)} /></div>
          </div>
          <button className="btn btn-black btn-sm" onClick={handleSaveProfile}>Save Changes</button>
          {profileMsg && <p className="profile-message">{profileMsg}</p>}
        </div>

        <div className="profile-panel">
          <h3>Resume History</h3>
          {!history.length ? (
            <div className="dashboard-empty-mini">
              <ClipboardList size={20} />
              <p>No resume history yet</p>
            </div>
          ) : (
            <div className="history-list-compact">
              {history.map(item => (
                <div key={item.id} className="history-item-compact">
                  <div className="history-item-info">
                    <strong>{item.meta?.name || 'Untitled Resume'}</strong>
                    <span>{new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="history-item-actions">
                    <button className="btn-icon-only" onClick={() => onOpenResume(item)} title="Open"><FileText size={14} /></button>
                    <button className="btn-icon-only" onClick={() => onDeleteResume(item.id)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {history.length > 0 && (
                <button className="btn-subtle btn-sm btn-full" onClick={onClearHistory} style={{ marginTop: 12 }}>
                  Clear History
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


const TRACKER_STATUS_COLUMNS = [
  { key: 'applied', label: 'Applied' },
  { key: 'interview', label: 'Interview' },
  { key: 'final', label: 'Final' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
];
const APP_STATUS_OPTIONS = TRACKER_STATUS_COLUMNS.map(s => s.label);
const SOURCE_OPTIONS = ['LinkedIn', 'Referral', 'Company Site', 'Recruiter', 'Job Board', 'Other'];
const ROUND_OPTIONS = ['HR', 'Technical', 'Manager', 'Final'];
const FOLLOW_UP_CADENCE = [5, 7, 10];

function normalizeApplicationStatus(status) {
  const raw = String(status || '').trim().toLowerCase();
  if (raw.includes('reject')) return 'rejected';
  if (raw.includes('offer') || raw.includes('select') || raw.includes('hired')) return 'offer';
  if (raw.includes('final')) return 'final';
  if (raw.includes('interview')) return 'interview';
  return 'applied';
}

function statusLabelFromKey(statusKey) {
  return TRACKER_STATUS_COLUMNS.find(s => s.key === statusKey)?.label || 'Applied';
}

function parseDateValue(value) {
  if (!value) return null;
  const text = String(value);
  const normalized = text.includes('T') ? text : `${text}T00:00:00`;
  const dt = new Date(normalized);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatDateShort(value) {
  const dt = parseDateValue(value);
  return dt ? dt.toLocaleDateString() : 'N/A';
}

function daysFromToday(value) {
  const dt = parseDateValue(value);
  if (!dt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);
  return Math.round((dt.getTime() - today.getTime()) / 86400000);
}

function createApplicationId() {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createRoundId() {
  return `rnd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createBlankApplication() {
  const nowIso = new Date().toISOString();
  return {
    id: createApplicationId(),
    company: '',
    role: '',
    source: 'LinkedIn',
    recruiter: '',
    recruiterEmail: '',
    status: 'Applied',
    date: '',
    notes: '',
    interviewRounds: [],
    deadlines: { assessmentDue: '', interviewDate: '', offerExpiry: '' },
    followUpCadenceDays: 7,
    lastFollowUpDate: '',
    lastResponseDate: '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function migrateApplication(raw) {
  const base = createBlankApplication();
  const normalizedStatus = statusLabelFromKey(normalizeApplicationStatus(raw?.status));
  const mappedRounds = Array.isArray(raw?.interviewRounds)
    ? raw.interviewRounds.map(r => ({
      id: r?.id || createRoundId(),
      type: r?.type || 'HR',
      date: r?.date || '',
      notes: r?.notes || '',
    }))
    : [];

  return {
    ...base,
    ...raw,
    id: raw?.id || base.id,
    source: raw?.source || 'LinkedIn',
    recruiter: raw?.recruiter || raw?.recruiterName || '',
    recruiterEmail: raw?.recruiterEmail || '',
    status: normalizedStatus,
    interviewRounds: mappedRounds,
    deadlines: {
      ...base.deadlines,
      ...(raw?.deadlines || {}),
      assessmentDue: raw?.deadlines?.assessmentDue || raw?.assessmentDue || '',
      interviewDate: raw?.deadlines?.interviewDate || raw?.interviewDate || '',
      offerExpiry: raw?.deadlines?.offerExpiry || raw?.offerExpiry || '',
    },
    followUpCadenceDays: FOLLOW_UP_CADENCE.includes(Number(raw?.followUpCadenceDays)) ? Number(raw.followUpCadenceDays) : 7,
    createdAt: raw?.createdAt || base.createdAt,
    updatedAt: raw?.updatedAt || base.updatedAt,
  };
}

function buildFollowUpEmail(app) {
  const recruiter = app.recruiter || 'Hiring Team';
  const role = app.role || 'the role';
  const company = app.company || 'your company';
  const appliedInfo = app.date ? ` on ${formatDateShort(app.date)}` : '';
  const subject = `Follow-up: ${role} application at ${company}`;
  const body =
    `Hi ${recruiter},

I hope you're doing well. I wanted to follow up on my application for the ${role} position at ${company}${appliedInfo}.

I remain very interested in the opportunity and would appreciate any update on the next steps in the process.

Thank you for your time and consideration.

Best regards,
[Your Name]`;

  return { subject, body };
}

function ApplicationTrackerPage({ onBackToTemplates, onCreateResume }) {
  const [applications, setApplications] = useState(() => {
    const stored = readStorageArray(STORAGE_KEYS.applications, []);
    const list = stored.length ? stored.map(migrateApplication) : [createBlankApplication()];
    return list;
  });
  const [openApplicationId, setOpenApplicationId] = useState(null);
  const [trackerMessage, setTrackerMessage] = useState('');
  const [dragAppId, setDragAppId] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    if (openApplicationId && !applications.some(app => app.id === openApplicationId)) {
      setOpenApplicationId(null);
    }
  }, [applications, openApplicationId]);

  const showTrackerMessage = (msg) => {
    setTrackerMessage(msg);
    setTimeout(() => setTrackerMessage(''), 2200);
  };

  const patchApplication = (id, patchOrUpdater) => {
    setApplications(prev => prev.map(app => {
      if (app.id !== id) return app;
      const patch = typeof patchOrUpdater === 'function' ? patchOrUpdater(app) : patchOrUpdater;
      return { ...app, ...patch, updatedAt: new Date().toISOString() };
    }));
  };

  const setAppField = (id, field, value) => patchApplication(id, { [field]: value });
  const setDeadlineField = (id, field, value) => patchApplication(id, app => ({
    deadlines: { ...(app.deadlines || {}), [field]: value },
  }));

  const addApp = () => {
    const nextApp = createBlankApplication();
    setApplications(prev => [...prev, nextApp]);
    setOpenApplicationId(nextApp.id);
  };
  const rmApp = (id) => {
    setApplications(prev => prev.filter(app => app.id !== id));
    setOpenApplicationId(prev => (prev === id ? null : prev));
  };
  const saveTracker = () => {
    localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(applications));
    showTrackerMessage('Tracker saved successfully.');
  };

  const addRound = (id) => patchApplication(id, app => ({
    interviewRounds: [...(app.interviewRounds || []), { id: createRoundId(), type: 'HR', date: '', notes: '' }],
    status: normalizeApplicationStatus(app.status) === 'applied' ? 'Interview' : app.status,
  }));

  const setRoundField = (id, roundId, field, value) => patchApplication(id, app => ({
    interviewRounds: (app.interviewRounds || []).map(r => (r.id === roundId ? { ...r, [field]: value } : r)),
  }));

  const removeRound = (id, roundId) => patchApplication(id, app => ({
    interviewRounds: (app.interviewRounds || []).filter(r => r.id !== roundId),
  }));

  const moveStatus = (id, statusKey) => {
    patchApplication(id, { status: statusLabelFromKey(statusKey) });
  };

  const onDropStatus = (statusKey) => {
    if (!dragAppId) return;
    moveStatus(dragAppId, statusKey);
    setDragAppId(null);
  };

  const markFollowUpSent = (id) => {
    const today = new Date().toISOString().slice(0, 10);
    patchApplication(id, { lastFollowUpDate: today });
    showTrackerMessage('Follow-up marked as sent.');
  };

  const copyFollowUpEmail = (app) => {
    const email = buildFollowUpEmail(app);
    safeCopy(
      `Subject: ${email.subject}\n\n${email.body}`,
      () => showTrackerMessage('Follow-up email copied.'),
      () => showTrackerMessage('Could not copy follow-up email.')
    );
  };

  const appFeedbackTips = generateApplicationFeedback(applications, '');
  const counts = applications.reduce((acc, app) => {
    const status = normalizeApplicationStatus(app.status);
    if (status === 'applied') acc.applied += 1;
    if (status === 'interview') acc.interview += 1;
    if (status === 'final') acc.final += 1;
    if (status === 'offer') acc.offer += 1;
    if (status === 'rejected') acc.rejected += 1;
    return acc;
  }, { applied: 0, interview: 0, final: 0, offer: 0, rejected: 0 });

  const sourceRows = Object.values(applications.reduce((acc, app) => {
    const source = app.source || 'Other';
    if (!acc[source]) acc[source] = { source, total: 0, interview: 0, offer: 0 };
    acc[source].total += 1;
    const status = normalizeApplicationStatus(app.status);
    if (status === 'interview' || status === 'final' || status === 'offer') acc[source].interview += 1;
    if (status === 'offer') acc[source].offer += 1;
    return acc;
  }, {})).map(row => ({
    ...row,
    interviewRate: row.total ? Math.round((row.interview / row.total) * 100) : 0,
  })).sort((a, b) => b.interviewRate - a.interviewRate);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);
  const inLastWeek = (value) => {
    const dt = parseDateValue(value);
    return !!dt && dt >= weekAgo;
  };

  const weeklySent = applications.filter(app => inLastWeek(app.date || app.createdAt)).length;
  const weeklyInterview = applications.filter(app =>
    (app.interviewRounds || []).some(r => inLastWeek(r.date)) ||
    ((normalizeApplicationStatus(app.status) === 'interview' || normalizeApplicationStatus(app.status) === 'final' || normalizeApplicationStatus(app.status) === 'offer') && inLastWeek(app.updatedAt))
  ).length;
  const weeklyResponses = applications.filter(app =>
    inLastWeek(app.lastResponseDate) || (normalizeApplicationStatus(app.status) !== 'applied' && inLastWeek(app.updatedAt))
  ).length;
  const weeklyResponseRate = weeklySent ? Math.round((weeklyResponses / weeklySent) * 100) : 0;

  const deadlineItems = applications.flatMap(app => {
    const deadlines = app.deadlines || {};
    return [
      { type: 'Assessment Due', date: deadlines.assessmentDue },
      { type: 'Interview Date', date: deadlines.interviewDate },
      { type: 'Offer Expiry', date: deadlines.offerExpiry },
    ]
      .filter(d => d.date)
      .map(d => {
        const diff = daysFromToday(d.date);
        return {
          id: `${app.id}_${d.type}`,
          appId: app.id,
          company: app.company || 'Untitled Company',
          role: app.role || 'Role',
          type: d.type,
          date: d.date,
          dayDiff: diff,
        };
      });
  }).sort((a, b) => (parseDateValue(a.date)?.getTime() || 0) - (parseDateValue(b.date)?.getTime() || 0));

  const followUpReminders = applications
    .filter(app => ['applied', 'interview', 'final'].includes(normalizeApplicationStatus(app.status)))
    .map(app => {
      const baseDate = parseDateValue(app.lastResponseDate)
        || parseDateValue(app.lastFollowUpDate)
        || parseDateValue(app.date)
        || parseDateValue(app.updatedAt)
        || parseDateValue(app.createdAt);
      if (!baseDate) return null;
      const cadence = Number(app.followUpCadenceDays) || 7;
      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + cadence);
      const dayDiff = daysFromToday(nextDate.toISOString());
      return {
        appId: app.id,
        company: app.company || 'Untitled Company',
        role: app.role || 'Role',
        dueDate: nextDate.toISOString().slice(0, 10),
        dayDiff,
      };
    })
    .filter(Boolean)
    .filter(item => item.dayDiff !== null && item.dayDiff <= 0)
    .sort((a, b) => a.dayDiff - b.dayDiff);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Tracker</h1>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-black btn-sm" onClick={saveTracker}>
            <Check size={14} /> Save Tracker
          </button>
          <button className="btn btn-black btn-sm" onClick={onBackToTemplates}>
            <FileText size={14} /> Builder Mode
          </button>
        </div>
      </div>

      <div className="tracker-stats tracker-stats-5">
        <div className="tracker-stat-card tracker-stat-applied"><strong>{counts.applied}</strong><span>Applied</span></div>
        <div className="tracker-stat-card tracker-stat-interview"><strong>{counts.interview}</strong><span>Interview</span></div>
        <div className="tracker-stat-card tracker-stat-final"><strong>{counts.final}</strong><span>Final</span></div>
        <div className="tracker-stat-card tracker-stat-offer"><strong>{counts.offer}</strong><span>Offers</span></div>
        <div className="tracker-stat-card tracker-stat-rejected"><strong>{counts.rejected}</strong><span>Rejected</span></div>
      </div>
      <div className="tracker-panel-main">
        {trackerMessage && <p className="profile-message">{trackerMessage}</p>}
        {deadlineItems.length > 0 && (
          <div className="profile-panel tracker-deadlines-bar">
            <div className="tracker-section-head">
              <h3><CalendarClock size={16} /> Upcoming Deadlines</h3>
            </div>
            <div className="deadline-row-scroll">
              {deadlineItems.slice(0, 4).map(item => (
                <div key={item.id} className={`deadline-chip ${item.dayDiff < 0 ? 'overdue' : 'upcoming'}`}>
                  <strong>{item.company}</strong>
                  <span>{item.type} • {item.dayDiff < 0 ? 'Overdue' : `${item.dayDiff}d left`}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>




      <div className="profile-panel">
        {applications.map((app, idx) => (
          <div key={app.id} className={`entry-card app-entry-card app-status-${normalizeApplicationStatus(app.status)}`}>
            <div
              className="tracker-app-summary"
              role="button"
              tabIndex={0}
              onClick={() => setOpenApplicationId(openApplicationId === app.id ? null : app.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpenApplicationId(openApplicationId === app.id ? null : app.id);
                }
              }}
            >
              <div className="tracker-app-summary-main">
                <div className="tracker-app-summary-top">
                  <span className="tracker-app-index">Application {idx + 1}</span>
                  <span className={`status-pill status-pill-${normalizeApplicationStatus(app.status)}`}>{statusLabelFromKey(normalizeApplicationStatus(app.status))}</span>
                </div>
                <strong>{app.company || 'Untitled Company'}</strong>
                <p>{app.role || 'Role not set'} • {app.source || 'Source not set'}</p>
              </div>
              <div className="tracker-app-summary-side">
                <span>{app.date ? formatDateShort(app.date) : 'No applied date'}</span>
                <span>{(app.interviewRounds || []).length} rounds</span>
                <span>{app.deadlines?.interviewDate || app.deadlines?.assessmentDue || app.deadlines?.offerExpiry ? 'Deadlines set' : 'No deadlines'}</span>
              </div>
              <div className="tracker-app-summary-actions">
                {applications.length > 1 && (
                  <button
                    className="btn-icon-only"
                    onClick={(e) => {
                      e.stopPropagation();
                      rmApp(app.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                {openApplicationId === app.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {openApplicationId === app.id && (
              <div className="tracker-app-body">
                <div className="row-3">
                  <div className="field"><label>Company</label><input className="input" value={app.company} onChange={e => setAppField(app.id, 'company', e.target.value)} placeholder="Company Name" /></div>
                  <div className="field"><label>Role</label><input className="input" value={app.role} onChange={e => setAppField(app.id, 'role', e.target.value)} placeholder="Role Applied" /></div>
                  <div className="field">
                    <label>Source</label>
                    <select className="input" value={app.source || 'LinkedIn'} onChange={e => setAppField(app.id, 'source', e.target.value)}>
                      {SOURCE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row-2">
                  <div className="field">
                    <label>Status</label>
                    <select
                      className={`input status-select status-select-${normalizeApplicationStatus(app.status)}`}
                      value={statusLabelFromKey(normalizeApplicationStatus(app.status))}
                      onChange={e => setAppField(app.id, 'status', e.target.value)}
                    >
                      {APP_STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>Applied Date</label><input className="input" type="date" value={app.date || ''} onChange={e => setAppField(app.id, 'date', e.target.value)} /></div>
                </div>


                <div className="tracker-subsection">
                  <div className="tracker-subsection-head">
                    <strong>Deadline Tracker</strong>
                  </div>
                  <div className="row-3">
                    <div className="field"><label>Assessment Due</label><input className="input" type="date" value={app.deadlines?.assessmentDue || ''} onChange={e => setDeadlineField(app.id, 'assessmentDue', e.target.value)} /></div>
                    <div className="field"><label>Interview Date</label><input className="input" type="date" value={app.deadlines?.interviewDate || ''} onChange={e => setDeadlineField(app.id, 'interviewDate', e.target.value)} /></div>
                    <div className="field"><label>Offer Expiry</label><input className="input" type="date" value={app.deadlines?.offerExpiry || ''} onChange={e => setDeadlineField(app.id, 'offerExpiry', e.target.value)} /></div>
                  </div>
                </div>

                <div className="tracker-subsection">
                  <div className="tracker-subsection-head">
                    <strong>Interview Rounds</strong>
                    <button className="btn btn-outline btn-sm" onClick={() => addRound(app.id)}><Plus size={12} /> Add Round</button>
                  </div>
                  {(app.interviewRounds || []).length ? (
                    <div className="round-list">
                      {app.interviewRounds.map(round => (
                        <div key={round.id} className="round-item">
                          <div className="row-3">
                            <div className="field">
                              <label>Round</label>
                              <select className="input" value={round.type || 'HR'} onChange={e => setRoundField(app.id, round.id, 'type', e.target.value)}>
                                {ROUND_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                              </select>
                            </div>
                            <div className="field"><label>Date</label><input className="input" type="date" value={round.date || ''} onChange={e => setRoundField(app.id, round.id, 'date', e.target.value)} /></div>
                            <div className="field round-remove-wrap"><button className="btn btn-outline btn-sm" onClick={() => removeRound(app.id, round.id)}><Trash2 size={12} /> Remove</button></div>
                          </div>
                          <div className="field"><label>Notes</label><AutoTextarea value={round.notes || ''} onChange={e => setRoundField(app.id, round.id, 'notes', e.target.value)} placeholder="Round feedback and key takeaways..." /></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="r-desc">No interview rounds yet.</p>
                  )}
                </div>

                <div className="field">
                  <label>Notes</label>
                  <AutoTextarea value={app.notes || ''} onChange={e => setAppField(app.id, 'notes', e.target.value)} placeholder="Recruiter feedback, prep tasks, and strategic notes..." />
                </div>

                <div className="tracker-card-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => markFollowUpSent(app.id)}><BellRing size={12} /> Mark Follow-up Sent</button>
                  <button className="btn btn-black btn-sm" onClick={() => copyFollowUpEmail(app)}><Mail size={12} /> Copy Follow-up Email</button>
                </div>
              </div>
            )}
          </div>
        ))}
        <button className="btn-add" onClick={addApp}><Plus size={14} /> Add Application</button>
      </div>
    </div>
  );
}


/* ===================== RESUME PREVIEW COMPONENT ===================== */
function ResumePreview({ data, templateId, isThumbnail, settings, resumeRef }) {
  if (!data) return null;
  const contact = [data.email, data.phone, data.location, data.linkedin, data.portfolio, data.github].filter(Boolean);
  const edu = Array.isArray(data.education) ? data.education : (data.education ? [{ degree: data.education }] : []);
  const cls = 'resume-page ' + (templateId || 'jakeryan') + (isThumbnail ? ' thumb' : '');
  const bulletCap = Number.isFinite(settings?.maxBullets) ? settings.maxBullets : Number.POSITIVE_INFINITY;
  const fontFamily = settings?.fontFamily && settings.fontFamily !== 'template'
    ? FONT_FAMILY_MAP[settings.fontFamily]
    : undefined;
  const pageStyle = {
    ...(fontFamily ? { fontFamily } : {}),
    ...(settings?.fontSize ? { fontSize: `${settings.fontSize}px` } : {}),
    ...(settings?.compactMode ? { lineHeight: 1.35 } : {}),
  };

  return (
    <div ref={resumeRef} className={cls} id={isThumbnail ? undefined : 'resume-render'} style={pageStyle}>
      <header className="r-header">
        <div className="r-name">{data.name || 'Your Name'}</div>
        <div className="r-contact">
          {contact.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="r-sep">|</span>}
              <span>{c}</span>
            </React.Fragment>
          ))}
        </div>
      </header>

      {data.summary && (
        <section className="r-section">
          <h2 className="r-sec-title">Professional Summary</h2>
          <p className="r-text">{data.summary}</p>
        </section>
      )}

      {(data.skills?.technical?.length > 0 || data.skills?.tools?.length > 0 || data.skills?.soft?.length > 0) && (
        <section className="r-section">
          <h2 className="r-sec-title">Skills</h2>
          <div className="r-skills">
            {data.skills?.technical?.length > 0 && (
              <div className="r-skill-row">
                <strong>Technical:</strong> <span>{data.skills.technical.join(', ')}</span>
              </div>
            )}
            {data.skills?.tools?.length > 0 && (
              <div className="r-skill-row">
                <strong>Tools:</strong> <span>{data.skills.tools.join(', ')}</span>
              </div>
            )}
            {data.skills?.soft?.length > 0 && (
              <div className="r-skill-row">
                <strong>Soft Skills:</strong> <span>{data.skills.soft.join(', ')}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {data.experience?.some(e => e.title || e.company) && (
        <section className="r-section">
          <h2 className="r-sec-title">Experience</h2>
          {data.experience.filter(e => e.title || e.company).map((exp, i) => (
            <div key={i} className="r-entry">
              <div className="r-entry-head">
                <div><strong>{exp.title}</strong>{exp.company && <span> — <em>{exp.company}</em></span>}</div>
                <div className="r-entry-meta">{exp.location}{exp.location && exp.duration && ' | '}{exp.duration}</div>
              </div>
              {exp.bullets?.length > 0 && (
                <ul className="r-bullets">
                  {exp.bullets.slice(0, bulletCap).map((b, j) => (
                    <li key={j}>
                      {b}
                      {exp.evidenceLines?.[j] && <span className="r-proof"> Proof: {exp.evidenceLines[j]}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {data.projects?.some(p => p.name) && (
        <section className="r-section">
          <h2 className="r-sec-title">Projects</h2>
          {data.projects.filter(p => p.name).map((p, i) => (
            <div key={i} className="r-entry">
              <div className="r-entry-head">
                <div><strong>{p.name}</strong>{p.techStack && <span className="r-tech"> | {p.techStack}</span>}</div>
              </div>
              {p.description && <p className="r-desc">{p.description}</p>}
              {p.bullets?.length > 0 && (
                <ul className="r-bullets">
                  {p.bullets.slice(0, bulletCap).map((b, j) => (
                    <li key={j}>
                      {b}
                      {p.evidenceLines?.[j] && <span className="r-proof"> Proof: {p.evidenceLines[j]}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {edu.length > 0 && (
        <section className="r-section">
          <h2 className="r-sec-title">Education</h2>
          {edu.map((e, i) => (
            <div key={i} className="r-entry">
              <div className="r-entry-head">
                <div><strong>{e.degree}</strong>{e.school && <span> — <em>{e.school}</em></span>}</div>
                <div className="r-entry-meta">{e.dates}</div>
              </div>
              {e.details && <p className="r-desc" style={{ whiteSpace: 'pre-line' }}>{e.details}</p>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

/* ===================== ATS SCORE PANEL ===================== */
function ATSPanel({ ats }) {
  if (!ats) return null;
  const { score, breakdown, missing_keywords, improvement_tips } = ats;
  const circ = 2 * Math.PI * 46;
  const off = circ - (score / 100) * circ;
  const col = score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : '#dc2626';
  const bars = [
    { l: 'Keywords', v: breakdown?.keywords || 0, m: 30 },
    { l: 'Skills', v: breakdown?.skills || 0, m: 20 },
    { l: 'Impact', v: breakdown?.impact || 0, m: 20 },
    { l: 'Structure', v: breakdown?.structure || 0, m: 20 },
    { l: 'Readability', v: breakdown?.readability || 0, m: 10 },
  ];
  return (
    <div className="ats-card">
      <h3><Award size={16} /> ATS Score</h3>
      <div className="ats-body">
        <div className="ats-ring">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle cx="50" cy="50" r="46" fill="none" stroke={col} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="ats-ring-label">
            <span className="ats-num" style={{ color: col }}>{score}</span>
            <span className="ats-of">/100</span>
          </div>
        </div>
        <div className="ats-bars">
          {bars.map((b, i) => (
            <div key={i} className="ats-bar-row">
              <div className="ats-bar-label">{b.l} <span>{b.v}/{b.m}</span></div>
              <div className="ats-bar-track">
                <div className="ats-bar-fill" style={{ width: (b.v / b.m * 100) + '%', background: (b.v / b.m) >= 0.7 ? '#16a34a' : (b.v / b.m) >= 0.4 ? '#ca8a04' : '#dc2626' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {missing_keywords?.length > 0 && (
        <div className="ats-section">
          <h4><Search size={14} /> Missing Keywords</h4>
          <div className="ats-tags">{missing_keywords.slice(0, 8).map((k, i) => <span key={i} className="ats-tag">{k}</span>)}</div>
        </div>
      )}
      {improvement_tips?.length > 0 && (
        <div className="ats-section">
          <h4><TrendingUp size={14} /> Tips</h4>
          <ul className="ats-tips">{improvement_tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function JDMatchPanel({ data }) {
  if (!data) return null;
  const score = data.score || 0;
  const col = score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : '#dc2626';
  return (
    <div className="ats-card">
      <h3><Search size={16} /> JD Match Explainability</h3>
      <div className="jd-score">
        <strong style={{ color: col }}>{score}%</strong>
        <span>match with target job description</span>
      </div>
      {data.explainability?.length > 0 && (
        <div className="ats-section">
          <h4><Wand2 size={14} /> Why It Matches</h4>
          <ul className="ats-tips">
            {data.explainability.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      )}
      {data.missing_keywords?.length > 0 && (
        <div className="ats-section">
          <h4><AlertCircle size={14} /> Missing for JD</h4>
          <div className="ats-tags">
            {data.missing_keywords.slice(0, 12).map((k, i) => <span key={i} className="ats-tag">{k}</span>)}
          </div>
        </div>
      )}
      <div className="ats-section">
        <h4><TrendingUp size={14} /> Recommendation</h4>
        <p className="r-desc" style={{ marginBottom: 0 }}>{data.recommendation}</p>
      </div>
    </div>
  );
}



/* ===================== FORM SECTION (COLLAPSIBLE) ===================== */
function Section({ num, title, icon, children, open: defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen !== false);
  return (
    <div className="section-card">
      <button type="button" className="section-toggle" onClick={() => setOpen(!open)}>
        <div className="section-left">
          <span className="section-num">{num}</span>
          {icon}
          <span className="section-title">{title}</span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

/* ===================== BUILDER PAGE ===================== */
const DEFAULT_FORM_DATA = {
  name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '',
  targetRole: '', yearsOfExperience: '', jobDescription: '', summary: '', rolePackId: 'auto',
  skills: '', tools: '',
  education: '',
  experience: [{ title: '', company: '', duration: '', location: '', details: '', evidence: '' }],
  projects: [{ name: '', description: '', techStack: '', details: '', evidence: '' }],
};

const DEFAULT_LAYOUT_SETTINGS = {
  fontFamily: 'template',
  fontSize: 11,
  maxBullets: 5,
  compactMode: false,
  autoFit: true,
  adaptiveOnePage: true,
};

function buildInitialFormData(initialDraft) {
  return {
    ...DEFAULT_FORM_DATA,
    ...(initialDraft?.formData || {}),
    experience: Array.isArray(initialDraft?.formData?.experience) && initialDraft.formData.experience.length
      ? initialDraft.formData.experience
      : DEFAULT_FORM_DATA.experience,
    projects: Array.isArray(initialDraft?.formData?.projects) && initialDraft.formData.projects.length
      ? initialDraft.formData.projects
      : DEFAULT_FORM_DATA.projects,
  };
}

function buildInitialLayoutSettings(templateConfig, initialDraft) {
  return {
    ...DEFAULT_LAYOUT_SETTINGS,
    ...(templateConfig?.defaults || {}),
    ...(initialDraft?.layoutSettings || {}),
  };
}

function BuilderPage({ selectedTemplateConfig, onBack, backendStatus, initialDraft, onSaveHistory }) {
  const tmpl = selectedTemplateConfig || TEMPLATES[0];
  const renderTemplateId = tmpl.baseTemplate || tmpl.id;
  const [formData, setFormData] = useState(() => buildInitialFormData(initialDraft));
  const [resumeData, setResumeData] = useState(null);
  const [atsData, setAtsData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showATS, setShowATS] = useState(false);
  const [atsChecking, setAtsChecking] = useState(false);
  const [atsSyncState, setAtsSyncState] = useState('idle');
  const [showJDMatch, setShowJDMatch] = useState(false);
  const [jdMatchData, setJdMatchData] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [privacyMode, setPrivacyMode] = useState('cloud');
  const [layoutSettings, setLayoutSettings] = useState(() => buildInitialLayoutSettings(tmpl, initialDraft));
  const [fitScale, setFitScale] = useState(1);
  const a4FrameRef = useRef(null);
  const resumeContentRef = useRef(null);
  const atsSyncRequestRef = useRef(0);

  const addToast = useCallback((msg, type) => {
    setToasts(p => [...p, { id: Date.now(), message: msg, type: type || 'success' }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const hasTopLevelInput = [
      formData.name, formData.email, formData.phone, formData.location,
      formData.linkedin, formData.github, formData.portfolio,
      formData.targetRole, formData.yearsOfExperience, formData.jobDescription, formData.summary,
      formData.skills, formData.tools, formData.education,
    ].some(v => String(v || '').trim());

    const hasExperienceInput = (formData.experience || []).some(e =>
      [e.title, e.company, e.duration, e.location, e.details, e.evidence].some(v => String(v || '').trim())
    );

    const hasProjectInput = (formData.projects || []).some(p =>
      [p.name, p.description, p.techStack, p.details, p.evidence].some(v => String(v || '').trim())
    );

    if (hasTopLevelInput || hasExperienceInput || hasProjectInput) {
      const mode = hasGenerated ? 'final' : 'preview';
      setResumeData(generateResume(formData, formData.targetRole, { mode, rolePackId: formData.rolePackId }));
    } else {
      setResumeData(null);
    }
  }, [formData, hasGenerated]);

  useEffect(() => {
    if (!resumeData) {
      setJdMatchData(null);
      return;
    }
    setJdMatchData(calculateJDMatchDetails(resumeData, formData.targetRole, formData.jobDescription, formData.rolePackId));
  }, [resumeData, formData.targetRole, formData.jobDescription, formData.rolePackId]);

  const atsSyncKey = resumeData ? JSON.stringify({
    name: resumeData.name,
    title: formData.targetRole,
    summary: resumeData.summary,
    skills: resumeData.skills,
    experience: resumeData.experience,
    projects: resumeData.projects,
    education: resumeData.education,
    jobDescription: formData.jobDescription,
  }) : '';

  useEffect(() => {
    if (!resumeData) {
      setAtsSyncState('idle');
      return;
    }

    if (privacyMode !== 'cloud' || !backendStatus.running || !backendStatus.groqConfigured) {
      setAtsSyncState('offline');
      return;
    }

    if (generating) return;

    const requestId = ++atsSyncRequestRef.current;
    setAtsSyncState('syncing');

    const timer = setTimeout(async () => {
      try {
        const liveAts = await scoreATSWithGroq(resumeData, formData.targetRole, formData.jobDescription);
        if (requestId !== atsSyncRequestRef.current) return;
        setAtsData(liveAts);
        setAtsSyncState('live');
      } catch {
        if (requestId !== atsSyncRequestRef.current) return;
        setAtsSyncState('error');
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [atsSyncKey, privacyMode, backendStatus.running, backendStatus.groqConfigured, generating, formData.targetRole, formData.jobDescription, resumeData]);

  const set = (field, val) => setFormData(p => ({ ...p, [field]: val }));
  const setLayout = (field, val) => setLayoutSettings(p => ({ ...p, [field]: val }));

  const setExp = (i, f, v) => setFormData(p => {
    const arr = [...p.experience]; arr[i] = { ...arr[i], [f]: v }; return { ...p, experience: arr };
  });
  const addExp = () => setFormData(p => ({
    ...p, experience: [...p.experience, { title: '', company: '', duration: '', location: '', details: '', evidence: '' }]
  }));
  const rmExp = (i) => setFormData(p => ({ ...p, experience: p.experience.filter((_, x) => x !== i) }));

  const setProj = (i, f, v) => setFormData(p => {
    const arr = [...p.projects]; arr[i] = { ...arr[i], [f]: v }; return { ...p, projects: arr };
  });
  const addProj = () => setFormData(p => ({
    ...p, projects: [...p.projects, { name: '', description: '', techStack: '', details: '', evidence: '' }]
  }));
  const rmProj = (i) => setFormData(p => ({ ...p, projects: p.projects.filter((_, x) => x !== i) }));

  const mergeAIIntoForm = (base, result) => ({
    ...base,
    summary: result.summary || base.summary,
    skills: result.skills ? [
      ...(result.skills.technical || []),
      ...(result.skills.tools || []),
      ...(result.skills.soft || []),
    ].join(', ') : base.skills,
    education: Array.isArray(result.education) && result.education.length > 0
      ? result.education.map((e) => {
        const parts = [e.degree, e.school, e.location, e.dates].filter(Boolean);
        const line = parts.join(' - ');
        return e.details ? `${line}${line ? ' - ' : ''}${e.details}` : line;
      }).filter(Boolean).join('\n')
      : base.education,
    experience: result.experience?.map((e, i) => ({
      title: e.title || base.experience[i]?.title || '',
      company: e.company || base.experience[i]?.company || '',
      duration: e.duration || base.experience[i]?.duration || '',
      location: e.location || base.experience[i]?.location || '',
      details: e.bullets ? e.bullets.join('\n') : (base.experience[i]?.details || ''),
      evidence: base.experience[i]?.evidence || '',
    })) || base.experience,
    projects: result.projects?.map((p, i) => ({
      name: p.name || base.projects[i]?.name || '',
      description: p.description || base.projects[i]?.description || '',
      techStack: p.techStack || base.projects[i]?.techStack || '',
      details: p.bullets ? p.bullets.join('\n') : (base.projects[i]?.details || ''),
      evidence: base.projects[i]?.evidence || '',
    })) || base.projects,
  });

  const pushHistory = (generatedResume, generatedAts, sourceFormData = formData) => {
    if (!onSaveHistory || !generatedResume) return;
    onSaveHistory({
      templateId: tmpl.id,
      templateName: tmpl.name,
      baseTemplateId: renderTemplateId,
      formData: sourceFormData,
      layoutSettings,
      resumeData: generatedResume,
      atsData: generatedAts || generatedResume.ats || null,
      meta: {
        name: generatedResume.name || sourceFormData.name || '',
        targetRole: sourceFormData.targetRole || '',
        atsScore: (generatedAts || generatedResume.ats)?.score,
      },
    });
  };

  const handleGenerate = async () => {
    if (!formData.name.trim()) { addToast('Please enter your name.', 'error'); return; }
    setGenerating(true);
    try {
      const useCloudAI = privacyMode === 'cloud' && backendStatus.running && backendStatus.groqConfigured;
      if (useCloudAI) {
        const result = await enhanceWithGroq(formData, formData.targetRole, formData.rolePackId);
        const mergedFormData = mergeAIIntoForm(formData, result);
        setFormData(mergedFormData);
        setResumeData(result);
        setAtsData(result.ats);
        setAtsSyncState('live');
        setHasGenerated(true);
        pushHistory(result, result.ats, mergedFormData);
        addToast('AI-enhanced resume generated! You can now edit the text directly.');
      } else {
        const result = generateResume(formData, formData.targetRole, { mode: 'final', rolePackId: formData.rolePackId });
        setResumeData(result);
        setAtsData(result.ats);
        setAtsSyncState('offline');
        setHasGenerated(true);
        pushHistory(result, result.ats, formData);
        addToast(privacyMode === 'local' ? 'Generated in Privacy-First Local Mode.' : 'Resume generated (offline mode).');
      }
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text) => {
    safeCopy(
      text,
      () => addToast('Copied to clipboard.'),
      () => addToast('Unable to copy text.', 'error')
    );
  };

  const handleCheckATS = async () => {
    if (!resumeData) {
      addToast('Generate resume first to check ATS score.', 'error');
      return;
    }
    setShowATS(true);

    if (!(backendStatus.running && backendStatus.groqConfigured)) {
      addToast('AI ATS API is offline. Showing local ATS estimate.', 'error');
      return;
    }

    setAtsChecking(true);
    setAtsSyncState('syncing');
    try {
      const liveAts = await scoreATSWithGroq(resumeData, formData.targetRole, formData.jobDescription);
      setAtsData(liveAts);
      setAtsSyncState('live');
      addToast('ATS score refreshed from AI API.');
    } catch (err) {
      setAtsSyncState('error');
      addToast(`ATS API failed: ${err.message}`, 'error');
    } finally {
      setAtsChecking(false);
    }
  };

  useEffect(() => {
    if (!resumeData || !layoutSettings.autoFit || !a4FrameRef.current || !resumeContentRef.current) {
      setFitScale(1);
      return;
    }

    const measure = () => {
      const frame = a4FrameRef.current;
      const content = resumeContentRef.current;
      if (!frame || !content) return;

      const frameHeight = frame.clientHeight;
      const contentHeight = content.scrollHeight;
      if (!frameHeight || !contentHeight) {
        setFitScale(1);
        return;
      }

      const scale = frameHeight / contentHeight;
      const clamped = Math.max(0.35, Math.min(1.08, Number(scale.toFixed(3))));
      setFitScale(clamped);

      if (layoutSettings.adaptiveOnePage) {
        if (scale < 0.97) {
          setLayoutSettings(prev => {
            if (prev.fontSize > 9) return { ...prev, fontSize: Number((prev.fontSize - 0.5).toFixed(1)) };
            if (prev.maxBullets > 3) return { ...prev, maxBullets: prev.maxBullets - 1 };
            if (!prev.compactMode) return { ...prev, compactMode: true };
            return prev;
          });
        } else if (scale > 1.18) {
          setLayoutSettings(prev => {
            if (prev.compactMode) return { ...prev, compactMode: false };
            if (prev.maxBullets < 6) return { ...prev, maxBullets: prev.maxBullets + 1 };
            if (prev.fontSize < 12.5) return { ...prev, fontSize: Number((prev.fontSize + 0.5).toFixed(1)) };
            return prev;
          });
        }
      }
    };

    const id = setTimeout(measure, 0);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', measure);
    };
  }, [
    resumeData,
    renderTemplateId,
    layoutSettings.autoFit,
    layoutSettings.fontFamily,
    layoutSettings.fontSize,
    layoutSettings.maxBullets,
    layoutSettings.compactMode,
    layoutSettings.adaptiveOnePage,
  ]);

  return (
    <div className="builder-page">
      <div className="builder-top-bar">
        <button className="btn btn-subtle" onClick={onBack}>
          <ArrowLeft size={16} /> Change Template
        </button>
        <div className="builder-template-badge">
          <Layout size={14} /> {tmpl?.name || 'Template'} <span className="badge-cat">{tmpl?.category}</span>
        </div>
        <div className="builder-status">
          {backendStatus.running && backendStatus.groqConfigured ? (
            <span className="status-on"><Server size={12} /> AI Connected</span>
          ) : (
            <span className="status-off"><ServerOff size={12} /> AI Offline</span>
          )}
          <button
            className={`btn btn-sm ${privacyMode === 'local' ? 'btn-black' : 'btn-outline'} privacy-toggle`}
            onClick={() => setPrivacyMode(prev => (prev === 'cloud' ? 'local' : 'cloud'))}
            title={privacyMode === 'local' ? "Local Mode: Generates offline using basic logic. No data leaves your browser." : "Cloud Mode: Connects to AI for advanced ATS scoring and content enhancement."}
          >
            <Shield size={12} /> {privacyMode === 'local' ? 'Local Mode' : 'Cloud Mode'}
          </button>
        </div>
      </div>

      <div className="builder-grid">
        {/* LEFT: FORM */}
        <div className="builder-form">
          <Section num="1" title="Personal Info" icon={<User size={15} />}>
            <div className="row-2">
              <div className="field"><label>Full Name *</label><input className="input" placeholder="Alex Rivera" value={formData.name} onChange={e => set('name', e.target.value)} /></div>
              <div className="field"><label>Email</label><input className="input" placeholder="alex.rivera@example.com" value={formData.email} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div className="row-2">
              <div className="field"><label>Phone</label><input className="input" placeholder="+1 (555) 123-4567" value={formData.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div className="field"><label>Location</label><input className="input" placeholder="San Francisco, CA" value={formData.location} onChange={e => set('location', e.target.value)} /></div>
            </div>
            <div className="row-2">
              <div className="field"><label>LinkedIn</label><input className="input" placeholder="linkedin.com/in/alexrivera" value={formData.linkedin} onChange={e => set('linkedin', e.target.value)} /></div>
              <div className="field"><label>GitHub</label><input className="input" placeholder="github.com/alexrivera" value={formData.github} onChange={e => set('github', e.target.value)} /></div>
            </div>
            <div className="field"><label>Portfolio / Website</label><input className="input" placeholder="alexrivera.dev" value={formData.portfolio} onChange={e => set('portfolio', e.target.value)} /></div>
          </Section>

          <Section num="2" title="Target Role & Summary" icon={<Target size={15} />}>
            <div className="field">
              <label>Target Job Title * <small>— AI optimizes for this</small></label>
              <input className="input" placeholder="e.g. Full Stack Developer" value={formData.targetRole} onChange={e => set('targetRole', e.target.value)} />
            </div>
            <div className="field">
              <label>Role Intelligence Pack</label>
              <select className="input" value={formData.rolePackId} onChange={e => set('rolePackId', e.target.value)}>
                {Object.values(ROLE_PACKS).map((pack) => (
                  <option key={pack.id} value={pack.id}>{pack.label} - {pack.description}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Job Description <small>— Optional, paste JD for better personalization</small></label>
              <AutoTextarea
                placeholder={"Paste the job description here...\nRequired skills, responsibilities, and keywords will be used for optimization."}
                value={formData.jobDescription}
                onChange={e => set('jobDescription', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Years of Experience</label>
              <input className="input" type="number" min="0" placeholder="e.g. 3" value={formData.yearsOfExperience} onChange={e => set('yearsOfExperience', e.target.value)} />
            </div>
            <div className="field">
              <label>Professional Summary <small>— AI generates if left empty</small></label>
              <AutoTextarea placeholder="Passionate software engineer..." value={formData.summary} onChange={e => set('summary', e.target.value)} />
            </div>
          </Section>

          <Section num="3" title="Skills" icon={<Code2 size={15} />}>
            <div className="field">
              <label>Technical Skills <small>— comma separated</small></label>
              <AutoTextarea placeholder="React, Node.js, Python, MongoDB, TypeScript..." value={formData.skills} onChange={e => set('skills', e.target.value)} />
            </div>
            <div className="field">
              <label>Tools & Frameworks</label>
              <AutoTextarea placeholder="Git, Docker, VS Code, AWS, Figma..." value={formData.tools} onChange={e => set('tools', e.target.value)} />
            </div>
          </Section>

          <Section num="4" title="Experience" icon={<Briefcase size={15} />}>
            {formData.experience.map((exp, i) => (
              <div key={i} className="entry-card">
                <div className="entry-card-head">
                  <span>Position {i + 1}</span>
                  {formData.experience.length > 1 && (
                    <button className="btn-icon-only" onClick={() => rmExp(i)}><Trash2 size={14} /></button>
                  )}
                </div>
                <div className="row-2">
                  <div className="field"><label>Job Title</label><input className="input" placeholder="Software Engineer" value={exp.title} onChange={e => setExp(i, 'title', e.target.value)} /></div>
                  <div className="field"><label>Company</label><input className="input" placeholder="Google" value={exp.company} onChange={e => setExp(i, 'company', e.target.value)} /></div>
                </div>
                <div className="row-2">
                  <div className="field"><label>Duration</label><input className="input" placeholder="Jan 2023 — Present" value={exp.duration} onChange={e => setExp(i, 'duration', e.target.value)} /></div>
                  <div className="field"><label>Location</label><input className="input" placeholder="Remote" value={exp.location} onChange={e => setExp(i, 'location', e.target.value)} /></div>
                </div>
                <div className="field">
                  <label>Key Achievements <small>— one per line, AI will enhance</small></label>
                  <AutoTextarea
                    placeholder={"Built responsive user dashboard\nOptimized API reducing latency by 40%\nLed team of 3 developers"}
                    value={exp.details}
                    onChange={e => setExp(i, 'details', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Proof Links / Evidence <small>— one per line (optional)</small></label>
                  <AutoTextarea
                    placeholder={"https://github.com/you/project/pull/12\nDashboard screenshot link\nKPI report URL"}
                    value={exp.evidence}
                    onChange={e => setExp(i, 'evidence', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button className="btn-add" onClick={addExp}><Plus size={14} /> Add Position</button>
          </Section>

          <Section num="5" title="Projects" icon={<Lightbulb size={15} />}>
            {formData.projects.map((proj, i) => (
              <div key={i} className="entry-card">
                <div className="entry-card-head">
                  <span>Project {i + 1}</span>
                  {formData.projects.length > 1 && (
                    <button className="btn-icon-only" onClick={() => rmProj(i)}><Trash2 size={14} /></button>
                  )}
                </div>
                <div className="row-2">
                  <div className="field"><label>Project Name</label><input className="input" placeholder="E-Commerce Platform" value={proj.name} onChange={e => setProj(i, 'name', e.target.value)} /></div>
                  <div className="field"><label>Tech Stack</label><input className="input" placeholder="React, Node.js, MongoDB" value={proj.techStack} onChange={e => setProj(i, 'techStack', e.target.value)} /></div>
                </div>
                <div className="field">
                  <label>Description</label>
                  <input className="input" placeholder="Brief description of the project" value={proj.description} onChange={e => setProj(i, 'description', e.target.value)} />
                </div>
                <div className="field">
                  <label>Details <small>— one per line</small></label>
                  <AutoTextarea
                    placeholder={"Built responsive catalog with 500+ products\nIntegrated Stripe payments\nDeployed on AWS with CI/CD"}
                    value={proj.details}
                    onChange={e => setProj(i, 'details', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Proof Links / Evidence <small>— one per line (optional)</small></label>
                  <AutoTextarea
                    placeholder={"https://github.com/you/repo\nLive demo URL\nCase-study URL"}
                    value={proj.evidence}
                    onChange={e => setProj(i, 'evidence', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button className="btn-add" onClick={addProj}><Plus size={14} /> Add Project</button>
          </Section>

          <Section num="6" title="Education" icon={<GraduationCap size={15} />}>
            <div className="field">
              <label>Education Details</label>
              <AutoTextarea
                placeholder={"B.Tech Computer Science — IIT Delhi (2020–2024)\nCGPA: 8.5/10"}
                value={formData.education}
                onChange={e => set('education', e.target.value)}
              />
            </div>
          </Section>

          <Section num="7" title="Layout Controls" icon={<Layout size={15} />} open={false}>
            <div className="field">
              <label>Font Family</label>
              <select className="input" value={layoutSettings.fontFamily} onChange={e => setLayout('fontFamily', e.target.value)}>
                <option value="template">Template Default</option>
                <option value="inter">Inter (Sans)</option>
                <option value="lato">Lato</option>
                <option value="times">Times New Roman</option>
                <option value="georgia">Georgia</option>
                <option value="mono">JetBrains Mono</option>
              </select>
            </div>
            <div className="field">
              <label>Font Size: {layoutSettings.fontSize}px</label>
              <input
                className="input"
                type="range"
                min="9"
                max="13"
                step="0.5"
                value={layoutSettings.fontSize}
                onChange={e => setLayout('fontSize', Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Max Bullet Points Per Entry: {layoutSettings.maxBullets}</label>
              <input
                className="input"
                type="range"
                min="2"
                max="6"
                step="1"
                value={layoutSettings.maxBullets}
                onChange={e => setLayout('maxBullets', Number(e.target.value))}
              />
            </div>
            <div className="row-2">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={layoutSettings.autoFit}
                  onChange={e => setLayout('autoFit', e.target.checked)}
                />
                Auto Fit to One Page
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={layoutSettings.compactMode}
                  onChange={e => setLayout('compactMode', e.target.checked)}
                />
                Compact Spacing
              </label>
            </div>
            <div className="row-2">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={layoutSettings.adaptiveOnePage}
                  onChange={e => setLayout('adaptiveOnePage', e.target.checked)}
                />
                Adaptive One-Page Optimizer
              </label>
              <span className="r-desc" style={{ marginTop: 4 }}>Auto-tunes bullets and font to fit one page.</span>
            </div>
          </Section>

          <button
            className="btn btn-black btn-xl btn-full generate-btn"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <><div className="spinner-small" /> Generating...</>
            ) : (
              <><Sparkles size={18} /> Generate Resume</>
            )}
          </button>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className="builder-preview">
          {resumeData ? (
            <>
              <div className="builder-core-strip">
                <div className="builder-core-card">
                  <span className="builder-core-label">Resume Workspace</span>
                  <strong>{tmpl?.name || 'Template'} Draft</strong>
                  <p>Live edits, one-page fit, and export controls stay here.</p>
                </div>
                <div className={`builder-core-card builder-core-ats builder-core-ats-${atsSyncState}`}>
                  <span className="builder-core-label">ATS Intelligence</span>
                  <strong>{typeof (atsData || resumeData?.ats)?.score === 'number' ? `${(atsData || resumeData?.ats).score}/100` : 'Ready'}</strong>
                  <p>
                    {atsSyncState === 'syncing' && 'Syncing score with your latest resume edits.'}
                    {atsSyncState === 'live' && 'ATS score is live and updates as your resume changes.'}
                    {atsSyncState === 'offline' && 'Showing local ATS estimate because cloud sync is unavailable.'}
                    {atsSyncState === 'error' && 'Live sync hit an issue. Use manual ATS check to refresh.'}
                    {atsSyncState === 'idle' && 'Score, keywords, and JD match stay visually separate from the draft.'}
                  </p>
                </div>
              </div>
              <div className="preview-actions-bar">
                <span className="preview-label">
                  Preview: {tmpl?.name}
                  <span className={`preview-sync-pill preview-sync-${atsSyncState}`}>{atsSyncState === 'syncing' ? 'ATS syncing' : atsSyncState === 'live' ? 'ATS live' : atsSyncState === 'offline' ? 'ATS offline' : atsSyncState === 'error' ? 'ATS retry needed' : 'ATS ready'}</span>
                </span>
                <div className="preview-btns">
                  <button className="btn btn-black btn-sm" onClick={handleCheckATS} disabled={atsChecking}>
                    <Award size={13} /> {atsChecking ? 'Checking ATS...' : 'Check ATS Score'}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowJDMatch(true)}>
                    <Search size={13} /> JD Match
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => downloadLatex(renderTemplateId, resumeData)}>
                    <FileCode2 size={13} /> .tex
                  </button>
                  <button className="btn btn-black btn-sm" onClick={() => exportToPDF('resume-render')}>
                    <Download size={13} /> Download PDF
                  </button>
                </div>
              </div>
              <div className="preview-paper">
                <div className="preview-paper-a4" ref={a4FrameRef}>
                  <div className="preview-fit-layer" style={{ transform: `scale(${layoutSettings.autoFit ? fitScale : 1})` }}>
                    <ResumePreview
                      data={resumeData}
                      templateId={renderTemplateId}
                      settings={layoutSettings}
                      resumeRef={resumeContentRef}
                    />
                  </div>
                </div>
              </div>

              {/* ATS Score Button — fixed bottom bar */}

              {/* ATS Modal */}
              {showATS && (
                <div className="ats-modal-overlay" onClick={() => setShowATS(false)}>
                  <div className="ats-modal" onClick={e => e.stopPropagation()}>
                    <div className="ats-modal-header">
                      <h2><Award size={20} /> ATS Compatibility Score</h2>
                      <button className="btn-icon-only" onClick={() => setShowATS(false)}>✕</button>
                    </div>
                    <ATSPanel ats={atsData || resumeData?.ats} />
                  </div>
                </div>
              )}

              {showJDMatch && (
                <div className="ats-modal-overlay" onClick={() => setShowJDMatch(false)}>
                  <div className="ats-modal" onClick={e => e.stopPropagation()}>
                    <div className="ats-modal-header">
                      <h2><Search size={20} /> JD Match Insights</h2>
                      <button className="btn-icon-only" onClick={() => setShowJDMatch(false)}>✕</button>
                    </div>
                    <JDMatchPanel data={jdMatchData} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="preview-empty-state">
              <div className="preview-empty-content">
                <FileText size={40} strokeWidth={1} />
                <h3>Your {tmpl?.name} Preview</h3>
                <p>Fill in your details on the left and click &quot;Generate Resume&quot; to see your {tmpl?.name} template come to life.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generating Overlay */}
      {generating && (
        <div className="overlay">
          <div className="overlay-card">
            <div className="spinner-large" />
            <h3>Building Your Resume...</h3>
            <p>AI is optimizing your content for ATS</p>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-stack">
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onDone={() => removeToast(t.id)} />)}
      </div>
    </div>
  );
}

/* ===================== MAIN APP ===================== */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <div style={{ padding: 40, color: 'red', background: 'white' }}><h1>Crash!</h1><pre>{this.state.error.stack}</pre></div>;
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState(() => {
    const savedProfile = readStorageObject(STORAGE_KEYS.userProfile, null);
    return savedProfile && savedProfile.name ? savedProfile : null;
  });
  const [view, setView] = useState(() => {
    const savedProfile = readStorageObject(STORAGE_KEYS.userProfile, null);
    return (savedProfile && savedProfile.name) ? 'gallery' : 'landing';
  });  // landing | workflow | login | gallery | profile | tracker | builder
  const [menuOpen, setMenuOpen] = useState(false);
  const [postLoginView, setPostLoginView] = useState('gallery');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ running: false, groqConfigured: false });
  const [resumeHistory, setResumeHistory] = useState(() => readStorageArray(STORAGE_KEYS.resumeHistory, []));
  const [builderDraft, setBuilderDraft] = useState(null);
  const [activeHistoryId, setActiveHistoryId] = useState(null);

  async function handleLogout() {
    setMenuOpen(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error:", e);
    }
    setUser(null);
    setView('landing');
  }


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadSupabaseResumes();
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadSupabaseResumes();
      } else {
        setUser(null);
        setResumeHistory([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadSupabaseResumes = async () => {
    const { data, error } = await fetchUserResumes();
    if (data && !error) {
      setResumeHistory(data);
    }
  };

  useEffect(() => { checkBackendHealth().then(setBackendStatus); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.resumeHistory, JSON.stringify(resumeHistory)); }, [resumeHistory]);

  const selectedTemplateConfig = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  useEffect(() => {
    const origin = window.location.origin;
    const faqSchema = {
      '@type': 'FAQPage',
      mainEntity: LANDING_FAQS.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };

    const baseSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'PEBELai',
          url: origin,
          description: 'PEBELai is a resume builder, ATS checker, and application tracking platform for job seekers.',
        },
      ],
    };

    let seoData = {
      title: 'PEBELai | AI Resume Builder, ATS Resume Checker, and Templates',
      description: 'Build ATS-friendly resumes, compare resumes to job descriptions, choose professional templates, and manage applications with PEBELai.',
      url: origin,
      robots: 'index,follow',
      ogType: 'website',
      schema: {
        ...baseSchema,
        '@graph': [
          ...baseSchema['@graph'],
          {
            '@type': 'WebSite',
            name: 'PEBELai',
            url: origin,
            description: 'AI resume builder with ATS scoring, LaTeX templates, and job application tracking.',
          },
          {
            '@type': 'SoftwareApplication',
            name: 'PEBELai',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: origin,
            description: 'Resume builder and ATS optimization platform with professional templates and application tracking.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          },
          faqSchema,
        ],
      },
    };

    if (view === 'workflow') {
      seoData = {
        title: 'PEBELai Workflow | Resume Builder and ATS Optimization Flow',
        description: 'Understand how PEBELai combines resume building, ATS optimization, and application tracking before you choose a template.',
        url: origin,
        robots: 'index,follow',
        ogType: 'website',
        schema: {
          ...baseSchema,
          '@graph': [
            ...baseSchema['@graph'],
            {
              '@type': 'WebPage',
              name: 'PEBELai Resume Workflow',
              url: origin,
              description: 'The guided workflow for using PEBELai resume builder, ATS scoring, and application tracker.',
            },
          ],
        },
      };
    } else if (view === 'gallery') {
      seoData = {
        title: 'PEBELai Templates | Professional ATS-Friendly Resume Templates',
        description: 'Browse professional LaTeX resume templates for software engineers, analysts, freshers, and experienced job seekers.',
        url: origin,
        robots: 'index,follow',
        ogType: 'website',
        schema: {
          ...baseSchema,
          '@graph': [
            ...baseSchema['@graph'],
            {
              '@type': 'CollectionPage',
              name: 'PEBELai Resume Templates',
              url: origin,
              description: 'A collection of professional ATS-friendly resume templates.',
            },
          ],
        },
      };
    } else if (view === 'builder') {
      seoData = {
        title: `PEBELai Builder | ${selectedTemplateConfig?.name || 'Resume'} Resume Builder`,
        description: `Create and optimize your ${selectedTemplateConfig?.name || 'professional'} resume with ATS scoring, job description matching, and export tools.`,
        url: origin,
        robots: 'noindex,nofollow',
        ogType: 'website',
        schema: {
          ...baseSchema,
          '@graph': [
            ...baseSchema['@graph'],
            {
              '@type': 'WebApplication',
              name: 'PEBELai Resume Builder',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              url: origin,
            },
          ],
        },
      };
    } else if (view === 'tracker') {
      seoData = {
        title: 'PEBELai Tracker | Application Tracker, Follow-Ups, and Interview Notes',
        description: 'Track job applications, interview rounds, deadlines, follow-up reminders, and weekly job search performance in PEBELai.',
        url: origin,
        robots: 'noindex,nofollow',
        ogType: 'website',
        schema: {
          ...baseSchema,
          '@graph': [
            ...baseSchema['@graph'],
            {
              '@type': 'WebPage',
              name: 'PEBELai Application Tracker',
              url: origin,
              description: 'Track applications, interviews, reminders, and deadlines.',
            },
          ],
        },
      };
    } else if (view === 'login' || view === 'profile') {
      seoData = {
        title: 'PEBELai | Resume Platform',
        description: 'PEBELai helps you build ATS-friendly resumes and organize your job search.',
        url: origin,
        robots: 'noindex,nofollow',
        ogType: 'website',
        schema: baseSchema,
      };
    }

    setSeoMeta(seoData);
  }, [view, selectedTemplateConfig]);

  const handleLogin = (u) => {
    const savedProfile = readStorageObject(STORAGE_KEYS.userProfile, {});
    const mergedUser = { ...u, ...savedProfile };
    setUser(mergedUser);
    setView(postLoginView);
  };

  const handleSelectTemplate = (id) => {
    const safeTemplate = TEMPLATES.some(t => t.id === id) ? id : (TEMPLATES[0]?.id || id);
    setSelectedTemplate(safeTemplate);
    setBuilderDraft(null);
    setActiveHistoryId(null);
    setView('builder');
  };

  const handleSaveHistory = (entry) => {
    const now = new Date().toISOString();
    const item = {
      id: `resume-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      ...entry,
    };
    setResumeHistory(prev => [item, ...prev].slice(0, 100));
  };

  const handleOpenHistory = (item) => {
    const safeTemplate = TEMPLATES.some(t => t.id === item.templateId)
      ? item.templateId
      : (TEMPLATES[0]?.id || item.templateId);
    setSelectedTemplate(safeTemplate);
    setBuilderDraft({
      formData: item.formData,
      layoutSettings: item.layoutSettings,
    });
    setActiveHistoryId(item.id);
    setView('builder');
  };

  const handleDeleteHistory = (id) => {
    setResumeHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateProfile = (profileData) => {
    const merged = { ...(user || {}), ...profileData };
    setUser(merged);
    localStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(merged));
  };

  const handleChangePassword = (currentPassword, newPassword) => {
    const creds = readStorageObject(STORAGE_KEYS.credentials, {});
    if (creds.password && creds.password !== currentPassword) {
      return { ok: false, message: 'Current password is incorrect.' };
    }
    const nextCreds = { password: newPassword, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.credentials, JSON.stringify(nextCreds));
    return { ok: true, message: 'Password changed successfully.' };
  };

  const handleLogoClick = () => {
    setView('landing');
  };

  const handleRequireAuth = (targetView) => {
    if (user) {
      setView(targetView);
      return;
    }
    setPostLoginView(targetView);
    setView('login');
  };

  const handleSignIn = () => {
    setPostLoginView('landing');
    setView('login');
  };

  return (
    <div className="app">
      <Navbar
        user={user}
        onUserProfile={() => setView('profile')}
        onOpenTracker={() => handleRequireAuth('tracker')}
        onLogout={handleLogout}
        onLogoClick={handleLogoClick}
        onSignIn={handleSignIn}
        view={view}
        hasResume={view === 'builder'}
        selectedTemplate={selectedTemplate}
        resumeData={null}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />


      {user && menuOpen && (
        <div className="nav-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="nav-menu" onClick={e => e.stopPropagation()}>
            <div className="nav-menu-header">
              <div className="user-avatar-large">{(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.name || user?.email || "U").charAt(0).toUpperCase()}</div>
              <div className="nav-menu-user-info">
                <strong>{(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.name || user?.email || "User")}</strong>
                <span>{user?.email}</span>
              </div>
            </div>
            <div className="nav-menu-links">
              <button onClick={() => { setMenuOpen(false); setView('profile'); }}>
                <User size={18} /> My Profile
              </button>
              <button onClick={() => { setMenuOpen(false); setView('tracker'); }}>
                <ClipboardList size={18} /> Application Tracker
              </button>
              <button className="menu-logout-btn" onClick={handleLogout}>
                <LogIn size={18} style={{ transform: 'rotate(180deg)' }} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        {view === 'landing' && (
          <LandingPage
            onOpenResumeFlow={() => handleRequireAuth('gallery')}
            onOpenTrackerPreview={() => handleRequireAuth('tracker')}
          />
        )}
        {view === 'workflow' && (
          <ResumeWorkflowPage
            onContinueToTemplates={() => setView('gallery')}
            onOpenTracker={() => setView('tracker')}
          />
        )}
        {view === 'login' && <LoginPage onLogin={handleLogin} />}
        {view === 'gallery' && (
          <TemplateGallery
            templates={TEMPLATES}
            onSelect={handleSelectTemplate}
          />
        )}
        {view === 'profile' && (
          <UserProfilePage
            user={user}
            history={resumeHistory}
            onBackToTemplates={() => setView('gallery')}
            onOpenTracker={() => setView('tracker')}
            onOpenResume={handleOpenHistory}
            onDeleteResume={handleDeleteHistory}
            onUpdateProfile={handleUpdateProfile}
            onChangePassword={handleChangePassword}
            onClearHistory={() => setResumeHistory([])}
            onLogout={handleLogout}
          />
        )}
        {view === 'tracker' && (
          <ApplicationTrackerPage
            onBackToTemplates={() => setView('workflow')}
            onCreateResume={() => setView('workflow')}
          />
        )}
        {view === 'builder' && (
          <BuilderPage
            key={`${selectedTemplateConfig?.id || 'template'}-${activeHistoryId || 'new'}`}
            selectedTemplateConfig={selectedTemplateConfig}
            onBack={() => setView('gallery')}
            backendStatus={backendStatus}
            initialDraft={builderDraft}
            onSaveHistory={handleSaveHistory}
          />
        )}
      </main>
      <SiteFooter />
      <MobileBottomNav 
        user={user} 
        view={view} 
        onViewChange={setView} 
        onOpenTracker={() => setView('tracker')}
      />
    </div>
  );
}

export default function AppWrapper() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}

