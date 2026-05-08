import { NextRequest, NextResponse } from 'next/server'

import { requireAuth, unauthorized } from '@/lib/auth'

const API_BASE = process.env.CAREERS_API_URL || 'http://localhost:8000'

async function proxy(request: NextRequest, params: { path: string[] }) {
  const auth = await requireAuth(request)
  if (!auth) return unauthorized()

  const target = `${API_BASE}/api/careers/${params.path.join('/')}${request.nextUrl.search}`
  const headers = new Headers()
  headers.set('x-pebel-user-id', auth.user.id)
  headers.set('x-pebel-user-email', auth.user.email)
  headers.set('x-internal-service-key', process.env.CAREERS_INTERNAL_API_KEY || 'change-me')

  const contentType = request.headers.get('content-type') || ''
  let body: BodyInit | undefined

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (contentType.includes('multipart/form-data')) {
      body = await request.formData()
    } else {
      body = await request.text()
      if (contentType) headers.set('content-type', contentType)
    }
  }

  const response = await fetch(target, {
    method: request.method,
    headers,
    body,
  })

  const text = await response.text()
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
    },
  })
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await context.params)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await context.params)
}
