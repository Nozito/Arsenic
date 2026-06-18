import { cn } from '@/utils/cn'

interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-[var(--radius-xs)] border tracking-wide',
        variant === 'neutral' && 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border-[var(--color-border)]',
        variant === 'success' && 'bg-[var(--color-accent-muted)] text-[var(--color-accent)] border-[var(--color-accent)]/30',
        variant === 'warning' && 'bg-amber-50 text-amber-700 border-amber-200',
        variant === 'danger'  && 'bg-red-50 text-red-600 border-red-200',
        variant === 'info'    && 'bg-sky-50 text-sky-700 border-sky-200',
        className
      )}
    >
      {children}
    </span>
  )
}
