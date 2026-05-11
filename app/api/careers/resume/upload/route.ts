import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireAuth, unauthorized } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const BACKEND_URL = process.env.CAREERS_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Forward to backend
  const backendFormData = new FormData()
  backendFormData.append('file', file)

  const response = await fetch(`${BACKEND_URL}/careers/resume/upload`, {
    method: 'POST',
    headers: {
      'X-User-ID': auth.user.id,
    },
    body: backendFormData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to upload resume' }))
    return NextResponse.json(error, { status: response.status })
  }

  const resume = await response.json()
  return NextResponse.json(resume, { status: 201 })
}