'use client'

import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full h-10 px-3.5 rounded-[10px] border border-slate-200 bg-white text-[13px] text-slate-900',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-300',
            'transition-all duration-150',
            'shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
            error && 'border-red-300 focus:ring-red-500/15 focus:border-red-400',
            props.disabled && 'bg-slate-50 text-slate-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-0.5 text-[12px] text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
