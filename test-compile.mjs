import fs from 'fs';
import { TEMPLATES as templates2, generateLatex as gen2 } from './src/latexTemplates2.js';
import path from 'path';

const dummyData = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  phone: "(555) 123-4567",
  location: "San Francisco, CA",
  linkedin: "linkedin.com/in/janedoe",
  github: "github.com/janedoe",
  summary: "Software Engineer with 4+ years of experience in building scalable web applications.",
  skills: {
    technical: ["JavaScript", "React", "Node.js", "Python", "SQL"]
  },
  experience: [
    {
      title: "Senior Developer",
      company: "Tech Corp",
      location: "San Francisco, CA",
      duration: "2020 - Present",
      bullets: ["Led a team of 5 engineers.", "Improved performance by 40%."]
    }
  ],
  education: [
    {
      degree: "B.S. in Computer Science",
      school: "Stanford University",
      dates: "2015 - 2019"
    }
  ],
  projects: [
    { name: "Website", techStack: "React", description: "Portfolio", bullets: ["Created portfolio"] }
  ]
};

async function testCompile() {
  const latexCode = gen2('harshibar', dummyData);
  
  const fd = new FormData();
  fd.append('filecontents[]', new Blob([latexCode], {type: 'text/plain'}), 'file.tex');
  fd.append('filename[]', 'file.tex');
  fd.append('engine', 'pdflatex');
  fd.append('return', 'pdf');

  console.log('Sending request to texlive.net...');
  const res = await fetch('https://texlive.net/cgi-bin/latexcgi', {
    method: 'POST',
    body: fd
  });

  if (res.ok) {
    const buf = await res.arrayBuffer();
    fs.writeFileSync('test.pdf', Buffer.from(buf));
    console.log('Saved test.pdf');
  } else {
    console.error('Failed:', res.status, res.statusText);
    const text = await res.text();
    console.error(text.slice(0, 500));
  }
}

testCompile().catch(console.error);
