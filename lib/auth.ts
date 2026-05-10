import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getSupabaseServer } from './supabase'

export async function requireAuth(req?: NextRequest) {
  // ── Chrome extension: Authorization: Bearer <nextauth-jwt> ──────────────────
  if (req) {
    const authHeader = req.headers.get('authorization') || ''
    if (authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.slice(7).trim()
      if (bearerToken) {
        try {
          // Spoof the bearer token as the NextAuth session cookie so getToken can decrypt it
          // Use __Secure- prefix (production default) and plain name as fallback
          const cookieName = process.env.NODE_ENV === 'production'
            ? `__Secure-next-auth.session-token`
            : `next-auth.session-token`
          const cookieReq = new NextRequest('https://pebelai.com/', {
            headers: { cookie: `${cookieName}=${bearerToken}` },
          })
          const decoded = await getToken({
            req: cookieReq,
            secret: process.env.NEXTAUTH_SECRET!,
            // Must match the cookie name we set above — __Secure- prefix in production
            secureCookie: process.env.NODE_ENV === 'production',
          })
          if (decoded?.dbId) {
            const supabase = getSupabaseServer()
            return {
              user: {
                id: decoded.dbId as string,
                email: (decoded.email as string) || '',
              },
              supabase,
            }
          }
        } catch (_) {
          // Invalid token — fall through
        }
      }
    }

    // ── Normal web session: read JWT directly from the request cookies ──────────
    // Do NOT specify cookieName — let getToken auto-detect based on HTTPS/HTTP:
    //   production (HTTPS) → __Secure-next-auth.session-token
    //   development (HTTP) → next-auth.session-token
    // This must match whatever NextAuth sets (no custom cookies override in nextauth.ts).
    try {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET!,
        // Explicitly declare secure cookie mode so this works even if NEXTAUTH_URL
        // is not set in the Vercel env — production is always HTTPS
        secureCookie: process.env.NODE_ENV === 'production',
      })
      if (token?.dbId) {
        const supabase = getSupabaseServer()
        return {
          user: {
            id: token.dbId as string,
            email: (token.email as string) || '',
          },
          supabase,
        }
      }
    } catch (_) {
      // Token decode failed — fall through to null
    }
  }

  return null
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
