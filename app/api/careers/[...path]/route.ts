import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const BACKEND_URL = process.env.CAREERS_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return handleRequest(req, path.join('/'), 'GET')
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return handleRequest(req, path.join('/'), 'POST')
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return handleRequest(req, path.join('/'), 'PATCH')
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return handleRequest(req, path.join('/'), 'DELETE')
}

async function handleRequest(req: NextRequest, path: string, method: string) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const url = new URL(req.url)
  const backendUrl = `${BACKEND_URL}/careers/${path}${url.search}`

  let body = undefined
  if (['POST', 'PATCH', 'PUT'].includes(method)) {
    try {
      const contentType = req.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        body = JSON.stringify(await req.json())
      }
    } catch (e) {
      // Body might be empty or not JSON
    }
  }

  try {
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
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { error: `Backend returned ${response.status}: ${errorText.slice(0, 100)}` }
      }
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`[Careers Proxy Error]: ${error.message}`)
    return NextResponse.json(
      { 
        error: 'Proxy Connection Failed', 
        details: error.message,
        target: backendUrl 
      }, 
      { status: 502 }
    )
  }
}