// ─── Google Calendar URL ───────────────────────────────────────────────────

export function generateGoogleCalendarUrl({
  title,
  description,
  start,
  durationMinutes = 60,
  location,
}: {
  title: string
  description?: string
  start: Date
  durationMinutes?: number
  location?: string
}) {
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: description || '',
    ...(location ? { location } : {}),
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// ─── ICS / iCalendar ──────────────────────────────────────────────────────

export function generateICSContent({
  title,
  description,
  start,
  durationMinutes = 60,
  location,
  uid,
}: {
  title: string
  description?: string
  start: Date
  durationMinutes?: number
  location?: string
  uid?: string
}) {
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

  const eventUid = uid || `${Date.now()}-${Math.random().toString(36).slice(2)}@pebelai`

  // ICS spec: lines must be ≤ 75 chars, continuation lines start with a space
  const fold = (str: string) => {
    const chunks: string[] = []
    let remaining = str
    while (remaining.length > 75) {
      chunks.push(remaining.slice(0, 75))
      remaining = ' ' + remaining.slice(75)
    }
    chunks.push(remaining)
    return chunks.join('\r\n')
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PebelAI//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    fold(`SUMMARY:${title}`),
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `DTSTAMP:${fmt(new Date())}`,
    `UID:${eventUid}`,
    ...(description ? [fold(`DESCRIPTION:${description.replace(/\n/g, '\\n')}`)] : []),
    ...(location ? [fold(`LOCATION:${location}`)] : []),
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}
