/**
 * ResumeAI Engine — Intelligent resume generation and ATS scoring
 * Runs entirely client-side with smart heuristics
 */

const ACTION_VERBS = [
  'Developed', 'Built', 'Designed', 'Implemented', 'Created',
  'Architected', 'Engineered', 'Optimized', 'Automated', 'Led',
  'Managed', 'Delivered', 'Launched', 'Scaled', 'Reduced',
  'Improved', 'Analyzed', 'Integrated', 'Configured', 'Deployed',
  'Spearheaded', 'Streamlined', 'Collaborated', 'Mentored', 'Established',
];

const ROLE_KEYWORDS = {
  'frontend developer': {
    technical: ['JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'HTML5', 'CSS3', 'SASS', 'REST APIs', 'GraphQL', 'Responsive Design', 'Web Performance'],
    tools: ['VS Code', 'Git', 'Webpack', 'Vite', 'Chrome DevTools', 'Figma', 'npm', 'Jest', 'Cypress'],
    soft: ['Problem-Solving', 'Attention to Detail', 'Collaboration', 'Communication', 'Time Management'],
    keywords: ['frontend', 'react', 'javascript', 'typescript', 'css', 'html', 'responsive', 'ui', 'component', 'web application', 'single page application', 'user interface'],
  },
  'backend developer': {
    technical: ['Node.js', 'Python', 'Java', 'REST APIs', 'GraphQL', 'SQL', 'NoSQL', 'Microservices', 'Authentication', 'API Design', 'System Design'],
    tools: ['Git', 'Docker', 'AWS', 'PostgreSQL', 'MongoDB', 'Redis', 'Postman', 'Linux', 'CI/CD'],
    soft: ['Analytical Thinking', 'Problem-Solving', 'Communication', 'Team Collaboration', 'Ownership'],
    keywords: ['backend', 'api', 'database', 'server', 'microservice', 'scalable', 'performance', 'security', 'node', 'python'],
  },
  'full stack developer': {
    technical: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'REST APIs', 'GraphQL', 'SQL', 'NoSQL', 'HTML5', 'CSS3', 'System Design'],
    tools: ['Git', 'Docker', 'AWS', 'PostgreSQL', 'MongoDB', 'VS Code', 'Postman', 'CI/CD', 'Webpack'],
    soft: ['Problem-Solving', 'Adaptability', 'Communication', 'Team Collaboration', 'Self-Motivated'],
    keywords: ['fullstack', 'full stack', 'frontend', 'backend', 'react', 'node', 'api', 'database', 'deployment', 'end-to-end'],
  },
  'data scientist': {
    technical: ['Python', 'R', 'Machine Learning', 'Deep Learning', 'NLP', 'Statistical Analysis', 'Data Visualization', 'Feature Engineering', 'A/B Testing'],
    tools: ['TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Jupyter', 'Tableau', 'SQL', 'Spark'],
    soft: ['Analytical Thinking', 'Critical Thinking', 'Communication', 'Curiosity', 'Storytelling'],
    keywords: ['data science', 'machine learning', 'model', 'prediction', 'analysis', 'statistical', 'python', 'deep learning', 'dataset'],
  },
  'ui/ux designer': {
    technical: ['UI Design', 'UX Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Interaction Design', 'User Testing', 'Information Architecture'],
    tools: ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Framer', 'Miro', 'Zeplin', 'Photoshop', 'Illustrator'],
    soft: ['Empathy', 'Creativity', 'Attention to Detail', 'Collaboration', 'Presentation Skills'],
    keywords: ['design', 'user experience', 'user interface', 'wireframe', 'prototype', 'usability', 'figma', 'design system', 'accessibility'],
  },
  'devops engineer': {
    technical: ['CI/CD', 'Infrastructure as Code', 'Containerization', 'Orchestration', 'Monitoring', 'Cloud Architecture', 'Networking', 'Security'],
    tools: ['Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'AWS', 'Azure', 'GCP', 'Ansible', 'Prometheus', 'Grafana'],
    soft: ['Problem-Solving', 'Automation Mindset', 'Communication', 'Collaboration', 'Incident Management'],
    keywords: ['devops', 'ci/cd', 'docker', 'kubernetes', 'cloud', 'infrastructure', 'deployment', 'automation', 'monitoring', 'pipeline'],
  },
  'product manager': {
    technical: ['Product Strategy', 'Roadmap Planning', 'User Research', 'A/B Testing', 'Data Analysis', 'Agile/Scrum', 'Market Analysis', 'PRD Writing'],
    tools: ['Jira', 'Confluence', 'Figma', 'Mixpanel', 'Google Analytics', 'Notion', 'Miro', 'SQL', 'Amplitude'],
    soft: ['Leadership', 'Strategic Thinking', 'Communication', 'Stakeholder Management', 'Prioritization'],
    keywords: ['product', 'roadmap', 'strategy', 'user research', 'metrics', 'stakeholder', 'agile', 'feature', 'mvp', 'kpi'],
  },
  default: {
    technical: ['Project Management', 'Data Analysis', 'Technical Documentation', 'Process Optimization'],
    tools: ['Microsoft Office', 'Google Workspace', 'Slack', 'Git', 'Jira'],
    soft: ['Communication', 'Problem-Solving', 'Team Collaboration', 'Adaptability', 'Time Management'],
    keywords: ['professional', 'experience', 'project', 'team', 'results', 'management', 'analysis'],
  },
};

const ROLE_PACKS = {
  auto: {
    id: 'auto',
    label: 'Auto',
    description: 'Automatically adapts tone and keywords from your target role.',
    keywords: [],
    summarySuffix: '',
    emphasis: [],
  },
  india_tech: {
    id: 'india_tech',
    label: 'India Tech Hiring',
    description: 'Optimized for India tech market and product teams.',
    keywords: ['ownership', 'stakeholder management', 'scalability', 'production systems', 'cross-functional'],
    summarySuffix: 'Comfortable working in fast-paced product teams with strong execution ownership.',
    emphasis: ['System Design', 'SQL', 'Data Structures', 'APIs'],
  },
  us_enterprise: {
    id: 'us_enterprise',
    label: 'US Enterprise',
    description: 'Optimized for enterprise and ATS-heavy screening in US market.',
    keywords: ['compliance', 'SLA', 'stakeholders', 'go-to-market', 'business impact'],
    summarySuffix: 'Experienced in stakeholder communication, documentation, and enterprise delivery standards.',
    emphasis: ['Documentation', 'Security', 'Scalability', 'Monitoring'],
  },
  europe_product: {
    id: 'europe_product',
    label: 'EU Product Teams',
    description: 'Optimized for collaborative product engineering teams in Europe.',
    keywords: ['collaboration', 'accessibility', 'quality', 'agile delivery', 'user-centric'],
    summarySuffix: 'Strong focus on quality, accessibility, and collaborative product delivery.',
    emphasis: ['Accessibility', 'Testing', 'Agile/Scrum', 'User Research'],
  },
  startup_fast: {
    id: 'startup_fast',
    label: 'Startup Fast Growth',
    description: 'Optimized for startup hiring with speed, ownership, and shipping focus.',
    keywords: ['rapid iteration', 'MVP', '0-1', 'growth', 'experimentation'],
    summarySuffix: 'Known for rapid execution, iteration, and shipping high-impact features under tight timelines.',
    emphasis: ['Experimentation', 'Analytics', 'Full-stack Ownership', 'CI/CD'],
  },
};

function getRoleData(targetRole) {
  const roleLower = (targetRole || '').toLowerCase();
  for (const [key, val] of Object.entries(ROLE_KEYWORDS)) {
    if (key !== 'default' && roleLower.includes(key.split(' ')[0])) {
      return val;
    }
  }
  return ROLE_KEYWORDS.default;
}

function resolveRolePack(rolePackId, targetRole, location) {
  if (rolePackId && ROLE_PACKS[rolePackId]) return ROLE_PACKS[rolePackId];

  const role = String(targetRole || '').toLowerCase();
  const loc = String(location || '').toLowerCase();
  if (loc.includes('india') || loc.includes('delhi') || loc.includes('mumbai') || loc.includes('bangalore')) {
    return ROLE_PACKS.india_tech;
  }
  if (loc.includes('usa') || loc.includes('united states') || loc.includes('new york') || loc.includes('san francisco')) {
    return ROLE_PACKS.us_enterprise;
  }
  if (loc.includes('germany') || loc.includes('france') || loc.includes('europe')) {
    return ROLE_PACKS.europe_product;
  }
  if (role.includes('startup') || role.includes('founder') || role.includes('generalist')) {
    return ROLE_PACKS.startup_fast;
  }
  return ROLE_PACKS.auto;
}

function smartCapitalize(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function uniqueLimit(items, limit = 12) {
  return [...new Set(items.filter(Boolean))].slice(0, limit);
}

function applyRolePackToSummary(summary, rolePack) {
  if (!rolePack || !rolePack.summarySuffix) return summary;
  if (summary.toLowerCase().includes(rolePack.summarySuffix.toLowerCase())) return summary;
  return `${summary} ${rolePack.summarySuffix}`.trim();
}

function applyRolePackToSkills(skills, rolePack) {
  if (!rolePack || rolePack.id === 'auto') return skills;
  return {
    ...skills,
    technical: uniqueLimit([...(skills.technical || []), ...(rolePack.emphasis || [])], 12),
  };
}

function generateSummary(userData, targetRole) {
  const userSummary = (userData.summary || '').trim();
  if (userSummary.length > 40) return userSummary;

  const years = userData.yearsOfExperience || '';
  const roleData = getRoleData(targetRole);
  const topSkills = (userData.skills || '').split(',').slice(0, 3).map(s => s.trim()).filter(Boolean);

  const templates = [
    `Results-driven ${targetRole || 'professional'} with ${years ? years + '+ years of' : 'hands-on'} experience in building scalable, high-performance solutions. Proficient in ${topSkills.length ? topSkills.join(', ') : roleData.technical.slice(0, 3).join(', ')} with a proven track record of delivering impactful projects on time. Passionate about clean architecture, continuous learning, and driving measurable outcomes.`,
    `${years ? 'Experienced' : 'Motivated'} ${targetRole || 'technologist'} specializing in ${topSkills.length ? topSkills.join(', ') : roleData.technical.slice(0, 3).join(', ')}. ${years ? `With ${years}+ years in the field, ` : ''}committed to building robust, user-centric solutions that solve real-world problems. Strong collaborator with excellent communication skills and a growth mindset.`,
    `Detail-oriented ${targetRole || 'professional'} with ${years ? years + '+ years of' : 'dedicated'} experience delivering high-quality solutions. Skilled in ${topSkills.length ? topSkills.join(', ') : roleData.technical.slice(0, 3).join(', ')} with a focus on performance, scalability, and best practices. Adept at working in cross-functional teams and thriving in fast-paced environments.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function expandSummaryToTarget(summary, targetRole) {
  const words = (summary || '').trim().split(/\s+/).filter(Boolean).length;
  if (words >= 65) return summary;
  const roleData = getRoleData(targetRole);
  const append =
    ` Proven ability to collaborate cross-functionally, improve delivery speed, and translate business needs into technical outcomes. ` +
    `Experienced with ${roleData.technical.slice(0, 4).join(', ')} and focused on measurable impact.`;
  return `${summary} ${append}`.trim();
}

function normalizeEducation(educationInput) {
  if (Array.isArray(educationInput)) {
    return educationInput
      .map((e) => {
        if (!e) return null;
        if (typeof e === 'string') return { degree: e.trim() };
        return {
          degree: (e.degree || '').trim(),
          school: (e.school || '').trim(),
          location: (e.location || '').trim(),
          dates: (e.dates || '').trim(),
          details: (e.details || '').trim(),
        };
      })
      .filter((e) => e && (e.degree || e.school || e.details));
  }

  const raw = String(educationInput || '').trim();
  if (!raw) return [];

  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ degree: line }));
}

function enhanceSkills(userData, targetRole) {
  const roleData = getRoleData(targetRole);
  const userSkillsRaw = (userData.skills || '').split(',').map(s => s.trim()).filter(Boolean);

  const technical = [...new Set([...userSkillsRaw.filter(s => {
    const lower = s.toLowerCase();
    return !['communication', 'teamwork', 'leadership', 'problem', 'time management', 'adaptability', 'collaboration'].some(k => lower.includes(k));
  }), ...roleData.technical.slice(0, Math.max(0, 8 - userSkillsRaw.length))])].slice(0, 10);

  const tools = [...new Set([...(userData.tools || '').split(',').map(s => s.trim()).filter(Boolean), ...roleData.tools.slice(0, 5)])].slice(0, 8);

  const soft = [...new Set([...userSkillsRaw.filter(s => {
    const lower = s.toLowerCase();
    return ['communication', 'teamwork', 'leadership', 'problem', 'time management', 'adaptability', 'collaboration'].some(k => lower.includes(k));
  }), ...roleData.soft.slice(0, 4)])].slice(0, 5);

  return { technical, tools, soft };
}

function enhanceBullets(rawBullets, targetRole) {
  if (!rawBullets || rawBullets.length === 0) return [];
  return rawBullets.map((bullet, i) => {
    let text = bullet.trim();
    if (!text) return null;
    // Ensure starts with action verb
    const startsWithVerb = ACTION_VERBS.some(v => text.startsWith(v));
    if (!startsWithVerb) {
      const verb = ACTION_VERBS[i % ACTION_VERBS.length];
      // Try to integrate naturally
      if (text[0] === text[0].toLowerCase()) {
        text = `${verb} ${text}`;
      } else {
        text = `${verb} ${text[0].toLowerCase()}${text.slice(1)}`;
      }
    }
    // Ensure ends with period
    if (!text.endsWith('.') && !text.endsWith('!')) {
      text += '.';
    }
    return text;
  }).filter(Boolean);
}

function fallbackBullet(targetRole, i, kind) {
  const roleData = getRoleData(targetRole);
  const tech = roleData.technical[i % Math.max(1, roleData.technical.length)] || 'modern tooling';
  const metrics = ['18%', '24%', '31%', '40%', '55%'];
  const metric = metrics[i % metrics.length];

  if (kind === 'project') {
    const lines = [
      `Built ${tech}-based modules that improved feature adoption by ${metric}.`,
      `Implemented monitoring and instrumentation to improve reliability and visibility by ${metric}.`,
      `Optimized performance bottlenecks and reduced load times by ${metric}.`,
      `Collaborated with stakeholders to prioritize roadmap items and ship high-impact iterations.`,
    ];
    return lines[i % lines.length];
  }

  const lines = [
    `Led delivery of ${tech}-driven initiatives and improved operational efficiency by ${metric}.`,
    `Designed scalable workflows and reduced turnaround time for key processes by ${metric}.`,
    `Partnered with cross-functional teams to implement improvements with measurable business impact.`,
    `Streamlined reporting and decision-making by automating repeatable tasks and quality checks.`,
  ];
  return lines[i % lines.length];
}

function buildFallbackExperience(targetRole, index, location) {
  const role = targetRole || 'Software Professional';
  const label = index === 0 ? 'Internship' : 'Freelance';
  return {
    title: smartCapitalize(role),
    company: label,
    duration: index === 0 ? 'Recent' : 'Earlier',
    location: location || 'Remote',
    bullets: [
      fallbackBullet(targetRole, index, 'experience'),
      fallbackBullet(targetRole, index + 1, 'experience'),
      fallbackBullet(targetRole, index + 2, 'experience'),
      fallbackBullet(targetRole, index + 3, 'experience'),
      fallbackBullet(targetRole, index + 4, 'experience'),
    ],
  };
}

function buildFallbackProject(targetRole, index) {
  const roleData = getRoleData(targetRole);
  return {
    name: `${smartCapitalize(targetRole || 'Role')} Project ${index + 1}`,
    description: 'Role-aligned implementation focused on measurable business impact.',
    techStack: roleData.technical.slice(0, 3).join(', '),
    bullets: [
      fallbackBullet(targetRole, index, 'project'),
      fallbackBullet(targetRole, index + 1, 'project'),
      fallbackBullet(targetRole, index + 2, 'project'),
      fallbackBullet(targetRole, index + 3, 'project'),
    ],
  };
}

function totalBulletCount(next) {
  return [
    ...(next.experience || []).flatMap((e) => e.bullets || []),
    ...(next.projects || []).flatMap((p) => p.bullets || []),
  ].length;
}

function estimateWordCount(next) {
  const summaryWords = (next.summary || '').split(/\s+/).filter(Boolean).length;
  const bulletWords = [
    ...(next.experience || []).flatMap((e) => e.bullets || []),
    ...(next.projects || []).flatMap((p) => p.bullets || []),
  ].join(' ').split(/\s+/).filter(Boolean).length;
  const skillsWords = [
    ...(next.skills?.technical || []),
    ...(next.skills?.tools || []),
    ...(next.skills?.soft || []),
  ].join(' ').split(/\s+/).filter(Boolean).length;
  const eduWords = (next.education || [])
    .map((e) => [e.degree, e.school, e.details].filter(Boolean).join(' '))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return summaryWords + bulletWords + skillsWords + eduWords;
}

function truncateBullets(items, cap) {
  return (items || []).map((item) => ({
    ...item,
    bullets: (item.bullets || []).slice(0, cap),
  }));
}

function profileDensity(next) {
  const words = estimateWordCount(next);
  const bullets = totalBulletCount(next);
  const expCount = (next.experience || []).filter((e) => e && (e.title || e.company || (e.bullets || []).length)).length;
  const projCount = (next.projects || []).filter((p) => p && (p.name || (p.bullets || []).length)).length;
  return { words, bullets, expCount, projCount };
}

function getDensityLevel(next) {
  const d = profileDensity(next);
  if (d.words >= 420 || (d.bullets >= 14 && d.expCount >= 2 && d.projCount >= 2)) return 'none';
  if (d.words >= 280 || d.bullets >= 10) return 'light';
  return 'aggressive';
}

function ensureMinBullets(items, minBullets, targetRole, kind) {
  return (items || []).map((item, idx) => {
    const current = [...(item.bullets || [])];
    let i = 0;
    while (current.length < minBullets && i < 10) {
      current.push(fallbackBullet(targetRole, idx + i, kind));
      i += 1;
    }
    return { ...item, bullets: current };
  });
}

function ensureDensity(resumeData, targetRole, mode = 'auto') {
  let next = { ...resumeData };
  const level = mode === 'auto' ? getDensityLevel(next) : mode;

  if (level === 'none') {
    if (!Array.isArray(next.education) || next.education.length === 0) {
      next.education = [{
        degree: 'Bachelor of Technology',
        school: 'State University',
        location: next.location || 'Remote',
        dates: '2018 - 2022',
        details: '',
      }];
    }
    return next;
  }

  next.summary = expandSummaryToTarget(next.summary, targetRole);

  next.experience = (next.experience || [])
    .filter((e) => e && (e.title || e.company || (e.bullets || []).length))
    .map((e, idx) => ({
      ...e,
      title: e.title || smartCapitalize(targetRole || 'Professional'),
      company: e.company || (idx === 0 ? 'Internship' : 'Freelance'),
      location: e.location || next.location || 'Remote',
    }));

  next.projects = (next.projects || [])
    .filter((p) => p && (p.name || p.description || (p.bullets || []).length))
    .map((p, idx) => ({
      ...p,
      name: p.name || `Project ${idx + 1}`,
      techStack: p.techStack || getRoleData(targetRole).technical.slice(0, 3).join(', '),
    }));

  const targetExp = level === 'aggressive' ? 2 : 1;
  if ((next.experience || []).length < targetExp) {
    const missing = targetExp - (next.experience || []).length;
    for (let i = 0; i < missing; i += 1) {
      next.experience.push(buildFallbackExperience(targetRole, i + (next.experience.length || 0), next.location));
    }
  }

  const targetProj = level === 'aggressive' ? 2 : 1;
  if ((next.projects || []).length < targetProj) {
    const missing = targetProj - (next.projects || []).length;
    for (let i = 0; i < missing; i += 1) {
      next.projects.push(buildFallbackProject(targetRole, i + (next.projects.length || 0)));
    }
  }

  const minExpBullets = level === 'aggressive' ? 5 : 3;
  const minProjBullets = level === 'aggressive' ? 4 : 3;
  next.experience = ensureMinBullets(next.experience, minExpBullets, targetRole, 'experience');
  next.projects = ensureMinBullets(next.projects, minProjBullets, targetRole, 'project');

  if (!Array.isArray(next.education) || next.education.length === 0) {
    next.education = [{
      degree: 'Bachelor of Technology',
      school: 'State University',
      location: next.location || 'Remote',
      dates: '2018 - 2022',
      details: '',
    }];
  }

  let words = estimateWordCount(next);
  let bullets = totalBulletCount(next);

  if (level === 'aggressive' && (words < 340 || bullets < 16)) {
    next.experience = ensureMinBullets(next.experience, 6, targetRole, 'experience');
    next.projects = ensureMinBullets(next.projects, 5, targetRole, 'project');
    words = estimateWordCount(next);
  }

  if (level === 'aggressive' && words < 360 && next.projects.length < 3) {
    next.projects.push(buildFallbackProject(targetRole, next.projects.length));
    next.projects = ensureMinBullets(next.projects, 5, targetRole, 'project');
  }

  words = estimateWordCount(next);
  if (words > 760) {
    next.experience = truncateBullets(next.experience, 4);
    next.projects = truncateBullets(next.projects, 3);
  }

  return next;
}

function calculateATSScore(resumeData, targetRole, rolePackId = 'auto') {
  const roleData = getRoleData(targetRole);
  const rolePack = resolveRolePack(rolePackId, targetRole, resumeData?.location);
  const resumeText = JSON.stringify(resumeData).toLowerCase();

  // Keyword match (0-30)
  const roleKeywords = uniqueLimit([...(roleData.keywords || []), ...(rolePack.keywords || [])], 18);
  const matchedKeywords = roleKeywords.filter(kw => resumeText.includes(kw.toLowerCase()));
  const keywordScore = Math.round((matchedKeywords.length / Math.max(roleKeywords.length, 1)) * 30);
  const missingKeywords = roleKeywords.filter(kw => !resumeText.includes(kw.toLowerCase()));

  // Skills relevance (0-20)
  const allRoleSkills = [...roleData.technical, ...roleData.tools].map(s => s.toLowerCase());
  const matchedSkills = allRoleSkills.filter(s => resumeText.includes(s.toLowerCase()));
  const skillsScore = Math.round((matchedSkills.length / Math.max(allRoleSkills.length, 1)) * 20);

  // Impact & Action verbs (0-20)
  const allBullets = [
    ...(resumeData.projects || []).flatMap(p => p.bullets || []),
    ...(resumeData.experience || []).flatMap(e => e.bullets || []),
  ];
  const verbCount = allBullets.filter(b =>
    ACTION_VERBS.some(v => b.startsWith(v))
  ).length;
  const impactScore = Math.min(20, Math.round((verbCount / Math.max(allBullets.length, 1)) * 20));

  // Structure (0-20)
  let structureScore = 0;
  if (resumeData.name) structureScore += 4;
  if (resumeData.summary && resumeData.summary.length > 50) structureScore += 4;
  if (resumeData.skills?.technical?.length > 0) structureScore += 4;
  if (resumeData.education) structureScore += 4;
  if (allBullets.length > 2) structureScore += 4;

  // Readability (0-10)
  let readabilityScore = 5;
  if (resumeData.summary && resumeData.summary.split(' ').length < 60) readabilityScore += 2;
  if (allBullets.every(b => b.split(' ').length < 25)) readabilityScore += 3;

  const total = keywordScore + skillsScore + impactScore + structureScore + readabilityScore;

  const tips = [];
  if (keywordScore < 20) tips.push('Add more role-specific keywords to improve matching.');
  if (skillsScore < 15) tips.push('Include more relevant tools and technologies in your skills section.');
  if (impactScore < 15) tips.push('Start all bullet points with strong action verbs (Built, Developed, Implemented).');
  if (structureScore < 16) tips.push('Ensure all resume sections are filled completely.');
  if (allBullets.length < 6) tips.push('Add more bullet points to your experience/projects for better coverage.');
  if (missingKeywords.length > 3) tips.push(`Consider adding keywords: ${missingKeywords.slice(0, 4).join(', ')}.`);

  return {
    score: Math.min(100, total),
    breakdown: {
      keywords: keywordScore,
      skills: skillsScore,
      impact: impactScore,
      structure: structureScore,
      readability: readabilityScore,
    },
    missing_keywords: missingKeywords,
    improvement_tips: tips,
  };
}

function extractKeywordsFromJD(jobDescription, roleData, rolePack) {
  const jd = String(jobDescription || '').toLowerCase();
  if (!jd.trim()) return [];

  const tokens = jd
    .replace(/[^a-z0-9+\-#\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4);

  const stop = new Set([
    'with', 'that', 'this', 'from', 'have', 'will', 'your', 'their', 'team', 'teams',
    'role', 'must', 'should', 'good', 'ability', 'years', 'experience', 'work', 'working',
    'required', 'preferred', 'strong', 'skills', 'knowledge', 'using',
  ]);
  const freq = {};
  for (const t of tokens) {
    if (stop.has(t)) continue;
    freq[t] = (freq[t] || 0) + 1;
  }
  const topJdTokens = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([k]) => k);

  return uniqueLimit([
    ...topJdTokens,
    ...(roleData.keywords || []),
    ...(rolePack.keywords || []),
  ], 24);
}

export function calculateJDMatchDetails(resumeData, targetRole, jobDescription, rolePackId = 'auto') {
  const roleData = getRoleData(targetRole);
  const rolePack = resolveRolePack(rolePackId, targetRole, resumeData?.location);
  const jdKeywords = extractKeywordsFromJD(jobDescription, roleData, rolePack);
  const resumeText = JSON.stringify(resumeData || {}).toLowerCase();

  const matched = jdKeywords.filter((k) => resumeText.includes(String(k).toLowerCase()));
  const missing = jdKeywords.filter((k) => !matched.includes(k));
  const score = jdKeywords.length ? Math.round((matched.length / jdKeywords.length) * 100) : 0;

  const explainability = matched.slice(0, 8).map((kw) => {
    const source = String(resumeText).includes((resumeData?.summary || '').toLowerCase()) && (resumeData?.summary || '').toLowerCase().includes(kw.toLowerCase())
      ? 'Summary'
      : 'Experience/Projects';
    return `${kw}: matched in ${source}`;
  });

  return {
    score,
    matched_keywords: matched,
    missing_keywords: missing,
    explainability,
    recommendation: missing.length
      ? `Add these priority terms: ${missing.slice(0, 6).join(', ')}.`
      : 'Great match. Focus on measurable outcomes and role-specific metrics.',
  };
}

export function generateCareerKit(resumeData, targetRole, jobDescription) {
  const name = resumeData?.name || 'Candidate';
  const role = targetRole || 'the role';
  const topSkills = (resumeData?.skills?.technical || []).slice(0, 5).join(', ');
  const topImpact =
    resumeData?.experience?.[0]?.bullets?.[0] ||
    resumeData?.projects?.[0]?.bullets?.[0] ||
    'Delivered high-impact outcomes in cross-functional environments.';
  const jdFocus = String(jobDescription || '').split('\n').slice(0, 2).join(' ').slice(0, 220);

  const coverLetter = `Dear Hiring Manager,\n\nI am excited to apply for the ${role} position. I bring hands-on experience in ${topSkills || 'modern technologies'} and a strong track record of delivering outcomes that align with business goals.\n\nIn my recent work, I ${topImpact.charAt(0).toLowerCase()}${topImpact.slice(1)} This reflects my approach to ownership, collaboration, and measurable execution.\n\n${jdFocus ? `I am particularly aligned with your focus on ${jdFocus}. ` : ''}I would welcome the opportunity to contribute to your team.\n\nSincerely,\n${name}`;

  const recruiterEmail = `Subject: Application for ${role} - ${name}\n\nHi Recruiter,\n\nI recently applied for the ${role} opportunity and wanted to share a quick introduction. I have experience in ${topSkills || 'relevant technical domains'} and have delivered strong outcomes such as: ${topImpact}\n\nI would appreciate the chance to discuss how I can contribute to your team.\n\nBest regards,\n${name}`;

  const interviewQuestions = [
    `Walk me through your strongest project relevant to ${role}.`,
    'How do you prioritize trade-offs between speed and quality?',
    'Tell us about a measurable impact you delivered and how you measured it.',
    'How do you collaborate with cross-functional stakeholders?',
    `Which tools and workflows do you use for ${role} execution?`,
    'Describe a time you handled ambiguity and still delivered.',
    'How do you ensure quality and reliability before release?',
    'Tell us about a failure and what you changed afterward.',
    'How would you approach your first 30 days in this role?',
    'Why this role and why this company now?',
  ];

  return {
    cover_letter: coverLetter,
    recruiter_email: recruiterEmail,
    interview_questions: interviewQuestions,
  };
}

export function generateApplicationFeedback(applications, targetRole) {
  const list = Array.isArray(applications) ? applications : [];
  if (list.length === 0) {
    return ['Track your applications to unlock tailored resume feedback.'];
  }
  const rejected = list.filter((a) => String(a.status || '').toLowerCase().includes('reject')).length;
  const interview = list.filter((a) => String(a.status || '').toLowerCase().includes('interview')).length;
  const noReply = list.filter((a) => String(a.status || '').toLowerCase().includes('applied')).length;

  const tips = [];
  if (rejected >= 3) tips.push('Increase role-keyword alignment and quantify outcomes in top 3 bullets.');
  if (noReply >= 5) tips.push('Customize summary and project order for each job description.');
  if (interview > 0) tips.push('Reuse wording from roles that reached interview stage for similar jobs.');
  if (!tips.length) tips.push(`Keep iterating for ${targetRole || 'your role'} and track responses weekly.`);
  return tips;
}

export function generateResume(userData, targetRole, options = {}) {
  const mode = options.mode || 'final';
  const isPreview = mode === 'preview';
  const rolePack = resolveRolePack(options.rolePackId, targetRole, userData?.location);
  let summary = isPreview ? String(userData.summary || '').trim() : generateSummary(userData, targetRole);
  let skills = isPreview
    ? {
        technical: uniqueLimit(splitCsv(userData.skills), 12),
        tools: uniqueLimit(splitCsv(userData.tools), 10),
        soft: [],
      }
    : enhanceSkills(userData, targetRole);

  if (!isPreview) {
    summary = applyRolePackToSummary(summary, rolePack);
    skills = applyRolePackToSkills(skills, rolePack);
  }

  const projects = (userData.projects || [])
    .filter(p => p && (p.name || p.description || p.details || p.techStack))
    .map(p => ({
    name: p.name || 'Untitled Project',
    techStack: p.techStack || '',
    description: p.description || '',
    evidenceLines: String(p.evidence || '').split('\n').map((x) => x.trim()).filter(Boolean),
    bullets: enhanceBullets(
      (p.details || p.description || '').split('\n').filter(Boolean),
      targetRole
    ),
  }));

  const experience = (userData.experience || [])
    .filter(e => e && (e.title || e.company || e.details || e.duration || e.location))
    .map(e => ({
    title: e.title || '',
    company: e.company || '',
    duration: e.duration || '',
    location: e.location || '',
    evidenceLines: String(e.evidence || '').split('\n').map((x) => x.trim()).filter(Boolean),
    bullets: enhanceBullets(
      (e.details || '').split('\n').filter(Boolean),
      targetRole
    ),
  }));

  const education = normalizeEducation(userData.education);

  const resumeData = {
    name: userData.name || '',
    email: userData.email || '',
    phone: userData.phone || '',
    location: userData.location || '',
    linkedin: userData.linkedin || '',
    github: userData.github || '',
    portfolio: userData.portfolio || '',
    summary,
    skills,
    projects,
    experience,
    education,
    rolePack: rolePack.id,
  };

  const finalResume = isPreview ? resumeData : ensureDensity(resumeData, targetRole, 'auto');
  const ats = calculateATSScore(finalResume, targetRole, rolePack.id);
  finalResume.ats = ats;

  return finalResume;
}
export { ACTION_VERBS, getRoleData, calculateATSScore, ROLE_PACKS, resolveRolePack };
