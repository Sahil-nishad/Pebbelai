/**
 * Compile all 10 LaTeX resume templates via latexonline.cc
 * Then convert PDFs to PNG using pdf.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'public', 'templates');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── Common macros & preamble fragments ──
const COMMON_PREAMBLE = `\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}`;

const COMMON_COMMANDS = `\\newcommand{\\resumeSubheading}[4]{\\vspace{-2pt}\\item\\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\\textbf{#1}&{#2}\\\\\\textit{\\small#3}&\\textit{\\small#4}\\end{tabular*}\\vspace{-7pt}}
\\newcommand{\\resumeItem}[1]{\\item\\small{#1\\vspace{-2pt}}}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}`;

const COMMON_BODY = `\\section{Education}
\\begin{itemize}[leftmargin=0.15in, label={}]
\\resumeSubheading{Stanford University}{Stanford, CA}{B.S. Computer Science, GPA: 3.8/4.0}{Aug 2015 -- May 2019}
\\end{itemize}
\\section{Experience}
\\begin{itemize}[leftmargin=0.15in, label={}]
\\resumeSubheading{Senior Software Engineer}{Jan 2022 -- Present}{Tech Innovations Inc.}{San Francisco, CA}
\\resumeItemListStart
\\resumeItem{Architected microservices infrastructure handling 10M+ API calls daily with 99.99\\% uptime}
\\resumeItem{Built real-time analytics dashboard serving 50K+ daily active users with sub-100ms response}
\\resumeItem{Led team of 8 engineers to deliver product 2 weeks ahead of schedule, reducing costs by 40\\%}
\\resumeItemListEnd
\\resumeSubheading{Software Engineer}{Jun 2019 -- Dec 2021}{DataFlow Systems}{New York, NY}
\\resumeItemListStart
\\resumeItem{Developed REST APIs handling 2M+ daily requests with 99.9\\% uptime and p99 latency <50ms}
\\resumeItem{Implemented CI/CD pipeline reducing release cycles from 2 weeks to 2 days}
\\resumeItemListEnd
\\end{itemize}
\\section{Projects}
\\begin{itemize}[leftmargin=0.15in, label={}]
\\resumeSubheading{DevOps Dashboard}{React, Node.js, Docker}{}{}
\\resumeItemListStart
\\resumeItem{Full-stack monitoring tool with real-time CI/CD pipeline visualization, 1.2K+ GitHub stars}
\\resumeItemListEnd
\\end{itemize}
\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
\\small{\\item{\\textbf{Languages:}{ JavaScript, TypeScript, Python, Java, SQL, Go} \\\\
\\textbf{Frameworks:}{ React, Node.js, Express, Next.js, Django, Spring Boot} \\\\
\\textbf{Tools:}{ Git, Docker, Kubernetes, AWS, GCP, Terraform, Jenkins}}}
\\end{itemize}`;

// ── Template definitions ──
const TEMPLATES = {};

// 1. Jake Ryan (classic CS resume)
TEMPLATES.jakeryan = `\\documentclass[letterpaper,11pt]{article}
${COMMON_PREAMBLE}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]
${COMMON_COMMANDS}
\\begin{document}
\\begin{center}
{\\Huge\\scshape Alex Chen} \\\\ \\vspace{1pt}
\\small (555) 012-3456 $|$ alex@example.com $|$ linkedin.com/in/alexchen $|$ github.com/alexchen
\\end{center}
${COMMON_BODY}
\\end{document}`;

// 2. Harshibar (modern sans-serif)
TEMPLATES.harshibar = `\\documentclass[letterpaper,11pt]{article}
${COMMON_PREAMBLE}
\\usepackage{fontawesome5}
\\definecolor{light-grey}{gray}{0.83}
\\titleformat{\\section}{\\scshape\\raggedright\\large}{}{0em}{}[\\color{light-grey}\\titlerule]
${COMMON_COMMANDS}
\\begin{document}
\\begin{center}
{\\Huge \\textbf{Alex Chen}} \\\\ \\vspace{5pt}
\\small \\faIcon{envelope} alex@example.com \\quad \\faIcon{phone} (555) 012-3456 \\quad \\faIcon{linkedin} linkedin.com/in/alexchen \\quad \\faIcon{github} github.com/alexchen
\\end{center}
${COMMON_BODY}
\\end{document}`;

// 3. Jitin Nair (academic, small caps)
TEMPLATES.jitin = `\\documentclass[letterpaper,11pt]{article}
${COMMON_PREAMBLE}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\Large}{}{0em}{}[\\titlerule\\vspace{-3pt}]
${COMMON_COMMANDS}
\\begin{document}
\\begin{center}
{\\LARGE \\textbf{Alex Chen}} \\\\[4pt]
\\small 123 University Drive, Cambridge, MA 02139 $\\bullet$ (555) 012-3456 $\\bullet$ alex@example.com \\\\
linkedin.com/in/alexchen $\\bullet$ github.com/alexchen
\\end{center}
${COMMON_BODY}
\\end{document}`;

// 4. Anubhav Singh (technical, header left-right)
TEMPLATES.anubhav = `\\documentclass[letterpaper,11pt]{article}
${COMMON_PREAMBLE}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries}{}{0em}{}[\\titlerule\\vspace{-5pt}]
${COMMON_COMMANDS}
\\begin{document}
\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
\\textbf{\\Huge Alex Chen} & \\small alex@example.com \\\\
 & \\small (555) 012-3456 \\\\
 & \\small linkedin.com/in/alexchen \\\\
 & \\small github.com/alexchen
\\end{tabular*}
\\vspace{-10pt}
${COMMON_BODY}
\\end{document}`;

// 5. Rezume (blue section titles)
TEMPLATES.rezume = `\\documentclass[letterpaper,11pt]{article}
${COMMON_PREAMBLE}
\\definecolor{linkblue}{HTML}{1d4ed8}
\\titleformat{\\section}{\\vspace{-4pt}\\color{linkblue}\\scshape\\raggedright\\large}{}{0em}{}[\\titlerule\\vspace{-5pt}]
${COMMON_COMMANDS}
\\begin{document}
\\begin{center}
{\\Huge \\textbf{Alex Chen}} \\\\ \\vspace{3pt}
\\small alex@example.com $|$ (555) 012-3456 $|$ linkedin.com/in/alexchen $|$ github.com/alexchen
\\end{center}
${COMMON_BODY}
\\end{document}`;

// 6. Times Serif (elegant traditional)
TEMPLATES.timesserif = `\\documentclass[letterpaper,11pt]{article}
${COMMON_PREAMBLE}
\\usepackage{mathptmx}
\\definecolor{navyblue}{HTML}{003399}
\\titleformat{\\section}{\\vspace{-3pt}\\raggedright\\large\\bfseries}{}{0em}{}[\\titlerule\\vspace{-3pt}]
${COMMON_COMMANDS}
\\begin{document}
\\begin{center}
{\\Huge \\textbf{Alex Chen}} \\\\ \\vspace{4pt}
\\small alex@example.com $|$ (555) 012-3456 $|$ San Francisco, CA \\\\
\\small linkedin.com/in/alexchen $|$ github.com/alexchen
\\end{center}
${COMMON_BODY}
\\end{document}`;

// 7. Audric (Lato, small caps, gray rules)  
TEMPLATES.audric = `\\documentclass[letterpaper,11pt]{article}
${COMMON_PREAMBLE}
\\definecolor{lightgray}{gray}{0.75}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{lightgray}\\titlerule\\vspace{-5pt}]
${COMMON_COMMANDS}
\\begin{document}
\\begin{center}
{\\Huge \\scshape Alex Chen} \\\\ \\vspace{3pt}
\\small alex@example.com $\\cdot$ (555) 012-3456 $\\cdot$ linkedin.com/in/alexchen $\\cdot$ github.com/alexchen
\\end{center}
${COMMON_BODY}
\\end{document}`;

// 8. Jan Kuster (blue accents, centered titles)
TEMPLATES.jankuster = `\\documentclass[letterpaper,11pt]{article}
${COMMON_PREAMBLE}
\\definecolor{headerblue}{HTML}{0096FF}
\\titleformat{\\section}{\\vspace{-4pt}\\centering\\color{headerblue}\\scshape\\large}{}{0em}{}[\\vspace{-5pt}]
${COMMON_COMMANDS}
\\begin{document}
\\begin{center}
{\\Huge \\textbf{Alex Chen}} \\\\[2pt]
{\\color{headerblue}\\rule{\\textwidth}{2pt}} \\\\[4pt]
\\small alex@example.com $|$ (555) 012-3456 $|$ linkedin.com/in/alexchen $|$ github.com/alexchen
\\end{center}
${COMMON_BODY}
\\end{document}`;

// 9. ModernCV (blue header block)
TEMPLATES.moderncv = `\\documentclass[letterpaper,11pt]{article}
${COMMON_PREAMBLE}
\\usepackage{xcolor}
\\definecolor{cvblue}{HTML}{1d4ed8}
\\titleformat{\\section}{\\vspace{-4pt}\\color{cvblue}\\itshape\\raggedright\\large}{}{0em}{}[\\vspace{-5pt}]
${COMMON_COMMANDS}
\\begin{document}
\\noindent\\colorbox{cvblue}{\\parbox{\\textwidth}{\\vspace{10pt}\\centering{\\color{white}\\Huge\\textbf{Alex Chen}}\\\\[4pt]{\\color{white}\\small alex@example.com $|$ (555) 012-3456 $|$ San Francisco, CA $|$ github.com/alexchen}\\vspace{10pt}}}
\\vspace{10pt}
${COMMON_BODY}
\\end{document}`;

// 10. Professional (blue section headers, corporate)
TEMPLATES.professional = `\\documentclass[letterpaper,11pt]{article}
${COMMON_PREAMBLE}
\\definecolor{profblue}{HTML}{0064B4}
\\titleformat{\\section}{\\vspace{-4pt}\\color{profblue}\\scshape\\raggedright\\large}{}{0em}{}[\\color{profblue}\\titlerule\\vspace{-5pt}]
${COMMON_COMMANDS}
\\begin{document}
\\begin{center}
{\\Huge \\textbf{Alex Chen}} \\\\ \\vspace{3pt}
\\small alex@example.com $|$ (555) 012-3456 $|$ San Francisco, CA \\\\
\\small linkedin.com/in/alexchen $|$ Portfolio: alexchen.dev $|$ github.com/alexchen
\\end{center}
\\section{Summary}
\\small Results-driven software engineer with 5+ years of experience in full-stack development. Expert in React, Node.js, and cloud infrastructure with a passion for building scalable, high-performance applications.
${COMMON_BODY}
\\end{document}`;


// ── Compile function ──
function compileTemplate(name, texCode) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(texCode);
    const url = 'https://latexonline.cc/compile?text=' + encoded;

    console.log(`  Compiling ${name}...`);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const data = Buffer.concat(chunks);
        if (data.slice(0, 5).toString() === '%PDF-') {
          const pdfPath = path.join(outDir, name + '.pdf');
          fs.writeFileSync(pdfPath, data);
          console.log(`  ✅ ${name}.pdf (${(data.length / 1024).toFixed(0)} KB)`);
          resolve(pdfPath);
        } else {
          console.log(`  ❌ ${name} - ${data.toString().substring(0, 100)}`);
          reject(new Error('Compilation failed'));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== Compiling 10 LaTeX Templates ===\n');
  
  const names = Object.keys(TEMPLATES);
  // Compile sequentially to avoid rate limiting
  for (const name of names) {
    try {
      await compileTemplate(name, TEMPLATES[name]);
    } catch (e) {
      console.log(`  ⚠️  Skipping ${name}: ${e.message}`);
    }
  }
  
  console.log('\n=== Done! Check public/templates/ for PDFs ===');
}

main();
