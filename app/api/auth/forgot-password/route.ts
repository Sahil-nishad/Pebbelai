import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { getSupabaseServer } from '@/lib/supabase'
import { escapeHtml, getClientIp, hashToken, rateLimit, readJsonObject } from '@/lib/api-validation'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function buildHtml(firstName: string, resetUrl: string) {
  const safeFirstName = escapeHtml(firstName)
  const safeResetUrl = escapeHtml(resetUrl)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
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
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;text-align:center;">Reset your password</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;text-align:center;">
                Hi ${safeFirstName}, we received a request to reset your password.<br/>This link expires in <strong style="color:#0f172a;">1 hour</strong>.
              </p>
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${safeResetUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;text-decoration:none;">
                  Reset Password
                </a>
              </div>
              <div style="border-top:1px solid #f1f5f9;margin:0 0 24px;"></div>
              <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
                Didn't request this? You can safely ignore this email.
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
  const body = await readJsonObject(req)
  if (body.error) return body.error

  const email = typeof body.data.email === 'string' ? body.data.email.toLowerCase().trim() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const rateKey = `forgot-password:${getClientIp(req)}:${email}`
  if (!rateLimit(rateKey, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: true })
  }

  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = process.env.SMTP_PASS?.trim()
  if (!smtpUser || !smtpPass) {
    console.error('[forgot-password] SMTP not configured')
    return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 })
  }

  const supabase = getSupabaseServer()
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('email', email)
    .maybeSingle()

  if (userError) {
    console.error('[forgot-password] DB lookup error:', userError)
    return NextResponse.json({ ok: true })
  }

  if (!user) {
    return NextResponse.json({ ok: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expires_at = new Date(Date.now() + 1000 * 60 * 60).toISOString()
  const { error: tokenError } = await supabase.from('password_reset_tokens').insert({
    user_id: user.id,
    token: hashToken(token),
    expires_at,
  })

  if (tokenError) {
    console.error('[forgot-password] Token insert error:', tokenError)
    return NextResponse.json({ ok: true })
  }

  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  const firstName = user.name?.split(' ')[0] || 'there'
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL?.trim() || `"PebelAI" <${smtpUser}>`,
      to: user.email,
      subject: 'Reset your PebelAI password',
      text: `Hi ${firstName},\n\nReset your password here (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.\n\n- PebelAI`,
      html: buildHtml(firstName, resetUrl),
    })
    console.log('[forgot-password] Reset email sent | messageId:', info.messageId)
  } catch (err) {
    console.error('[forgot-password] Failed to send email:', err)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
