import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, className, hover, glass, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white/90 text-slate-900',
        'shadow-[0_16px_34px_rgba(15,23,42,0.06)]',
        paddingStyles[padding],
        hover && 'transition-all duration-200 hover:-translate-y-px hover:shadow-[0_20px_42px_rgba(15,23,42,0.08)] hover:border-emerald-200',
        glass && 'glass',
        className
      )}
    >
      {children}
    </div>
  )
}
