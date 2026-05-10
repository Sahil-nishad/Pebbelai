import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireAuth, unauthorized } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Save file to disk
  const uploadDir = join(process.cwd(), 'uploads', 'resumes')
  await mkdir(uploadDir, { recursive: true })

  const filename = `${randomUUID()}-${file.name}`
  const filePath = join(uploadDir, filename)
  await writeFile(filePath, buffer)

  // Create resume entry on backend
  const response = await fetch(`${BACKEND_URL}/careers/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': auth.user.id,
    },
    body: JSON.stringify({
      filename,
      original_name: file.name,
      file_path: filePath,
      file_size: buffer.length,
      mime_type: file.type,
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to create resume' }, { status: 500 })
  }

  const resume = await response.json()
  return NextResponse.json(resume, { status: 201 })
}