'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Trash2, Send, CheckCircle2, Loader2,
  LogOut, Pencil, ChevronRight, Sparkles, BadgeCheck,
  User, Settings, Bell, ShieldAlert, Lock, KeyRound, Eye, EyeOff,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authFetch } from '@/lib/api'
import { useUser } from '@/hooks/useUser'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const navItems = [
  { key: 'profile',       label: 'Profile',       icon: User },
  { key: 'account',       label: 'Account',       icon: Settings },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security',      label: 'Security',      icon: ShieldAlert },
]

// ── Minimal profile field ────────────────────────────────────────────────────
function Field({
  label, value, onChange, disabled, type = 'text', placeholder, id,
}: {
  label: string; value: string; onChange?: (v: string) => void
  disabled?: boolean; type?: string; placeholder?: string; id?: string
}) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">{label}</p>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
        className={cn(
          'w-full text-[15px] text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-300',
          disabled && 'text-slate-400 cursor-not-allowed',
        )}
      />
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user, profile, signOut } = useUser()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const displayName  = profile?.name || user?.email?.split('@')[0] || 'User'
  const displayEmail = user?.email || ''
  const initials     = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  // ── Profile ──────────────────────────────────────────────────────────────
  const [name,     setName]     = useState('')
  const [phone,    setPhone]    = useState('')
  const [title,    setTitle]    = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [location, setLocation] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // original values for discard
  const [orig, setOrig] = useState({ name: '', phone: '', title: '', linkedin: '', location: '' })

  useEffect(() => {
    if (!profile) return
    const p = profile as unknown as Record<string, unknown>

    // Personal info
    const vals = {
      name:     (p.name     as string) || '',
      phone:    (p.phone    as string) || '',
      title:    (p.title    as string) || '',
      linkedin: (p.linkedin as string) || '',
      location: (p.location as string) || '',
    }
    setName(vals.name); setPhone(vals.phone); setTitle(vals.title)
    setLinkedin(vals.linkedin); setLocation(vals.location)
    setOrig(vals)

    // Preferences
    const roles = p.target_roles
    const companies = p.target_companies
    if (Array.isArray(roles))     setTargetRoles(roles.join(', '))
    if (Array.isArray(companies)) setTargetCompanies(companies.join(', '))
    if (p.job_type)         setJobTypes((p.job_type as string).split(',').filter(Boolean))
    if (p.experience_level) setExpLevel(p.experience_level as string)
    if (p.salary_min)       setSalaryMin(String(p.salary_min))
    if (p.salary_max)       setSalaryMax(String(p.salary_max))

    // Notifications
    if (p.email_digest)         setEmailDigest(p.email_digest as string)
    if (p.follow_up_days)       setFollowUpDays(p.follow_up_days as number)
    if (p.interview_prep_days)  setPrepDays(p.interview_prep_days as number)
  }, [profile])

  function discardChanges() {
    setName(orig.name); setPhone(orig.phone); setTitle(orig.title)
    setLinkedin(orig.linkedin); setLocation(orig.location)
  }

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const res = await authFetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, title, linkedin, location }),
      })
      if (res.status === 401) {
        toast.error('Session expired. Please sign in again.')
        return
      }
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error || 'Failed to save profile')
      }
      setOrig({ name, phone, title, linkedin, location })
      toast.success('Profile saved!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Career score ─────────────────────────────────────────────────────────
  const scored    = [name, phone, title, linkedin, location].filter(Boolean).length
  const scoreTotal = 5
  const scorePct  = Math.round((scored / scoreTotal) * 100)
  const missing   = [
    !title    && 'professional title',
    !linkedin && 'LinkedIn URL',
    !phone    && 'phone number',
    !location && 'location',
  ].filter(Boolean) as string[]

  // ── Account / Preferences ────────────────────────────────────────────────
  const [targetRoles,     setTargetRoles]     = useState('')
  const [targetCompanies, setTargetCompanies] = useState('')
  const [jobTypes,        setJobTypes]        = useState<string[]>([])
  const [expLevel,        setExpLevel]        = useState('')
  const [salaryMin,       setSalaryMin]       = useState('')
  const [salaryMax,       setSalaryMax]       = useState('')
  const [savingPrefs,     setSavingPrefs]     = useState(false)

  async function savePreferences() {
    setSavingPrefs(true)
    try {
      const res = await authFetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_roles:      targetRoles.split(',').map(s => s.trim()).filter(Boolean),
          target_companies:  targetCompanies.split(',').map(s => s.trim()).filter(Boolean),
          job_type:          jobTypes.join(',') || null,
          experience_level:  expLevel || null,
          salary_min:        salaryMin ? parseInt(salaryMin) : null,
          salary_max:        salaryMax ? parseInt(salaryMax) : null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Preferences saved!')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSavingPrefs(false)
    }
  }

  // ── Notifications ────────────────────────────────────────────────────────
  const [emailDigest,  setEmailDigest]  = useState('daily')
  const [followUpDays, setFollowUpDays] = useState(7)
  const [prepDays,     setPrepDays]     = useState(2)
  const [savingNotif,  setSavingNotif]  = useState(false)
  const [testEmailSent, setTestEmailSent] = useState(false)
  const [sendingTest,  setSendingTest]  = useState(false)

  async function saveNotificationSettings() {
    setSavingNotif(true)
    try {
      const res = await authFetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_digest: emailDigest, follow_up_days: followUpDays, interview_prep_days: prepDays }),
      })
      if (!res.ok) throw new Error()
      toast.success('Notification settings saved!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSavingNotif(false)
    }
  }

  async function sendTestEmail() {
    setSendingTest(true)
    try {
      const res = await authFetch('/api/email/test', { method: 'POST' })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error || 'Failed')
      }
      setTestEmailSent(true)
      toast.success('Test email sent!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test email')
    } finally {
      setSendingTest(false)
    }
  }

  // ── Security / Danger ────────────────────────────────────────────────────
  const [deletingApps,    setDeletingApps]    = useState(false)
  const [currentPw,       setCurrentPw]       = useState('')
  const [newPw,           setNewPw]           = useState('')
  const [confirmPw,       setConfirmPw]       = useState('')
  const [showCurrentPw,   setShowCurrentPw]   = useState(false)
  const [showNewPw,       setShowNewPw]       = useState(false)
  const [savingPw,        setSavingPw]        = useState(false)

  async function deleteAllApps() {
    if (!confirm('Delete ALL applications? This cannot be undone.')) return
    setDeletingApps(true)
    try {
      const res = await authFetch('/api/settings/delete-apps', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('All applications deleted')
    } catch { toast.error('Failed to delete applications') } finally { setDeletingApps(false) }
  }

  async function changePassword() {
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSavingPw(true)
    try {
      const res = await authFetch('/api/settings/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw || undefined, newPassword: newPw }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) throw new Error(d?.error || 'Failed')
      toast.success('Password updated!')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password')
    } finally { setSavingPw(false) }
  }

  function handleOptimizeNow() {
    const fieldMap: Record<string, string> = {
      'professional title': 'field-title',
      'LinkedIn URL': 'field-linkedin',
      'phone number': 'field-phone',
      'location': 'field-location',
    }
    if (missing.length > 0) {
      const el = document.getElementById(fieldMap[missing[0]]) as HTMLInputElement | null
      el?.focus()
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const toggleJobType = (type: string) =>
    setJobTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])

  // ── Mobile field row ──────────────────────────────────────────────────────
  function MobileField({ label, value, onChange, disabled, placeholder }: {
    label: string; value: string; onChange?: (v: string) => void
    disabled?: boolean; placeholder?: string
  }) {
    return (
      <div className="py-4 border-b border-slate-100 last:border-0">
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">{label}</p>
        <input
          value={value}
          placeholder={placeholder || '—'}
          disabled={disabled}
          onChange={e => onChange?.(e.target.value)}
          className={cn(
            'w-full text-[15px] font-medium bg-transparent focus:outline-none placeholder:text-slate-300',
            disabled ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900',
          )}
        />
      </div>
    )
  }

  return (
    <>
    {/* ════════════════════════════════════════════════════════════════
        MOBILE LAYOUT  (hidden on md+)
    ════════════════════════════════════════════════════════════════ */}
    <div className="md:hidden -mx-4 bg-white animate-fade-up">

      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-6 pb-5 border-b border-slate-100">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-2xl bg-[#13211B] flex items-center justify-center text-2xl font-black text-white select-none">
            {initials}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#0A6A47] rounded-lg flex items-center justify-center shadow-sm"
          >
            <Pencil className="w-3.5 h-3.5 text-white" />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" />
        </div>
        <h2 className="text-[18px] font-black text-slate-900">{displayName}</h2>
        {title && <p className="text-[12px] text-slate-500 mt-0.5">{title}</p>}
      </div>

      {/* Profile fields */}
      <div className="px-5">
        <MobileField label="Full Name"         value={name}        onChange={setName}     placeholder="Your full name" />
        <MobileField label="Email Address"     value={displayEmail} disabled />
        <MobileField label="Phone Number"      value={phone}       onChange={setPhone}    placeholder="+1 (555) 000-0000" />
        <MobileField label="Professional Title" value={title}      onChange={setTitle}    placeholder="e.g. Software Engineer" />
        <MobileField label="LinkedIn URL"      value={linkedin}    onChange={setLinkedin} placeholder="linkedin.com/in/you" />
        <MobileField label="Location"          value={location}    onChange={setLocation} placeholder="San Francisco, CA" />
      </div>

      {/* Security row */}
      {activeTab !== 'security' && (
      <div className="mx-5 mt-2 border-t border-slate-100">
        <button
          onClick={() => setActiveTab('security')}
          className="w-full flex items-center gap-3 py-4 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#0A6A47] flex items-center justify-center shrink-0">
            <Lock className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[14px] font-semibold text-slate-900">Security &amp; Password</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Manage account security settings</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
        </button>
      </div>
      )}

      {/* Mobile Security View */}
      {activeTab === 'security' && (
        <div className="px-5 mt-2">
          <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 text-[13px] text-slate-500 mb-5 mt-2">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back
          </button>

          <p className="text-[16px] font-bold text-slate-900 mb-4">Security &amp; Data</p>

          {/* Change Password mobile */}
          <div className="bg-white rounded-2xl p-4 mb-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-[#0A6A47]" />
              <p className="text-[14px] font-bold text-slate-900">Change Password</p>
            </div>
            <div className="space-y-2.5">
              <div className="relative">
                <input type={showCurrentPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#0A6A47] pr-9" />
                <button type="button" onClick={() => setShowCurrentPw(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="relative">
                <input type={showNewPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min. 8 chars)" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#0A6A47] pr-9" />
                <button type="button" onClick={() => setShowNewPw(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#0A6A47]" />
            </div>
            <button onClick={changePassword} disabled={!newPw || !confirmPw || savingPw} className="w-full mt-3 flex items-center justify-center gap-2 bg-[#0A6A47] text-white text-[13px] font-bold py-2.5 rounded-xl disabled:opacity-50">
              {savingPw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Update Password
            </button>
          </div>

          {/* Delete apps */}
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-bold text-red-600">Delete All Applications</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cannot be undone.</p>
            </div>
            <button
              onClick={deleteAllApps}
              disabled={deletingApps}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-[12px] font-semibold text-red-600 bg-white disabled:opacity-50"
            >
              {deletingApps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Sign out */}
      {activeTab !== 'security' && (
      <div className="mx-5 border-t border-slate-100">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 py-4 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span className="text-[14px] font-medium text-red-500">Sign out</span>
        </button>
      </div>
      )}

      {/* Save button — only on profile view */}
      {activeTab !== 'security' && (
      <div className="px-5 py-4 border-t border-slate-100">
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="w-full flex items-center justify-center gap-2 bg-[#0A6A47] hover:bg-[#085438] disabled:opacity-60 text-white text-[15px] font-bold py-4 rounded-2xl transition-colors cursor-pointer shadow-sm"
        >
          {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
      )}
    </div>

    {/* ════════════════════════════════════════════════════════════════
        DESKTOP LAYOUT  (hidden on mobile)
    ════════════════════════════════════════════════════════════════ */}
    <div className="hidden md:block max-w-5xl mx-auto animate-fade-up">

      {/* ── Top hero ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 mb-8">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-[#13211B] flex items-center justify-center text-2xl font-black text-white select-none">
            {initials}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#0A6A47] rounded-lg flex items-center justify-center shadow-sm hover:bg-[#085438] transition-colors"
            title="Change photo"
          >
            <Pencil className="w-3.5 h-3.5 text-white" />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold tracking-widest text-[#0A6A47] bg-[#E8F5EE] px-2.5 py-0.5 rounded-full uppercase">
              Pro Member
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{displayName}</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Managing your professional identity across the JobFlow ecosystem.</p>
        </div>
      </div>

      {/* ── 2-column layout ─────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ── Left sidebar ─────────────────────────────────────────── */}
        <div className="w-[220px] shrink-0 bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">Navigation</p>
          <nav className="space-y-0.5">
            {navItems.map(item => {
              const active = activeTab === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] transition-colors cursor-pointer',
                    active
                      ? 'font-bold text-slate-900 bg-slate-50'
                      : 'font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <span>{item.label}</span>
                  <ChevronRight className={cn('w-4 h-4 transition-colors', active ? 'text-slate-900' : 'text-slate-300')} />
                </button>
              )
            })}
          </nav>

          {/* Sign out */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>

        {/* ── Right content ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <>
              {/* Personal Information card */}
              <div className="bg-white rounded-2xl p-7 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-[17px] font-bold text-slate-900">Personal Information</h2>
                    <p className="text-[12px] text-slate-400 mt-0.5">Update your profile details to improve job recommendations.</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#E8F5EE] flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-5 h-5 text-[#0A6A47]" />
                  </div>
                </div>

                {/* Fields grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  {/* Row 1 */}
                  <div className="py-4 border-b border-slate-100">
                    <Field label="Full Name" value={name} onChange={setName} placeholder="Your full name" />
                  </div>
                  <div className="py-4 border-b border-slate-100">
                    <Field label="Email Address" value={displayEmail} disabled />
                  </div>
                  {/* Row 2 */}
                  <div className="py-4 border-b border-slate-100">
                    <Field id="field-phone" label="Phone Number" value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="py-4 border-b border-slate-100">
                    <Field id="field-title" label="Professional Title" value={title} onChange={setTitle} placeholder="e.g. Software Engineer" />
                  </div>
                  {/* Row 3 */}
                  <div className="py-4">
                    <Field id="field-linkedin" label="LinkedIn URL" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/you" />
                  </div>
                  <div className="py-4">
                    <Field id="field-location" label="Location" value={location} onChange={setLocation} placeholder="San Francisco, CA" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-slate-100">
                  <button
                    onClick={discardChanges}
                    className="text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-2 bg-[#0A6A47] hover:bg-[#085438] disabled:opacity-60 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Update Profile
                  </button>
                </div>
              </div>

              {/* Career Score Insight */}
              <div className="bg-white border border-[#0A6A47]/15 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#0A6A47]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-900">Career Score Insight</p>
                  <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                    Your profile is currently{' '}
                    <strong className="text-slate-900">{scorePct}% complete</strong>.{' '}
                    {missing.length > 0
                      ? `Adding your ${missing[0]} could increase your visibility to top-tier recruiters by up to 40%.`
                      : 'Your profile is fully optimised — great work!'}
                  </p>
                </div>
                <button
                  onClick={handleOptimizeNow}
                  className="shrink-0 bg-[#0A6A47] hover:bg-[#085438] text-white text-[12px] font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  Optimize Now
                </button>
              </div>
            </>
          )}

          {/* ── ACCOUNT TAB (Job Preferences) ── */}
          {activeTab === 'account' && (
            <div className="bg-white rounded-2xl p-7 shadow-sm">
              <h2 className="text-[17px] font-bold text-slate-900 mb-1">Job Preferences</h2>
              <p className="text-[12px] text-slate-400 mb-6">Used as context for AI Coach personalisation.</p>
              <div className="space-y-5">
                <Input id="targetRoles" label="Target Roles" placeholder="Product Manager, Software Engineer" value={targetRoles} onChange={e => setTargetRoles(e.target.value)} />
                <Input id="targetCompanies" label="Target Companies" placeholder="Google, Meta, Stripe" value={targetCompanies} onChange={e => setTargetCompanies(e.target.value)} />
                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-slate-600">Job Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['Full-time', 'Part-time', 'Contract', 'Remote only'].map(type => (
                      <button
                        key={type}
                        onClick={() => toggleJobType(type)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl border text-[12px] font-medium transition-all cursor-pointer',
                          jobTypes.includes(type)
                            ? 'border-[#0A6A47] bg-[#E8F5EE] text-[#0A6A47]'
                            : 'border-slate-200 text-slate-500 hover:border-[#0A6A47]/40',
                        )}
                      >{type}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-slate-600">Experience Level</label>
                  <div className="flex gap-2">
                    {['Entry', 'Mid', 'Senior', 'Executive'].map(level => (
                      <button
                        key={level}
                        onClick={() => setExpLevel(level)}
                        className={cn(
                          'flex-1 py-2 rounded-xl border text-[12px] font-medium transition-all cursor-pointer',
                          expLevel === level
                            ? 'border-[#0A6A47] bg-[#E8F5EE] text-[#0A6A47]'
                            : 'border-slate-200 text-slate-500 hover:border-[#0A6A47]/40',
                        )}
                      >{level}</button>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input id="salaryMin" label="Salary Min ($)" type="number" placeholder="100000" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} />
                  <Input id="salaryMax" label="Salary Max ($)" type="number" placeholder="200000" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={savePreferences}
                  disabled={savingPrefs}
                  className="flex items-center gap-2 bg-[#0A6A47] hover:bg-[#085438] text-white text-[13px] font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {savingPrefs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-7 shadow-sm space-y-6">
                <div>
                  <h2 className="text-[17px] font-bold text-slate-900 mb-1">Email Notifications</h2>
                  <p className="text-[12px] text-slate-400">Reminders and updates sent to your login email.</p>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-slate-600">Email Frequency</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { key: 'daily',   label: 'Daily',   desc: 'Morning digest' },
                      { key: 'weekly',  label: 'Weekly',  desc: 'Every Monday' },
                      { key: 'instant', label: 'Instant', desc: 'Per reminder' },
                      { key: 'never',   label: 'Never',   desc: 'No emails' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setEmailDigest(opt.key)}
                        className={cn(
                          'px-3 py-3 rounded-xl border text-left text-[12px] font-medium transition-all cursor-pointer',
                          emailDigest === opt.key
                            ? 'bg-[#0A6A47] text-white border-[#0A6A47]'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#0A6A47]/40',
                        )}
                      >
                        <div className="font-bold">{opt.label}</div>
                        <div className={cn('text-[10px] mt-0.5', emailDigest === opt.key ? 'text-emerald-200' : 'text-slate-400')}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {emailDigest !== 'never' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-semibold text-slate-600">Follow-up reminder after</label>
                      <div className="flex items-center gap-3">
                        <input type="range" min={3} max={14} value={followUpDays} onChange={e => setFollowUpDays(Number(e.target.value))} className="flex-1 accent-[#0A6A47]" />
                        <span className="text-[13px] font-semibold text-slate-900 w-16 text-right">{followUpDays} days</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Days after applying before we remind you to follow up.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-semibold text-slate-600">Interview prep reminder</label>
                      <div className="flex items-center gap-3">
                        <input type="range" min={1} max={7} value={prepDays} onChange={e => setPrepDays(Number(e.target.value))} className="flex-1 accent-[#0A6A47]" />
                        <span className="text-[13px] font-semibold text-slate-900 w-20 text-right">{prepDays} days before</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100">
                  <button
                    onClick={sendTestEmail}
                    disabled={sendingTest || emailDigest === 'never'}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    {testEmailSent
                      ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sent!</>
                      : <><Send className="w-3.5 h-3.5" /> {sendingTest ? 'Sending…' : 'Send test email'}</>}
                  </button>
                  <button
                    onClick={saveNotificationSettings}
                    disabled={savingNotif}
                    className="flex items-center gap-2 bg-[#0A6A47] hover:bg-[#085438] text-white text-[13px] font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    {savingNotif ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === 'security' && (
            <div className="space-y-4">

              {/* Change Password */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F5EE] flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4 text-[#0A6A47]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">Change Password</p>
                    <p className="text-[12px] text-slate-400">Leave current password blank if you signed in with Google.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPw}
                      onChange={e => setCurrentPw(e.target.value)}
                      placeholder="Current password"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 focus:outline-none focus:border-[#0A6A47] pr-10"
                    />
                    <button type="button" onClick={() => setShowCurrentPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      placeholder="New password (min. 8 characters)"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 focus:outline-none focus:border-[#0A6A47] pr-10"
                    />
                    <button type="button" onClick={() => setShowNewPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] text-slate-900 focus:outline-none focus:border-[#0A6A47]"
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={changePassword}
                    disabled={!newPw || !confirmPw || savingPw}
                    className="flex items-center gap-2 bg-[#0A6A47] hover:bg-[#085438] text-white text-[13px] font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {savingPw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                    Update Password
                  </button>
                </div>
              </div>

              {/* Delete apps */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-red-600">Delete All Applications</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">Permanently removes every application. Cannot be undone.</p>
                </div>
                <button
                  onClick={deleteAllApps}
                  disabled={deletingApps}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-[13px] font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deletingApps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
              </div>
            </div>
          )}

        </div>{/* end right content */}
      </div>{/* end 2-col */}
    </div>{/* end desktop */}
    </>
  )
}
