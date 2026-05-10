'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'drawer'
  centered?: boolean
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-4xl',
  drawer: 'max-w-[480px] ml-auto h-full rounded-l-2xl rounded-r-none',
}

export function Modal({ open, onClose, children, title, className, size = 'md', centered = false }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
      <div className={cn(
      'fixed inset-0 z-50 flex justify-center overflow-y-auto p-4 sm:p-6',
      centered ? 'items-center' : 'items-start'
    )}>
      <div className="fixed inset-0 bg-slate-950/12 backdrop-blur-[8px]" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full bg-white text-slate-900 shadow-[0_24px_48px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.06)] max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]',
          size === 'drawer' ? 'fixed right-0 top-0 h-full animate-slide-in rounded-l-2xl' : centered ? 'animate-fade-up rounded-2xl' : 'animate-fade-up rounded-2xl',
          sizeStyles[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="font-[family-name:var(--font-heading)] text-[15px] font-semibold text-slate-900">{title}</h2>
            <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 -mr-1.5 transition-colors hover:bg-slate-100">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}
        <div className={cn(!title && 'pt-4', 'overflow-y-auto max-h-[calc(100dvh-8rem)]')}>{children}</div>
      </div>
    </div>,
    document.body
  )
}
