import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

// ═══════════════════════════════════════════════════════
// SYSTEM PROMPT — Expert Resume Writer + ATS Engine
// ═══════════════════════════════════════════════════════
const SYSTEM_PROMPT = `You are an expert resume writer, ATS optimization engine, and career advisor.

Your task is to take user input (which may be minimal) and generate a COMPLETE, professional, ATS-optimized resume.

CRITICAL RULES:
1. If the user provides LIMITED information for ANY section, you MUST generate realistic, professional content to fill that section with ATS-friendly language appropriate for the target role.
1a. If the user already provides DETAILED, sufficient content, preserve it and do NOT add unnecessary filler.
2. Generate at LEAST 3-4 strong bullet points per experience/project entry.
3. Each bullet MUST start with a strong action verb (Built, Developed, Implemented, Designed, Led, Optimized, etc.)
4. Add realistic metrics and impact statements (e.g., "improved performance by 40%", "served 10K+ users")
5. Include relevant industry keywords for the target role throughout.
6. Target ONE FULL PAGE of content density for A4 format (avoid large empty whitespace), but stay concise when content is already complete.
7. Ensure content depth mainly for sparse inputs: usually 4-6 bullets per experience/project, 2+ experience entries where possible, and 2-3 projects.

INSTRUCTIONS:
1. Generate a strong professional summary (2–3 lines), tailored to the target role, keyword-rich.
2. Expand and organize skills into categories: Technical Skills, Tools/Technologies, Soft Skills
3. Convert user projects/work into strong bullet points with action verbs + impact
4. If user has minimal experience: Focus on projects, internships, academic work — make it strong but realistic
5. Ensure heavy ATS optimization with relevant keywords
6. DO NOT hallucinate fake companies. DO NOT add unrealistic metrics. Keep it professional.
7. If details are sparse, you may use safe labels like "Freelance", "Academic Project", or "Internship" instead of inventing real company names.

ATS SCORING — Evaluate the resume:
- Keyword Match (0–30)
- Skills Relevance (0–20)
- Impact & Action Verbs (0–20)
- Structure & Formatting (0–20)
- Readability (0–10)

OUTPUT FORMAT (STRICT JSON):
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "portfolio": "",
  "github": "",
  "summary": "",
  "skills": {
    "technical": [],
    "tools": [],
    "soft": []
  },
  "experience": [
    {
      "title": "",
      "company": "",
      "duration": "",
      "location": "",
      "bullets": []
    }
  ],
  "projects": [
    {
      "name": "",
      "techStack": "",
      "description": "",
      "bullets": []
    }
  ],
  "education": [
    {
      "degree": "",
      "school": "",
      "location": "",
      "dates": "",
      "details": ""
    }
  ],
  "certifications": [],
  "ats": {
    "score": 0,
    "breakdown": { "keywords": 0, "skills": 0, "impact": 0, "structure": 0, "readability": 0 },
    "missing_keywords": [],
    "improvement_tips": []
  }
}

FINAL RULE: Return ONLY valid JSON. No explanations, no markdown fences, no extra text.`;

