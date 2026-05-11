import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const BACKEND_URL = process.env.CAREERS_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(req, params.path.join('/'), 'GET')
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(req, params.path.join('/'), 'POST')
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(req, params.path.join('/'), 'PATCH')
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(req, params.path.join('/'), 'DELETE')
}

async function handleRequest(req: NextRequest, path: string, method: string) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const url = new URL(req.url)
  const backendUrl = `${BACKEND_URL}/careers/${path}${url.search}`

  let body = undefined
  if (['POST', 'PATCH', 'PUT'].includes(method)) {
    try {
      body = JSON.stringify(await req.json())
    } catch (e) {
      // Body might be empty or not JSON
    }
  }

  const response = await fetch(backendUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': auth.user.id,
      'X-Internal-Key': process.env.CAREERS_INTERNAL_API_KEY || '',
    },
    body,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    return NextResponse.json(error, { status: response.status })
  }

  const data = await response.json()
  return NextResponse.json(data)
}