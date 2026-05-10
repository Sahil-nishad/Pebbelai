// Client-only — only import dynamically from browser components
import { jsPDF } from 'jspdf'

export interface QAPair {
  question: string
  answer: string
  category?: string
}

const GREEN  = '#1e6b42'
const DARK   = '#1a2420'
const GRAY   = '#6b7472'
const LIGHT  = '#f0f4f2'

function addLogo(doc: jsPDF) {
  const stoneX = 20
  const topY   = 10

  // Top stone: light green (smallest)
  doc.setFillColor('#6db88a')
  doc.ellipse(stoneX, topY, 3.8, 1.8, 'F')

  // Middle stone: mid green
  doc.setFillColor('#2d8a52')
  doc.ellipse(stoneX, topY + 3.8, 5.8, 2.2, 'F')

  // Bottom stone: dark green (largest)
  doc.setFillColor('#1a6b3f')
  doc.ellipse(stoneX, topY + 8.2, 8, 2.8, 'F')

  // "PebelAi" text — vertically centered against stone stack
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(DARK)
  doc.text('PebelAi', 32, topY + 6)

  // Tagline — positioned below "PebelAi" with breathing room
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(GRAY)
  doc.text('Apply. Track. ', 32, topY + 10)
  const applyW = doc.getTextWidth('Apply. Track. ')
  doc.setTextColor(GREEN)
  doc.setFont('helvetica', 'bold')
  doc.text('Get Hired.', 32 + applyW, topY + 10)
}

function addHeaderBar(doc: jsPDF, title: string, subtitle: string) {
  const pageW = doc.internal.pageSize.getWidth()

  doc.setDrawColor(GREEN)
  doc.setLineWidth(0.4)
  doc.line(14, 26, pageW - 14, 26)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(DARK)
  doc.text(title, 14, 37)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(GRAY)
  doc.text(subtitle, 14, 44)
}

function addFooter(doc: jsPDF, pageNum: number, total: number) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  doc.setDrawColor('#e2e8e5')
  doc.setLineWidth(0.3)
  doc.line(14, pageH - 14, pageW - 14, pageH - 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor('#9aa8a4')
  doc.text('PebelAi — AI Job Tracker & Interview Coach  |  pebelai.com', 14, pageH - 9)
  doc.text(`Page ${pageNum} of ${total}`, pageW - 14, pageH - 9, { align: 'right' })
}

function wrapText(doc: jsPDF, text: string, x: number, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize)
  return doc.splitTextToSize(text, maxWidth)
}

export function downloadQAPdf(
  pairs: QAPair[],
  meta: { title: string; subtitle: string; filename: string }
) {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const marginL = 14
  const marginR = 14
  const textW   = pageW - marginL - marginR
  let y = 54

  // ── Page 1 header ──────────────────────────────────────────────────────────
  addLogo(doc)
  addHeaderBar(doc, meta.title, meta.subtitle)

  let pageNum = 1
  const estimatedTotal = Math.ceil(pairs.length / 2) + 1

  const Q_LINE_H = 5.5   // mm per line for bold 10pt question
  const A_LINE_H = 5.2   // mm per line for normal 9.5pt answer
  const BADGE_W  = 11    // badge width + gap before question text
  const qTextW   = textW - BADGE_W  // question wraps in remaining width

  pairs.forEach((pair, i) => {
    // Set correct font BEFORE splitTextToSize so metrics match render
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const qLines = doc.splitTextToSize(pair.question, qTextW)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    const aLines = doc.splitTextToSize(pair.answer, textW)

    const qH     = Math.max(10, qLines.length * Q_LINE_H + 4)
    const aH     = 5 + aLines.length * A_LINE_H + 4  // label(5) + lines + bottom gap
    const blockH = qH + aH + 8

    // Page break
    if (y + blockH > pageH - 20) {
      addFooter(doc, pageNum, estimatedTotal)
      doc.addPage()
      pageNum++
      addLogo(doc)
      doc.setDrawColor(GREEN)
      doc.setLineWidth(0.4)
      doc.line(marginL, 26, pageW - marginR, 26)
      y = 34
    }

    // Question number badge
    doc.setFillColor(GREEN)
    doc.roundedRect(marginL, y, 8, 5.5, 1.2, 1.2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor('#ffffff')
    doc.text(`Q${i + 1}`, marginL + 4, y + 3.8, { align: 'center' })

    // Question text — offset by BADGE_W so it stays within right margin
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(DARK)
    doc.text(qLines, marginL + BADGE_W, y + 4)
    y += qH

    // Answer label (no background box)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(GREEN)
    doc.text('IDEAL ANSWER', marginL, y + 4)

    // Answer text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor('#3d4442')
    doc.text(aLines, marginL, y + 9)
    y += aH

    // Divider
    if (i < pairs.length - 1) {
      doc.setDrawColor('#e2e8e5')
      doc.setLineWidth(0.2)
      doc.line(marginL, y + 2, pageW - marginR, y + 2)
      y += 8
    }
  })

  addFooter(doc, pageNum, pageNum)
  doc.save(meta.filename)
}


// ── Session PDF ─────────────────────────────────────────────────────────────
export function downloadSessionPdf(
  messages: { role: 'user' | 'assistant'; content: string }[],
  meta: { company: string; role: string; sessionType: string }
) {
  // Pair up: assistant (question) → user (answer)
  const pairs: QAPair[] = []
  const filtered = messages

  for (let i = 0; i < filtered.length - 1; i++) {
    const curr = filtered[i]
    const next = filtered[i + 1]
    if (curr.role === 'assistant' && next.role === 'user') {
      // Strip markdown/bullet formatting from content
      const cleanText = (t: string) => t.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^[-•*]\s+/gm, '').trim()
      pairs.push({
        question: cleanText(curr.content),
        answer:   cleanText(next.content),
        category: meta.sessionType,
      })
      i++ // skip the user message we just consumed
    }
  }

  if (pairs.length === 0) return false

  downloadQAPdf(pairs, {
    title:    `${meta.company} — ${meta.role || 'Interview'} Session`,
    subtitle: `${meta.sessionType.charAt(0).toUpperCase() + meta.sessionType.slice(1)} Interview · AI Coach Session Transcript`,
    filename: `pebelai-session-${meta.company.toLowerCase().replace(/\s+/g, '-')}.pdf`,
  })
  return true
}