// ═══════════════════════════════════════════════════════
// Build user message from form data
// ═══════════════════════════════════════════════════════
function buildUserMessage(userData, targetRole, rolePackId) {
  const parts = [`Target Role: ${targetRole || 'Software Developer'}`];
  if (rolePackId) parts.push(`Role Intelligence Pack: ${rolePackId}`);
  parts.push('\\nUser Data:');
  if (userData.name) parts.push(`Name: ${userData.name}`);
  if (userData.email) parts.push(`Email: ${userData.email}`);
  if (userData.phone) parts.push(`Phone: ${userData.phone}`);
  if (userData.location) parts.push(`Location: ${userData.location}`);
  if (userData.linkedin) parts.push(`LinkedIn: ${userData.linkedin}`);
  if (userData.portfolio) parts.push(`Portfolio: ${userData.portfolio}`);
  if (userData.github) parts.push(`GitHub: ${userData.github}`);
  if (userData.yearsOfExperience) parts.push(`Years of Experience: ${userData.yearsOfExperience}`);
  if (userData.jobDescription) parts.push(`\nJob Description:\n${userData.jobDescription}`);
  if (userData.skills) parts.push(`\\nSkills (raw): ${userData.skills}`);
  if (userData.tools) parts.push(`Tools (raw): ${userData.tools}`);

  if (userData.experience?.length > 0) {
    parts.push('\\nExperience:');
    userData.experience.forEach((exp, i) => {
      if (exp.title || exp.company || exp.details) {
        parts.push(`  ${i + 1}. ${exp.title || 'Role'} at ${exp.company || 'Company'} (${exp.duration || 'N/A'})`);
        if (exp.location) parts.push(`     Location: ${exp.location}`);
        if (exp.details) parts.push(`     Details: ${exp.details}`);
        if (exp.evidence) parts.push(`     Evidence: ${exp.evidence}`);
      }
    });
  } else {
    parts.push('\\nExperience: None provided — generate realistic entries based on target role and skills.');
  }

  if (userData.projects?.length > 0) {
    parts.push('\\nProjects:');
    userData.projects.forEach((proj, i) => {
      if (proj.name || proj.details || proj.description) {
        parts.push(`  ${i + 1}. ${proj.name || 'Project'}`);
        if (proj.description) parts.push(`     Description: ${proj.description}`);
        if (proj.techStack) parts.push(`     Tech Stack: ${proj.techStack}`);
        if (proj.details) parts.push(`     Details: ${proj.details}`);
        if (proj.evidence) parts.push(`     Evidence: ${proj.evidence}`);
      }
    });
  } else {
    parts.push('\\nProjects: None provided — generate 2-3 relevant projects based on target role and skills.');
  }

  if (userData.education) parts.push(`\\nEducation: ${userData.education}`);
  else parts.push('\\nEducation: Not provided — generate a realistic education entry.');

  return parts.join('\\n');
}

