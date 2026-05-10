import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { path } = await params
  const userId = auth.user.id

  const response = await fetch(`${BACKEND_URL}/careers/${path.join('/')}?user_id=${userId}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
    },
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { path } = await params
  const userId = auth.user.id
  const body = await req.json()

  const response = await fetch(`${BACKEND_URL}/careers/${path.join('/')}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
    },
    body: JSON.stringify({ ...body, user_id: userId }),
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { path } = await params
  const userId = auth.user.id
  const body = await req.json()

  const response = await fetch(`${BACKEND_URL}/careers/${path.join('/')}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
    },
    body: JSON.stringify({ ...body, user_id: userId }),
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { path } = await params
  const userId = auth.user.id

  const response = await fetch(`${BACKEND_URL}/careers/${path.join('/')}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
    },
  })

  return new NextResponse(null, { status: response.status })
}