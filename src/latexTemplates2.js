/**
 * LaTeX Templates 6-10 + Registry + Export
 */
import { esc, eduString, t1_harshibar, t2_jitin, t3_anubhav, t4_rezume, t5_timesserif } from './latexTemplates.js';

function bullets9(items) {
  if (!items?.length) return '';
  return items.map(b => `        \\resumeItem{${esc(b)}}`).join('\n');
}

// ═══════════ TEMPLATE 6: Audric Serador (Lato) ═══════════
export function t6_audric(d) {
  const exp = (d.experience || []).filter(e => e.title || e.company).map(e => `
    \\resumeSubheading
      {${esc(e.title)}}{${esc(e.duration)}}
      {${esc(e.company)}}{${esc(e.location || '')}}
      \\resumeItemListStart
${bullets9(e.bullets)}
      \\resumeItemListEnd`).join('\n');

  const proj = (d.projects || []).filter(p => p.name).map(p => `
      \\resumeProjectHeading
          {\\textbf{${esc(p.name)}} $|$ \\emph{${esc(p.techStack || '')}}}{} 
          \\resumeItemListStart
${bullets9(p.bullets)}
          \\resumeItemListEnd`).join('\n');

  return `\\documentclass[letterpaper,11pt]{article}
\\usepackage{fontawesome5}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage[default]{lato}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]
\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{\\vspace{-2pt}\\item\\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\\textbf{#1} & #2 \\\\ \\textit{\\small#3} & \\textit{\\small #4} \\\\\\end{tabular*}\\vspace{-7pt}}
\\newcommand{\\resumeProjectHeading}[2]{\\item\\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}\\small#1 & #2 \\\\\\end{tabular*}\\vspace{-7pt}}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}
\\begin{document}
\\begin{center}
    \\textbf{\\Huge \\scshape ${esc(d.name)}} \\\\ \\vspace{1pt}
    \\small ${esc(d.phone || '')} $|$ \\href{mailto:${esc(d.email)}}{\\underline{${esc(d.email)}}} $|$
    ${d.linkedin ? `\\href{https://${esc(d.linkedin)}}{\\underline{${esc(d.linkedin)}}} $|$` : ''}
    ${d.github ? `\\href{https://github.com/${esc(d.github)}}{\\underline{github.com/${esc(d.github)}}}` : ''}
\\end{center}
\\section{Education}
  \\resumeSubHeadingListStart
    ${Array.isArray(d.education) ? d.education.map(e => `\\resumeSubheading{${esc(e.school || '')}}{${esc(e.location || '')}}{${esc(e.degree || '')}}{${esc(e.dates || '')}}`).join('\n    ') : `\\resumeSubheading{${esc(eduString(d.education))}}{}{}{}`}
  \\resumeSubHeadingListEnd
\\section{Experience}
  \\resumeSubHeadingListStart
${exp}
  \\resumeSubHeadingListEnd
\\section{Projects}
    \\resumeSubHeadingListStart
${proj}
    \\resumeSubHeadingListEnd
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     ${d.skills?.technical?.length ? `\\textbf{Languages}{: ${d.skills.technical.map(esc).join(', ')}} \\\\` : ''}
     ${d.skills?.tools?.length ? `\\textbf{Tools}{: ${d.skills.tools.map(esc).join(', ')}} \\\\` : ''}
     ${d.skills?.soft?.length ? `\\textbf{Soft Skills}{: ${d.skills.soft.map(esc).join(', ')}}` : ''}
    }}
 \\end{itemize}
\\end{document}`;
}

// ═══════════ TEMPLATE 7: Jan Küster (Raleway, Blue Accent) ═══════════
export function t7_jankuster(d) {
  const events = (d.experience || []).filter(e => e.title || e.company).map(e => `
\\cvevent{${esc(e.duration)}}{${esc(e.title)}}{${esc(e.company)}}{${(e.bullets || []).slice(0, 1).map(esc).join('')}}{${(e.bullets || []).slice(1, 2).map(esc).join('')}}`).join('\n');

  return `\\documentclass[10pt,A4]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{xifthen}