// ═══════════════════════════════════════════════════════
// POST /api/enhance — Groq AI Enhancement
// ═══════════════════════════════════════════════════════
app.post('/api/enhance', async (req, res) => {
  try {
    const { userData, targetRole, rolePackId } = req.body;

    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(400).json({ error: 'GROQ_API_KEY not configured. Add your key to the .env file.' });
    }

    const userMessage = buildUserMessage(userData, targetRole, rolePackId);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_completion_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Groq API error: ${errText}` });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'Empty response from Groq' });
    }

    // Parse JSON response
    let parsed;
    try {
      let cleaned = content.trim();
      if (cleaned.startsWith('\`\`\`')) {
        cleaned = cleaned.replace(/^\`\`\`(?:json)?\n?/, '').replace(/\n?\`\`\`$/, '');
      }
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse AI response', raw: content });
    }

    // Merge with original user data to preserve contact info
    const result = {
      name: parsed.name || userData.name || '',
      email: parsed.email || userData.email || '',
      phone: parsed.phone || userData.phone || '',
      location: parsed.location || userData.location || '',
      linkedin: parsed.linkedin || userData.linkedin || '',
      portfolio: parsed.portfolio || userData.portfolio || '',
      github: parsed.github || userData.github || '',
      summary: parsed.summary || '',
      skills: {
        technical: parsed.skills?.technical || [],
        tools: parsed.skills?.tools || [],
        soft: parsed.skills?.soft || [],
      },
      experience: (parsed.experience || []).map(e => ({
        title: e.title || '',
        company: e.company || '',
        duration: e.duration || '',
        location: e.location || '',
        bullets: e.bullets || [],
      })),
      projects: (parsed.projects || []).map(p => ({
        name: p.name || '',
        techStack: p.techStack || p.tech_stack || '',
        description: p.description || '',
        bullets: p.bullets || [],
      })),
      education: parsed.education || [],
      certifications: parsed.certifications || [],
      ats: {
        score: parsed.ats?.score || 0,
        breakdown: {
          keywords: parsed.ats?.breakdown?.keywords || 0,
          skills: parsed.ats?.breakdown?.skills || 0,
          impact: parsed.ats?.breakdown?.impact || 0,
          structure: parsed.ats?.breakdown?.structure || 0,
          readability: parsed.ats?.breakdown?.readability || 0,
        },
        missing_keywords: parsed.ats?.missing_keywords || [],
        improvement_tips: parsed.ats?.improvement_tips || [],
      },
    };

    res.json(result);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/career-kit', async (req, res) => {
  try {
    const { resumeData, targetRole, jobDescription } = req.body || {};
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(400).json({ error: 'GROQ_API_KEY not configured. Add your key to the .env file.' });
    }

    const prompt = `Create a career kit for this candidate.
Return strict JSON:
{
  "cover_letter": "",
  "recruiter_email": "",
  "interview_questions": []
}
Rules:
- Tailor to target role and resume.
- Keep cover letter concise and professional.
- Recruiter email should be short and actionable.
- Exactly 10 interview questions.`;

    const userPayload = JSON.stringify({
      targetRole: targetRole || '',
      jobDescription: jobDescription || '',
      resumeData: resumeData || {},
    });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userPayload },
        ],
        temperature: 0.4,
        max_completion_tokens: 1400,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Groq API error: ${errText}` });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { cover_letter: '', recruiter_email: '', interview_questions: [] };
    }

    res.json({
      cover_letter: parsed.cover_letter || '',
      recruiter_email: parsed.recruiter_email || '',
      interview_questions: Array.isArray(parsed.interview_questions) ? parsed.interview_questions.slice(0, 10) : [],
    });
  } catch (err) {
    console.error('Career kit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// Health check
// ═══════════════════════════════════════════════════════
app.post('/api/ats-score', async (req, res) => {
  try {
    const { resumeData, targetRole, jobDescription } = req.body || {};

    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(400).json({ error: 'GROQ_API_KEY not configured. Add your key to the .env file.' });
    }

    const prompt = `You are an ATS scoring engine.
Return strict JSON only:
{
  "score": 0,
  "breakdown": { "keywords": 0, "skills": 0, "impact": 0, "structure": 0, "readability": 0 },
  "missing_keywords": [],
  "improvement_tips": []
}
Rules:
- score is 0-100 integer.
- breakdown max values: keywords=30, skills=20, impact=20, structure=20, readability=10.
- missing_keywords should include 5-12 practical keywords from job description/role not strongly represented in resume.
- improvement_tips should be 4-8 concise, actionable bullets.
- Be strict and realistic; avoid inflated scoring.`;

    const payload = JSON.stringify({
      targetRole: targetRole || '',
      jobDescription: jobDescription || '',
      resumeData: resumeData || {},
    });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: payload },
        ],
        temperature: 0.2,
        max_completion_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Groq API error: ${errText}` });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    const breakdown = parsed.breakdown || {};
    const safe = {
      score: Number.isFinite(parsed.score) ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 0,
      breakdown: {
        keywords: Number.isFinite(breakdown.keywords) ? Math.max(0, Math.min(30, Math.round(breakdown.keywords))) : 0,
        skills: Number.isFinite(breakdown.skills) ? Math.max(0, Math.min(20, Math.round(breakdown.skills))) : 0,
        impact: Number.isFinite(breakdown.impact) ? Math.max(0, Math.min(20, Math.round(breakdown.impact))) : 0,
        structure: Number.isFinite(breakdown.structure) ? Math.max(0, Math.min(20, Math.round(breakdown.structure))) : 0,
        readability: Number.isFinite(breakdown.readability) ? Math.max(0, Math.min(10, Math.round(breakdown.readability))) : 0,
      },
      missing_keywords: Array.isArray(parsed.missing_keywords) ? parsed.missing_keywords.slice(0, 12) : [],
      improvement_tips: Array.isArray(parsed.improvement_tips) ? parsed.improvement_tips.slice(0, 8) : [],
    };

    res.json(safe);
  } catch (err) {
    console.error('ATS scoring error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/robots.txt', (req, res) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /#login',
    'Disallow: /#profile',
    'Disallow: /#tracker',
    'Disallow: /#builder',
    `Sitemap: ${origin}/sitemap.xml`,
  ].join('\n'));
});

app.get('/sitemap.xml', (req, res) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  res.type('application/xml').send(xml);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    groqConfigured: !!GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here',
  });
});

// Serve built frontend from /dist when available
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('/*rest', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(distDir, 'index.html'));
  });
}
app.listen(PORT, () => {
  console.log(`\\n  🚀 ResumeAI Backend running on http://localhost:${PORT}`);
  console.log(`  📊 Groq API: ${GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here' ? '✅ Configured' : '❌ Not configured (add key to .env)'}`);
  if (fs.existsSync(distDir)) {
    console.log(`  Frontend served from dist at http://localhost:${PORT}`);
  }
  console.log('');
});





