/**
 * LaTeX Resume Templates — 10 Professional Templates
 * Maps user data into compilable .tex files
 */

// Escape LaTeX special characters in user input
export function esc(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, m => '\\' + m)
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

function bullets(items) {
  if (!items?.length) return '';
  return items.map(b => `    \\resumeItem{${esc(b)}}`).join('\n');
}

export function eduBlock(education) {
  if (!education) return '';
  if (typeof education === 'string') return esc(education);
  if (Array.isArray(education)) {
    return education.map(e =>
      `\\resumeSubheading{${esc(e.school || '')}}{${esc(e.location || '')}}{${esc(e.degree || '')}}{${esc(e.dates || '')}}`
    ).join('\n');
  }
  return '';
}

export function eduString(education) {
  if (!education) return '';
  if (typeof education === 'string') return education;
  if (Array.isArray(education)) {
    return education.map(e => `${e.degree || ''} — ${e.school || ''} (${e.dates || ''})`).join('\n');
  }
  return '';
}

// ═══════════ TEMPLATE 1: Harshibar ═══════════
export function t1_harshibar(d) {
  const exp = (d.experience || []).filter(e => e.title || e.company).map(e => `
    \\resumeSubheading
      {${esc(e.title)}}{${esc(e.duration)}}
      {${esc(e.company)}}{${esc(e.location || '')}}
      \\resumeItemListStart
${bullets(e.bullets)}
      \\resumeItemListEnd`).join('\n');

  const proj = (d.projects || []).filter(p => p.name).map(p => `
      \\resumeProjectHeading
          {\\textbf{${esc(p.name)}}${p.techStack ? ` $|$ \\emph{${esc(p.techStack)}}` : ''}}{}
          \\resumeItemListStart
${bullets(p.bullets)}
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
\\usepackage{fontawesome5}
\\usepackage[scale=0.90,lf]{FiraMono}
\\definecolor{light-grey}{gray}{0.83}
\\definecolor{dark-grey}{gray}{0.3}
\\definecolor{text-grey}{gray}{.08}
\\usepackage{tgheros}
\\renewcommand*\\familydefault{\\sfdefault}
\\usepackage[T1]{fontenc}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{0in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{\\bfseries \\vspace{2pt} \\raggedright \\large}{}{0em}{}[\\color{light-grey}{\\titlerule[2pt]} \\vspace{-4pt}]
\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-1pt}}}}
\\newcommand{\\resumeSubheading}[4]{\\vspace{-1pt}\\item\\begin{tabular*}{\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\\textbf{#1} & {\\color{dark-grey}\\small #2}\\vspace{1pt}\\\\ \\textit{#3} & {\\color{dark-grey} \\small #4}\\\\\\end{tabular*}\\vspace{-4pt}}
\\newcommand{\\resumeProjectHeading}[2]{\\item\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}#1 & {\\color{dark-grey}} \\\\\\end{tabular*}\\vspace{-4pt}}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{0pt}}
\\color{text-grey}
\\begin{document}
\\begin{center}
    \\textbf{\\Huge ${esc(d.name)}} \\\\ \\vspace{5pt}
    \\small${d.phone ? ` \\faPhone* \\texttt{${esc(d.phone)}} $|$` : ''}
${d.email ? `    \\faEnvelope \\hspace{2pt} \\texttt{${esc(d.email)}}` : ''}${d.linkedin ? ` $|$ \\faLinkedin \\hspace{2pt} \\texttt{${esc(d.linkedin)}}` : ''}${d.location ? ` $|$ \\faMapMarker* \\hspace{2pt}\\texttt{${esc(d.location)}}` : ''}
    \\\\ \\vspace{-3pt}
\\end{center}
${d.summary ? `\\section{SUMMARY}\n${esc(d.summary)}\n` : ''}
\\section{EXPERIENCE}
  \\resumeSubHeadingListStart${exp}
  \\resumeSubHeadingListEnd
\\section{PROJECTS}
    \\resumeSubHeadingListStart${proj}
    \\resumeSubHeadingListEnd
\\section{EDUCATION}
  \\resumeSubHeadingListStart
    ${eduBlock(d.education)}
  \\resumeSubHeadingListEnd
\\section{SKILLS}
 \\begin{itemize}[leftmargin=0in, label={}]
    \\small{\\item{
     ${d.skills?.technical?.length ? `\\textbf{Languages}{: ${d.skills.technical.map(esc).join(', ')}}\\vspace{2pt} \\\\` : ''}
     ${d.skills?.tools?.length ? `\\textbf{Tools}{: ${d.skills.tools.map(esc).join(', ')}}` : ''}
    }}
 \\end{itemize}
\\end{document}`;
}

// ═══════════ TEMPLATE 2: Jitin Nair ═══════════
export function t2_jitin(d) {
  const exp = (d.experience || []).filter(e => e.title || e.company).map(e => `
\\begin{joblong}{${esc(e.title)} -- ${esc(e.company)}}{${esc(e.duration)}}
${(e.bullets || []).map(b => `\\item ${esc(b)}`).join('\n')}
\\end{joblong}`).join('\n');

  const proj = (d.projects || []).filter(p => p.name).map(p => `
\\begin{tabularx}{\\linewidth}{ @{}l r@{} }
\\textbf{${esc(p.name)}} ${p.techStack ? `\\hfill \\small{${esc(p.techStack)}}` : ''} \\\\[3.75pt]
\\multicolumn{2}{@{}X@{}}{${(p.bullets || []).map(esc).join('. ')}}  \\\\
\\end{tabularx}`).join('\n');

  const eduLines = Array.isArray(d.education) ? d.education.map(e =>
    `${esc(e.dates || '')} & ${esc(e.degree || '')} at \\textbf{${esc(e.school || '')}} \\hfill \\\\`
  ).join('\n') : esc(eduString(d.education));

  return `\\documentclass[a4paper,12pt]{article}
\\usepackage{url}
\\usepackage{parskip}
\\RequirePackage{color}
\\RequirePackage{graphicx}
\\usepackage[usenames,dvipsnames]{xcolor}
\\usepackage[scale=0.9]{geometry}
\\usepackage{tabularx}
\\usepackage{enumitem}
\\newcolumntype{C}{>{\\centering\\arraybackslash}X}
\\usepackage{supertabular}
\\newlength{\\fullcollw}
\\setlength{\\fullcollw}{0.47\\textwidth}
\\usepackage{titlesec}
\\usepackage{multicol}
\\usepackage{multirow}
\\titleformat{\\section}{\\Large\\scshape\\raggedright}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{10pt}
\\usepackage[unicode, draft=false]{hyperref}
\\definecolor{linkcolour}{rgb}{0,0.2,0.6}
\\hypersetup{colorlinks,breaklinks,urlcolor=linkcolour,linkcolor=linkcolour}
\\usepackage{fontawesome5}
\\newenvironment{jobshort}[2]{\\begin{tabularx}{\\linewidth}{@{}l X r@{}}\\textbf{#1} & \\hfill & #2 \\\\[3.75pt]\\end{tabularx}}{}
\\newenvironment{joblong}[2]{\\begin{tabularx}{\\linewidth}{@{}l X r@{}}\\textbf{#1} & \\hfill & #2 \\\\[3.75pt]\\end{tabularx}\\begin{minipage}[t]{\\linewidth}\\begin{itemize}[nosep,after=\\strut, leftmargin=1em, itemsep=3pt,label=--]}
{\\end{itemize}\\end{minipage}}
\\begin{document}
\\pagestyle{empty}
\\begin{tabularx}{\\linewidth}{@{} C @{}}
\\Huge{${esc(d.name)}} \\\\[7.5pt]
${d.github ? `\\href{https://github.com/${esc(d.github)}}{\\raisebox{-0.05\\height}\\faGithub\\ ${esc(d.github)}} \\ $|$ \\` : ''}
${d.linkedin ? `\\href{https://${esc(d.linkedin)}}{\\raisebox{-0.05\\height}\\faLinkedin\\ ${esc(d.linkedin)}} \\ $|$ \\` : ''}
${d.email ? `\\href{mailto:${esc(d.email)}}{\\raisebox{-0.05\\height}\\faEnvelope \\ ${esc(d.email)}} \\ $|$ \\` : ''}
${d.phone ? `\\href{tel:${esc(d.phone)}}{\\raisebox{-0.05\\height}\\faMobile \\ ${esc(d.phone)}}` : ''} \\\\
\\end{tabularx}
${d.summary ? `\\section{Summary}\n\\small{${esc(d.summary)}}\n` : ''}
\\section{Work Experience}
${exp}
\\section{Projects}
${proj}
\\section{Education}
\\begin{tabularx}{\\linewidth}{@{}l X@{}}
${eduLines}
\\end{tabularx}
\\section{Skills}
\\begin{tabularx}{\\linewidth}{@{}l X@{}}
${d.skills?.technical?.length ? `Technical Skills & \\normalsize{${d.skills.technical.map(esc).join(', ')}}\\\\` : ''}
${d.skills?.tools?.length ? `Tools & \\normalsize{${d.skills.tools.map(esc).join(', ')}}\\\\` : ''}
${d.skills?.soft?.length ? `Soft Skills & \\normalsize{${d.skills.soft.map(esc).join(', ')}}\\\\` : ''}
\\end{tabularx}
\\end{document}`;
}

// ═══════════ TEMPLATE 3: Anubhav Singh ═══════════
export function t3_anubhav(d) {
  const exp = (d.experience || []).filter(e => e.title || e.company).map(e => `
    \\resumeSubheading{${esc(e.company)}}{${esc(e.location || '')}}
    {${esc(e.title)}}{${esc(e.duration)}}
    \\resumeItemListStart
${(e.bullets || []).map(b => `        \\resumeItem{${esc(b.split(':')[0] || '')}}{${esc(b.includes(':') ? b.split(':').slice(1).join(':') : b)}}`).join('\n')}
    \\resumeItemListEnd`).join('\n\\vspace{-5pt}\n');

  const proj = (d.projects || []).filter(p => p.name).map(p =>
    `\\resumeSubItem{${esc(p.name)}${p.techStack ? ` (${esc(p.techStack)})` : ''}}{${(p.bullets || []).map(esc).join(' ')}}`
  ).join('\n\\vspace{2pt}\n');

  return `\\documentclass[a4paper,20pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[pdftex]{hyperref}
\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.530in}
\\addtolength{\\evensidemargin}{-0.375in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.45in}
\\addtolength{\\textheight}{1in}
\\urlstyle{rm}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{\\vspace{-10pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule \\vspace{-6pt}]
\\newcommand{\\resumeItem}[2]{\\item\\small{\\textbf{#1}{: #2 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{\\vspace{-1pt}\\item\\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}\\textbf{#1} & #2 \\\\ \\textit{#3} & \\textit{#4} \\\\\\end{tabular*}\\vspace{-5pt}}
\\newcommand{\\resumeSubItem}[2]{\\resumeItem{#1}{#2}\\vspace{-3pt}}
\\renewcommand{\\labelitemii}{$\\circ$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=*]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}
\\begin{document}
\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
  \\textbf{{\\LARGE ${esc(d.name)}}} & Email: \\href{mailto:${esc(d.email)}}{${esc(d.email)}}\\\\
  ${d.portfolio ? `\\href{${esc(d.portfolio)}}{Portfolio: ${esc(d.portfolio)}}` : ''} & Mobile:~~~${esc(d.phone)} \\\\
  ${d.github ? `\\href{https://github.com/${esc(d.github)}}{Github: ~~github.com/${esc(d.github)}}` : ''} \\\\
\\end{tabular*}
\\section{~~Education}
  \\resumeSubHeadingListStart
    ${eduBlock(d.education)}
  \\resumeSubHeadingListEnd
\\vspace{-5pt}
\\section{Skills Summary}
  \\resumeSubHeadingListStart
  ${d.skills?.technical?.length ? `\\resumeSubItem{Languages}{${d.skills.technical.map(esc).join(', ')}}` : ''}
  ${d.skills?.tools?.length ? `\\resumeSubItem{Tools}{${d.skills.tools.map(esc).join(', ')}}` : ''}
  ${d.skills?.soft?.length ? `\\resumeSubItem{Soft Skills}{${d.skills.soft.map(esc).join(', ')}}` : ''}
  \\resumeSubHeadingListEnd
\\vspace{-5pt}
\\section{Experience}
  \\resumeSubHeadingListStart
${exp}
  \\resumeSubHeadingListEnd
\\vspace{-5pt}
\\section{Projects}
\\resumeSubHeadingListStart
${proj}
\\resumeSubHeadingListEnd
\\end{document}`;
}

// ═══════════ TEMPLATE 4: Rezume (Nanu) ═══════════
export function t4_rezume(d) {
  const exp = (d.experience || []).filter(e => e.title || e.company).map(e => `
  \\resumeQuadHeading{${esc(e.title)}}{${esc(e.duration)}}
  {${esc(e.company)}}{${esc(e.location || '')}}
    \\resumeItemListStart{}
${(e.bullets || []).map(b => `      \\resumeItem{${esc(b)}}`).join('\n')}
    \\resumeItemListEnd{}`).join('\n\n');

  const proj = (d.projects || []).filter(p => p.name).map(p => `
    \\resumeTrioHeading{${esc(p.name)}}{${esc(p.techStack || '')}}{}
      \\resumeItemListStart{}
${(p.bullets || []).map(b => `        \\resumeItem{${esc(b)}}`).join('\n')}
      \\resumeItemListEnd{}`).join('\n');

  return `\\documentclass[a4paper,11pt]{article}
\\usepackage{verbatim}
\\usepackage{titlesec}
\\usepackage{color}
\\usepackage{enumitem}
\\usepackage{fancyhdr}
\\usepackage{tabularx}
\\usepackage{latexsym}
\\usepackage{marvosym}
\\usepackage[empty]{fullpage}
\\usepackage[hidelinks]{hyperref}
\\usepackage[normalem]{ulem}
\\usepackage[english]{babel}
\\input glyphtounicode
\\pdfgentounicode=1
\\usepackage[default]{sourcesanspro}
\\urlstyle{same}
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0in}
\\renewcommand{\\footrulewidth}{0in}
\\setlength{\\tabcolsep}{0in}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\topmargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\textheight}{1.0in}
\\raggedbottom{}
\\raggedright{}
\\titleformat{\\section}{\\scshape\\large}{}{0em}{\\color{blue}}[\\color{black}\\titlerule\\vspace{0pt}]
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\renewcommand{\\ULdepth}{2pt}
\\newcommand{\\resumeItem}[1]{\\item\\small{#1}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}[rightmargin=0.11in]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}}
\\newcommand{\\resumeSectionType}[3]{\\item\\begin{tabular*}{0.96\\textwidth}[t]{p{0.15\\linewidth}p{0.02\\linewidth}p{0.81\\linewidth}}\\textbf{#1} & #2 & #3\\end{tabular*}\\vspace{-2pt}}
\\newcommand{\\resumeTrioHeading}[3]{\\item\\small{\\begin{tabular*}{0.96\\textwidth}[t]{l@{\\extracolsep{\\fill}}c@{\\extracolsep{\\fill}}r}\\textbf{#1} & \\textit{#2} & #3\\end{tabular*}}}
\\newcommand{\\resumeQuadHeading}[4]{\\item\\begin{tabular*}{0.96\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\\textbf{#1} & #2 \\\\ \\textit{\\small#3} & \\textit{\\small #4} \\\\\\end{tabular*}}
\\newcommand{\\resumeHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeHeadingListEnd}{\\end{itemize}}
\\begin{document}
\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
  \\textbf{\\Huge ${esc(d.name)} \\vspace{2pt}} &
  Location: ${esc(d.location || '')} \\\\
  ${d.portfolio ? `\\href{${esc(d.portfolio)}}{\\uline{Portfolio}}` : ''} $|$
  ${d.linkedin ? `\\href{https://${esc(d.linkedin)}}{\\uline{LinkedIn}}` : ''} $|$
  ${d.github ? `\\href{https://github.com/${esc(d.github)}}{\\uline{GitHub}}` : ''} &
  Email: \\href{mailto:${esc(d.email)}}{\\uline{${esc(d.email)}}} $|$
  Mobile: ${esc(d.phone)} \\\\
\\end{tabular*}
${d.summary ? `\\section{${esc(d.experience?.[0]?.title || 'Professional Summary')}}\n\\small{${esc(d.summary)}}\n` : ''}
\\section{Technical Skills}
  \\resumeHeadingListStart{}
    ${d.skills?.technical?.length ? `\\resumeSectionType{Languages}{:}{${d.skills.technical.map(esc).join(', ')}}` : ''}
    ${d.skills?.tools?.length ? `\\resumeSectionType{Tools}{:}{${d.skills.tools.map(esc).join(', ')}}` : ''}
    ${d.skills?.soft?.length ? `\\resumeSectionType{Soft Skills}{:}{${d.skills.soft.map(esc).join(', ')}}` : ''}
  \\resumeHeadingListEnd{}
\\section{Experience}
\\resumeHeadingListStart{}
${exp}
\\resumeHeadingListEnd{}
\\section{Education}
  \\resumeHeadingListStart{}
    ${Array.isArray(d.education) ? d.education.map(e => `\\resumeQuadHeading{${esc(e.school || '')}}{${esc(e.location || '')}}{${esc(e.degree || '')}}{${esc(e.dates || '')}}`).join('\n    ') : `\\resumeQuadHeading{${esc(eduString(d.education))}}{}{}{}`}
  \\resumeHeadingListEnd{}
\\section{Projects}
  \\resumeHeadingListStart{}
${proj}
  \\resumeHeadingListEnd{}
\\end{document}`;
}

// ═══════════ TEMPLATE 5: Times Serif ═══════════
export function t5_timesserif(d) {
  const exp = (d.experience || []).filter(e => e.title || e.company).map(e => `
\\textBF{${esc(e.title)}} --- ${esc(e.company)} \\hfill ${esc(e.duration)}

${(e.bullets || []).map(b => esc(b)).join('. ')}`).join('\n\n');

  return `\\documentclass[a4paper,11pt]{article}
\\usepackage[bottom=0.8in,top=0.8in, left=0.8in,right=0.8in]{geometry}
\\pagestyle{empty}
\\usepackage[T1]{fontenc}
\\usepackage{newtxmath,newtxtext}
\\usepackage{parskip}
\\usepackage{titlesec}
\\usepackage{multirow}
\\usepackage{graphicx}
\\usepackage[usenames,dvipsnames]{xcolor}
\\usepackage{hyperref}
\\definecolor{linkcolour}{rgb}{0,0.2,0.6}
\\hypersetup{colorlinks,breaklinks,urlcolor={linkcolour!90}, linkcolor={linkcolour!90}}
\\linespread{1.1}
\\titleformat{\\section}{\\color{black} \\large}{}{0em}{}[\\color{black}]
\\titlespacing{\\section}{0pt}{3pt}{3pt}
\\newcommand{\\sectitle}[1]{\\vspace{1.5ex}\\section{#1}\\vspace{-3ex}\\noindent\\rule{\\textwidth}{0.7pt}\\vspace{-4ex}}
\\newsavebox\\CBox
\\def\\textBF#1{\\sbox\\CBox{#1}\\resizebox{\\wd\\CBox}{\\ht\\CBox}{\\textcolor{linkcolour}{{#1}}}}
\\parindent=0pt
\\begin{document}
\\begin{minipage}{\\textwidth}
    \\vspace{7ex}
        \\par{\\centering\\vspace{-0.9in}\\textcolor{linkcolour}{\\Large ${esc(d.name)}}\\par}
\\end{minipage}
\\begin{center}
    ${esc(d.location || '')} \\,$\\cdot$\\, \\href{mailto:${esc(d.email)}}{${esc(d.email)}} ${d.portfolio ? `\\,$\\cdot$\\, \\href{${esc(d.portfolio)}}{${esc(d.portfolio)}}` : ''} ${d.phone ? `\\,$\\cdot$\\, ${esc(d.phone)}` : ''}
\\end{center}
${d.summary ? esc(d.summary) : ''}
\\sectitle{Technical Skills}
${d.skills?.technical?.length ? `\\textBF{Programming} --- ${d.skills.technical.map(esc).join(', ')}` : ''}
${d.skills?.tools?.length ? `\n\\textBF{Tools} --- ${d.skills.tools.map(esc).join(', ')}` : ''}
${d.skills?.soft?.length ? `\\sectitle{Core Competencies}\n${d.skills.soft.map(s => `\\textBF{${esc(s)}}`).join(' --- ')}` : ''}
\\sectitle{Experience}
${exp}
\\sectitle{Projects}
${(d.projects || []).filter(p => p.name).map(p => `\\textBF{${esc(p.name)}} ${p.techStack ? `(${esc(p.techStack)})` : ''}\n\n${(p.bullets || []).map(esc).join('. ')}`).join('\n\n')}
\\sectitle{Education}
${Array.isArray(d.education) ? d.education.map(e => `\\textBF{${esc(e.degree || '')}} -- ${esc(e.school || '')} \\hfill ${esc(e.dates || '')}`).join('\n\n') : esc(eduString(d.education))}
\\end{document}`;
}
