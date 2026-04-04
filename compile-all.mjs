import fs from 'fs';
import path from 'path';
import { TEMPLATES, generateLatex } from './src/latexTemplates2.js';

const outputDir = path.join(process.cwd(), 'public', 'templates');

const PROFILE_META = {
  harshibar: { name: 'Ava Patel', role: 'Product Engineer', city: 'San Francisco, CA' },
  jitin: { name: 'Noah Kim', role: 'Software Developer', city: 'Austin, TX' },
  anubhav: { name: 'Liam Chen', role: 'Full Stack Engineer', city: 'Seattle, WA' },
  rezume: { name: 'Mia Johnson', role: 'Frontend Engineer', city: 'New York, NY' },
  timesserif: { name: 'Ethan Walker', role: 'Backend Engineer', city: 'Chicago, IL' },
  audric: { name: 'Olivia Singh', role: 'Software Engineer', city: 'Boston, MA' },
  jankuster: { name: 'Lucas Martin', role: 'Technical Consultant', city: 'Denver, CO' },
  moderncv: { name: 'Sophia Reed', role: 'Platform Engineer', city: 'Toronto, ON' },
  jakeryan: { name: 'James Rivera', role: 'Software Engineer', city: 'Los Angeles, CA' },
  professional: { name: 'Emma Brooks', role: 'Senior Software Engineer', city: 'Remote' },
};

function buildSampleData(templateId) {
  const meta = PROFILE_META[templateId] || PROFILE_META.jakeryan;
  const handle = meta.name.toLowerCase().replace(/\s+/g, '');

  return {
    name: meta.name,
    email: `${handle}@example.com`,
    phone: '+1 (555) 123-4567',
    location: meta.city,
    linkedin: `linkedin.com/in/${handle}`,
    github: handle,
    portfolio: `${handle}.dev`,
    summary: `${meta.role} with 6+ years of experience building reliable, user-focused products across web platforms. Strong track record in architecture, performance optimization, and cross-functional collaboration with measurable business impact.`,
    skills: {
      technical: [
        'JavaScript',
        'TypeScript',
        'React',
        'Node.js',
        'Python',
        'SQL',
        'System Design',
        'REST APIs',
      ],
      tools: ['Git', 'Docker', 'Kubernetes', 'AWS', 'Postman', 'Jira', 'CI/CD'],
      soft: ['Leadership', 'Communication', 'Problem-Solving', 'Mentoring'],
    },
    experience: [
      {
        title: meta.role,
        company: 'Northstar Technologies',
        duration: 'Jan 2022 - Present',
        location: meta.city,
        bullets: [
          'Led architecture and delivery of a multi-tenant SaaS platform used by 150K+ monthly active users.',
          'Reduced page load time by 42% through rendering optimization, bundle splitting, and caching strategies.',
          'Built internal observability dashboards that cut incident triage time from 45 minutes to under 15 minutes.',
          'Mentored 5 engineers, improved code quality standards, and reduced production defects by 33%.',
        ],
      },
      {
        title: 'Software Engineer',
        company: 'Bluewave Systems',
        duration: 'Jul 2019 - Dec 2021',
        location: 'San Jose, CA',
        bullets: [
          'Developed and maintained APIs and frontend workflows powering core customer onboarding journeys.',
          'Implemented automated CI/CD pipelines that shortened release cycles from biweekly to daily.',
          'Collaborated with product, design, and data teams to launch 25+ customer-facing features.',
          'Improved API reliability to 99.95% uptime by hardening retry logic and error monitoring.',
        ],
      },
      {
        title: 'Software Engineer Intern',
        company: 'Orbit Labs',
        duration: 'May 2018 - Jun 2019',
        location: 'Remote',
        bullets: [
          'Built internal tooling for QA workflows that reduced manual test preparation effort by 50%.',
          'Implemented analytics tracking for key product funnels and published weekly stakeholder reports.',
          'Documented reusable engineering playbooks adopted by three cross-functional teams.',
        ],
      },
    ],
    projects: [
      {
        name: 'Resume Intelligence Platform',
        techStack: 'React, Node.js, OpenAI API, PostgreSQL',
        description: 'AI-powered resume optimization and ATS feedback platform.',
        bullets: [
          'Designed and shipped end-to-end resume optimization workflows with live ATS scoring.',
          'Built template rendering and export pipeline supporting LaTeX, PDF, and print-ready formats.',
          'Implemented role-based recommendation engine that improved completion rate by 29%.',
        ],
      },
      {
        name: 'Operations Analytics Hub',
        techStack: 'Next.js, Python, FastAPI, BigQuery',
        description: 'Operational analytics dashboard for product and engineering metrics.',
        bullets: [
          'Created interactive KPI dashboards with drill-down filtering for product and leadership teams.',
          'Reduced query latency by 37% using pre-aggregation and scheduled data materialization.',
          'Automated monthly reporting workflows, saving 12+ analyst hours per sprint.',
        ],
      },
      {
        name: 'Incident Automation Bot',
        techStack: 'Node.js, Slack API, Redis',
        description: 'Incident response assistant for engineering operations.',
        bullets: [
          'Built automation bot to orchestrate incident workflows and stakeholder communications.',
          'Integrated runbook recommendations that reduced mean time to recovery by 24%.',
        ],
      },
    ],
    education: [
      {
        degree: 'M.S. in Computer Science',
        school: 'University of California',
        location: 'Berkeley, CA',
        dates: '2017 - 2019',
        details: 'Focus: Distributed Systems, Applied Machine Learning, Cloud Architecture',
      },
      {
        degree: 'B.S. in Computer Science',
        school: 'State University',
        location: 'California, USA',
        dates: '2013 - 2017',
        details: 'Coursework: Algorithms, Databases, Operating Systems, Computer Networks',
      },
    ],
    certifications: ['AWS Certified Developer - Associate', 'Professional Scrum Master I'],
  };
}

async function compileTemplate(templateId) {
  const latex = generateLatex(templateId, buildSampleData(templateId));
  const form = new FormData();
  form.append('filename[]', 'document.tex');
  form.append('filecontents[]', latex);
  form.append('engine', 'pdflatex');
  form.append('return', 'pdf');

  const response = await fetch('https://texlive.net/cgi-bin/latexcgi', {
    method: 'POST',
    body: form,
    redirect: 'follow',
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  const outPath = path.join(outputDir, `${templateId}.pdf`);

  if (!response.ok || bytes.slice(0, 5).toString() !== '%PDF-') {
    const errMsg = bytes.toString('utf8').slice(0, 400);
    throw new Error(`Compile failed (${response.status}): ${errMsg}`);
  }

  fs.writeFileSync(outPath, bytes);
  console.log(`  OK ${templateId}.pdf (${Math.round(bytes.length / 1024)} KB)`);
}

async function main() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log('Compiling LaTeX templates one by one...');
  for (const template of TEMPLATES) {
    process.stdout.write(`- ${template.id} ... `);
    try {
      await compileTemplate(template.id);
    } catch (err) {
      console.error(`\n  FAIL ${template.id}: ${err.message}`);
    }
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