\\usepackage[default]{raleway}
\\renewcommand*\\familydefault{\\sfdefault}
\\usepackage[T1]{fontenc}
\\usepackage{moresize}
\\usepackage[a4paper]{geometry}
\\geometry{top=1.25cm, bottom=-.6cm, left=1.5cm, right=1.5cm}
\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\setlength{\\headheight}{-5pt}
\\setlength{\\parindent}{0mm}
\\usepackage{multicol}
\\usepackage{multirow}
\\usepackage{array}
\\usepackage{graphicx}
\\usepackage{wrapfig}
\\usepackage{float}
\\usepackage{tikz}
\\usepackage{color}
\\definecolor{sectcol}{RGB}{0,150,255}
\\definecolor{bgcol}{RGB}{110,110,110}
\\definecolor{softcol}{RGB}{225,225,225}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\renewcommand{\\thepage}{}
\\renewcommand{\\thesection}{}
\\newcommand{\\cvsection}[1]{\\begin{center}\\large\\textcolor{sectcol}{\\textbf{#1}}\\end{center}}
\\newcommand{\\metasection}[2]{\\footnotesize{#2} \\hspace*{\\fill} \\footnotesize{#1}\\\\[1pt]}
\\newcommand{\\cvevent}[5]{\\begin{tabular*}{1\\textwidth}{p{13.6cm}  x{3.9cm}}\\textbf{#2} - \\textcolor{bgcol}{#3} & \\vspace{2.5pt}\\textcolor{sectcol}{#1}\\end{tabular*}\\vspace{-8pt}\\textcolor{softcol}{\\hrule}\\vspace{6pt}$\\cdot$ #4\\\\[3pt]$\\cdot$ #5\\\\[6pt]}
\\newcolumntype{x}[1]{>{\\raggedleft\\hspace{0pt}}p{#1}}
\\begin{document}
\\pagestyle{fancy}
\\vspace{-8pt}
\\begin{center}
\\HUGE \\textsc{${esc(d.name)}} \\textcolor{sectcol}{\\rule[-1mm]{1mm}{0.9cm}} \\textsc{Resume}\\\\[2pt]
\\small ${esc(d.experience?.[0]?.title || 'Professional')}
\\end{center}
\\vspace{6pt}
\\metasection{${esc(d.location || '')}}{\\textbf{Status:} ${esc(d.summary?.substring(0, 60) || '')}}
\\metasection{${esc(d.email || '')}}{\\textbf{Skills:} ${(d.skills?.technical || []).slice(0, 5).map(esc).join(', ')}}
\\metasection{${esc(d.phone || '')}}{\\textbf{Tools:} ${(d.skills?.tools || []).slice(0, 5).map(esc).join(', ')}}
${d.linkedin ? `\\metasection{${esc(d.linkedin)}}{\\textbf{Soft Skills:} ${(d.skills?.soft || []).slice(0, 4).map(esc).join(', ')}}` : ''}
\\vspace{-2pt}
\\textcolor{softcol}{\\hrule}
\\vspace{6pt}
\\normalsize
${d.summary ? `\\vspace{-6pt}\\cvsection{Summary}\n${esc(d.summary)}\n` : ''}
\\cvsection{Experience}
${events}
\\cvsection{Projects}
${(d.projects || []).filter(p => p.name).map(p => `\\cvevent{}{${esc(p.name)}}{${esc(p.techStack || '')}}{${(p.bullets || []).slice(0, 1).map(esc).join('')}}{${(p.bullets || []).slice(1, 2).map(esc).join('')}}`).join('\n')}
\\cvsection{Education}
${Array.isArray(d.education) ? d.education.map(e => `\\cvevent{${esc(e.dates || '')}}{${esc(e.degree || '')}}{${esc(e.school || '')}}{${esc(e.details || '')}}{}`).join('\n') : `\\cvevent{}{${esc(eduString(d.education))}}{}{}{}`}
\\end{document}`;
}

// ═══════════ TEMPLATE 8: ModernCV Banking ═══════════
export function t8_moderncv(d) {
  const exp = (d.experience || []).filter(e => e.title || e.company).map(e => `
\\cventry{}{}{${esc(e.title)} -- ${esc(e.company)}}{${esc(e.duration)} \\vspace{-1.0em}}{}{
\\begin{itemize}
${(e.bullets || []).map(b => `\\item ${esc(b)}`).join('\n')}
\\end{itemize}}`).join('\n');

  const proj = (d.projects || []).filter(p => p.name).map(p => `
\\cventry{}{}{${esc(p.name)}${p.techStack ? ` (${esc(p.techStack)})` : ''}}{\\vspace{-1.0em}}{}{
\\begin{itemize}
${(p.bullets || []).map(b => `\\item ${esc(b)}`).join('\n')}
\\end{itemize}}`).join('\n');

  return `\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{banking}
\\moderncvcolor{blue}
\\nopagenumbers{}
\\usepackage[utf8]{inputenc}
\\usepackage{multicol}
\\usepackage[scale=0.8,top=0.5cm, bottom=0.1cm]{geometry}
\\usepackage{xpatch}
\\xpatchcmd\\cventry{,}{}{}{}
\\name{${esc(d.name?.split(' ')[0] || '')}}{${esc(d.name?.split(' ').slice(1).join(' ') || '')}}
\\phone[mobile]{${esc(d.phone || '')}}
\\email{${esc(d.email || '')}}
${d.linkedin ? `\\homepage{${esc(d.linkedin)}}` : ''}
${d.github ? `\\social[github]{${esc(d.github)}}` : ''}
\\begin{document}
\\vspace*{-1.05mm}
\\makecvtitle
\\vspace*{-10mm}
\\section{Education}
${Array.isArray(d.education) ? d.education.map(e => `\\cventry{}{}{${esc(e.school || '')}}{${esc(e.dates || '')}}{\\hspace*{-2.5 mm} ${esc(e.degree || '')}}{}`).join('\n') : `\\cventry{}{}{${esc(eduString(d.education))}}{}{}{}`}
\\section{Experience}
${exp}
\\section{Projects}
${proj}
\\section{Skills}
\\begin{itemize}
${d.skills?.technical?.length ? `\\item \\textbf{Technical:} ${d.skills.technical.map(esc).join(', ')}` : ''}
${d.skills?.tools?.length ? `\\item \\textbf{Tools:} ${d.skills.tools.map(esc).join(', ')}` : ''}
${d.skills?.soft?.length ? `\\item \\textbf{Soft Skills:} ${d.skills.soft.map(esc).join(', ')}` : ''}
\\end{itemize}
\\end{document}`;
}

// ═══════════ TEMPLATE 9: Jake Ryan ═══════════
export function t9_jakeryan(d) {
  const exp = (d.experience || []).filter(e => e.title || e.company).map(e => `
    \\resumeSubheading
      {${esc(e.title)}}{${esc(e.duration)}}
      {${esc(e.company)}}{${esc(e.location || '')}}
      \\resumeItemListStart
${bullets9(e.bullets)}
      \\resumeItemListEnd`).join('\n');

  const proj = (d.projects || []).filter(p => p.name).map(p => `
      \\resumeProjectHeading
          {\\textbf{${esc(p.name)}} $|$ \\emph{${esc(p.techStack || '')}}}{} 
          \\resumeItemListStart
${bullets9(p.bullets)}
          \\resumeItemListEnd`).join('\n');

  return `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]
\\pdfgentounicode=1
\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{\\vspace{-2pt}\\item\\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\\textbf{#1} & #2 \\\\ \\textit{\\small#3} & \\textit{\\small #4} \\\\\\end{tabular*}\\vspace{-7pt}}
\\newcommand{\\resumeProjectHeading}[2]{\\item\\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}\\small#1 & #2 \\\\\\end{tabular*}\\vspace{-7pt}}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}
\\begin{document}
\\begin{center}
    \\textbf{\\Huge \\scshape ${esc(d.name)}} \\\\ \\vspace{1pt}
    \\small ${esc(d.phone || '')} $|$ \\href{mailto:${esc(d.email)}}{\\underline{${esc(d.email)}}} $|$
    ${d.linkedin ? `\\href{https://${esc(d.linkedin)}}{\\underline{${esc(d.linkedin)}}} $|$` : ''}
    ${d.github ? `\\href{https://github.com/${esc(d.github)}}{\\underline{github.com/${esc(d.github)}}}` : ''}
\\end{center}
\\section{Education}
  \\resumeSubHeadingListStart
    ${Array.isArray(d.education) ? d.education.map(e => `\\resumeSubheading{${esc(e.school || '')}}{${esc(e.location || '')}}{${esc(e.degree || '')}}{${esc(e.dates || '')}}`).join('\n    ') : `\\resumeSubheading{${esc(eduString(d.education))}}{}{}{}`}
  \\resumeSubHeadingListEnd
\\section{Experience}
  \\resumeSubHeadingListStart
${exp}
  \\resumeSubHeadingListEnd
\\section{Projects}
    \\resumeSubHeadingListStart
${proj}
    \\resumeSubHeadingListEnd
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     ${d.skills?.technical?.length ? `\\textbf{Languages}{: ${d.skills.technical.map(esc).join(', ')}} \\\\` : ''}
     ${d.skills?.tools?.length ? `\\textbf{Developer Tools}{: ${d.skills.tools.map(esc).join(', ')}} \\\\` : ''}
     ${d.skills?.soft?.length ? `\\textbf{Soft Skills}{: ${d.skills.soft.map(esc).join(', ')}}` : ''}
    }}
 \\end{itemize}
\\end{document}`;
}

// ═══════════ TEMPLATE 10: Professional (Inspired by cvhari) ═══════════
export function t10_professional(d) {
  const exp = (d.experience || []).filter(e => e.title || e.company).map(e => `
\\noindent\\textbf{${esc(e.company)}} \\hfill ${esc(e.location || '')} \\\\
\\textit{${esc(e.title)}} \\hfill \\textit{${esc(e.duration)}}
\\begin{itemize}[leftmargin=1.5em, itemsep=2pt]
${(e.bullets || []).map(b => `  \\item ${esc(b)}`).join('\n')}
\\end{itemize}
\\vspace{4pt}
\\noindent\\rule{\\textwidth}{0.3pt}`).join('\n');

  const proj = (d.projects || []).filter(p => p.name).map(p => `
\\noindent\\textbf{${esc(p.name)}} ${p.techStack ? `\\hfill \\textit{${esc(p.techStack)}}` : ''}
\\begin{itemize}[leftmargin=1.5em, itemsep=2pt]
${(p.bullets || []).map(b => `  \\item ${esc(b)}`).join('\n')}
\\end{itemize}`).join('\n\\vspace{4pt}\n');

  return `\\documentclass[10pt, a4paper]{article}
\\usepackage[left=1.2cm,right=1.2cm,top=1.2cm,bottom=1.2cm]{geometry}
\\usepackage[default]{lato}
\\usepackage[T1]{fontenc}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage[usenames,dvipsnames]{xcolor}
\\usepackage{fontawesome5}
\\definecolor{accent}{RGB}{0,100,180}
\\hypersetup{colorlinks,urlcolor=accent,linkcolor=accent}
\\pagestyle{empty}
\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}[\\color{accent}\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{6pt}
\\setlength{\\parindent}{0pt}
\\begin{document}
\\begin{center}
{\\LARGE\\textbf{${esc(d.name)}}} \\\\[4pt]
{\\small ${esc(d.experience?.[0]?.title || 'Software Engineer')}} \\\\[6pt]
{\\footnotesize
\\faEnvelope\\ ${esc(d.email || '')} \\quad
\\faPhone\\ ${esc(d.phone || '')} \\quad
\\faMapMarker*\\ ${esc(d.location || '')}
${d.linkedin ? `\\quad \\faLinkedin\\ ${esc(d.linkedin)}` : ''}}
\\end{center}
${d.summary ? `\\section{Profile}\n\\begin{itemize}[leftmargin=1.5em]\n  \\item ${esc(d.summary)}\n\\end{itemize}\n` : ''}
\\section{Professional Experience}
${exp}
\\section{Projects}
${proj}
\\section{Skills}
\\begin{itemize}[leftmargin=1.5em, itemsep=2pt]
${d.skills?.technical?.length ? `  \\item \\textbf{Technical:} ${d.skills.technical.map(esc).join(', ')}` : ''}
${d.skills?.tools?.length ? `  \\item \\textbf{Tools:} ${d.skills.tools.map(esc).join(', ')}` : ''}
${d.skills?.soft?.length ? `  \\item \\textbf{Soft Skills:} ${d.skills.soft.map(esc).join(', ')}` : ''}
\\end{itemize}
\\section{Education}
${Array.isArray(d.education) ? d.education.map(e => `\\noindent\\textbf{${esc(e.degree || '')}} \\\\\\textit{${esc(e.school || '')}} \\hfill ${esc(e.dates || '')}\n`).join('\n\\vspace{4pt}\n') : esc(eduString(d.education))}
\\end{document}`;
}

// ═══════════ TEMPLATE REGISTRY ═══════════
export const TEMPLATES = [
  { id: 'harshibar', name: 'Harshibar', category: 'Sans-Serif', desc: 'Helvetica-style, bold headers, grey rules', generate: t1_harshibar },
  { id: 'jitin', name: 'Jitin Nair', category: 'Academic', desc: 'Centered header, small-caps sections, clean', generate: t2_jitin },
  { id: 'anubhav', name: 'Anubhav Singh', category: 'Technical', desc: 'Left-aligned, skill categories, detailed', generate: t3_anubhav },
  { id: 'rezume', name: 'Rezume', category: 'Professional', desc: 'Blue headers, Source Sans Pro, structured', generate: t4_rezume },
  { id: 'timesserif', name: 'Times Serif', category: 'Elegant', desc: 'Serif font, colored accents, minimal rules', generate: t5_timesserif },
  { id: 'audric', name: 'Audric', category: 'Modern', desc: 'Lato font, ATS-parsable, clean layout', generate: t6_audric },
  { id: 'jankuster', name: 'Jan Küster', category: 'Creative', desc: 'Raleway, blue accent, meta sections', generate: t7_jankuster },
  { id: 'moderncv', name: 'ModernCV', category: 'Banking', desc: 'ModernCV banking style, professional', generate: t8_moderncv },
  { id: 'jakeryan', name: 'Jake Ryan', category: 'Classic', desc: 'Industry standard, ATS-optimized, clean', generate: t9_jakeryan },
  { id: 'professional', name: 'Professional', category: 'Executive', desc: 'Lato font, accent color, company-focused', generate: t10_professional },
  { id: 'elevate', name: 'Elevate', category: 'Premium', desc: 'Refined modern layout for product roles', previewId: 'audric', generate: t6_audric },
  { id: 'vertex', name: 'Vertex', category: 'Balanced', desc: 'Classic-technical hybrid for engineering', previewId: 'jakeryan', generate: t9_jakeryan },
  { id: 'nexus', name: 'Nexus', category: 'Corporate', desc: 'Enterprise-ready polished structure', previewId: 'professional', generate: t10_professional },
  { id: 'metro', name: 'Metro', category: 'Minimal', desc: 'Simple high-clarity ATS focused format', previewId: 'harshibar', generate: t1_harshibar },
];

export function generateLatex(templateId, data) {
  const t = TEMPLATES.find(t => t.id === templateId);
  if (!t) throw new Error(`Template "${templateId}" not found`);
  return t.generate(data);
}

export function downloadLatex(templateId, data) {
  const latex = generateLatex(templateId, data);
  const blob = new Blob([latex], { type: 'application/x-latex' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resume-${templateId}.tex`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

