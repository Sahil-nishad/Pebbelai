'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import type { ApplicationSource, ApplicationStatus } from '@/types'

interface AddAppModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: AppFormData) => void
  loading?: boolean
}

export interface AppFormData {
  company_name: string
  role_title: string
  job_url: string
  job_description: string
  location: string
  salary_min: string
  salary_max: string
  source: ApplicationSource
  status: ApplicationStatus
  applied_date: string
  excitement_level: number
  next_action: string
  next_action_date: string
  notes: string
}

const sources: { value: ApplicationSource; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'referral', label: 'Referral' },
  { value: 'company_site', label: 'Company Site' },
  { value: 'cold', label: 'Cold Outreach' },
  { value: 'other', label: 'Other' },
]

const statusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: 'applied', label: 'Applied' },
  { value: 'phone_screen', label: 'Phone Screening' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'ghosted', label: 'Ghosted' },
]

export function AddAppModal({ open, onClose, onSave, loading }: AddAppModalProps) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<AppFormData>({
    company_name: '',
    role_title: '',
    job_url: '',
    job_description: '',
    location: '',
    salary_min: '',
    salary_max: '',
    source: 'linkedin',
    status: 'applied',
    applied_date: new Date().toISOString().split('T')[0],
    excitement_level: 3,
    next_action: '',
    next_action_date: '',
    notes: '',
  })

  const update = (field: keyof AppFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Application" size="lg" centered>
      <div className="p-6 space-y-6">
        {/* Step indicators */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 h-1.5 rounded-full transition-colors cursor-pointer ${s <= step ? 'bg-emerald-500' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Job Info</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input id="company" label="Company Name *" placeholder="Google" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Input id="role" label="Role Title *" placeholder="Senior Product Manager" value={form.role_title} onChange={(e) => update('role_title', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Input id="url" label="Job URL" placeholder="https://..." value={form.job_url} onChange={(e) => update('job_url', e.target.value)} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Job Description</label>
                <textarea
                  rows={5}
                  placeholder="Paste the job description here..."
                  value={form.job_description}
                  onChange={(e) => update('job_description', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input id="location" label="Location" placeholder="San Francisco, CA" value={form.location} onChange={(e) => update('location', e.target.value)} />
              </div>
              <Input id="salaryMin" label="Salary Min" type="number" placeholder="100000" value={form.salary_min} onChange={(e) => update('salary_min', e.target.value)} />
              <Input id="salaryMax" label="Salary Max" type="number" placeholder="150000" value={form.salary_max} onChange={(e) => update('salary_max', e.target.value)} />
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Source</label>
                <select
                  value={form.source}
                  onChange={(e) => update('source', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  {sources.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Current Status / Phase</label>
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value as ApplicationStatus)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <Input id="appliedDate" label="Applied Date" type="date" value={form.applied_date} onChange={(e) => update('applied_date', e.target.value)} />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Excitement Level</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => update('excitement_level', n)} className="cursor-pointer">
                      <Star className={`w-6 h-6 ${n <= form.excitement_level ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Next Steps</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input id="nextAction" label="Next Action" placeholder="Send portfolio, Prepare for phone screen" value={form.next_action} onChange={(e) => update('next_action', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Input id="nextDate" label="Next Action Date" type="date" value={form.next_action_date} onChange={(e) => update('next_action_date', e.target.value)} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  rows={5}
                  placeholder="Any initial notes..."
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button onClick={handleSave} loading={loading} disabled={!form.company_name || !form.role_title}>
              Save Application
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
