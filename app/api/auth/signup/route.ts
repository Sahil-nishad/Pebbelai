import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { getSupabaseServer } from '@/lib/supabase'
import { escapeHtml, getClientIp, hashToken, rateLimit, readJsonObject } from '@/lib/api-validation'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function buildVerificationHtml(firstName: string, verifyUrl: string) {
  const safe = (s: string) => escapeHtml(s)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:#0f172a;">PebelAI</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;text-align:center;">Welcome to PebelAI, ${safe(firstName)}!</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;text-align:center;">
                You're one step away from your job tracker.<br/>Activate your account using the button below.<br/>This link is valid for <strong style="color:#0f172a;">24 hours</strong>.
              </p>
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${safe(verifyUrl)}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;text-decoration:none;">
                  Activate my account
                </a>
              </div>
              <div style="border-top:1px solid #f1f5f9;margin:0 0 24px;"></div>
              <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
                If you didn't create this account, no action is needed — just ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">&copy; ${new Date().getFullYear()} PebelAI</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonObject(req)
  if (parsed.error) return parsed.error

  const name = typeof parsed.data.name === 'string' ? parsed.data.name.trim() : ''
  const email = typeof parsed.data.email === 'string' ? parsed.data.email.toLowerCase().trim() : ''
  const password = typeof parsed.data.password === 'string' ? parsed.data.password : ''

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  if (!rateLimit(`signup:${getClientIp(req)}:${email}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many signup attempts. Please try again later.' }, { status: 429 })
  }

  const supabase = getSupabaseServer()

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ email, name, password_hash })
    .select('id')
    .single()

  if (error || !newUser) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
  }

  // Create verification token (24h expiry)
  const token = crypto.randomBytes(32).toString('hex')
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('email_verification_tokens').insert({
    user_id: newUser.id,
    token: hashToken(token),
    expires_at,
  })

  // Send verification email (best-effort)
  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = process.env.SMTP_PASS?.trim()
  if (smtpUser && smtpPass) {
    const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`
    const firstName = name.split(' ')[0] || 'there'
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      })
      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL?.trim() || `"PebelAI" <${smtpUser}>`,
        replyTo: process.env.SMTP_FROM_EMAIL?.trim() || smtpUser,
        to: email,
        subject: `${firstName}, activate your PebelAI account`,
        headers: {
          'X-Mailer': 'PebelAI',
          Precedence: 'bulk',
          'List-Unsubscribe': `<mailto:${smtpUser}?subject=unsubscribe>`,
        },
        text: `Hi ${firstName},\n\nThanks for signing up for PebelAI — your job search tracker.\n\nClick the link below to activate your account (expires in 24 hours):\n\n${verifyUrl}\n\nIf you didn't create this account, you can safely ignore this email.\n\n— The PebelAI Team`,
        html: buildVerificationHtml(firstName, verifyUrl),
      })
    } catch (err) {
      console.error('[signup] Failed to send verification email:', err)
    }
  } else {
    console.warn('[signup] SMTP not configured — verification email not sent')
  }

  return NextResponse.json({ ok: true, needsVerification: true }, { status: 201 })
}
