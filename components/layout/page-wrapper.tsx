import { cn } from '@/utils/cn'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
  narrow?: boolean
}

export function PageWrapper({ children, className, narrow }: PageWrapperProps) {
  return (
    <main
      className={cn(
        'mx-auto w-full px-4 sm:px-6 py-8 sm:py-10',
        narrow ? 'max-w-xl' : 'max-w-5xl',
        className
      )}
    >
      {children}
    </main>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
  label?: string
}

export function PageHeader({ title, subtitle, actions, className, label }: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {label && (
            <p
              className="mb-1.5 text-xs font-medium tracking-[0.18em] uppercase"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {label}
            </p>
          )}
          <h1
            className="text-xl font-semibold tracking-tight leading-tight"
            style={{ color: 'var(--color-text)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-1.5 text-sm leading-relaxed max-w-prose"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  count?: number
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, count, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3 mb-3', className)}>
      <h2
        className="text-xs font-semibold uppercase tracking-[0.18em] flex items-center gap-2"
        style={{ color: 'var(--color-text-faint)' }}
      >
        {title}
        {count !== undefined && (
          <span
            className="font-normal normal-case tracking-normal tabular"
            style={{ color: 'var(--color-border-strong)' }}
          >
            {count}
          </span>
        )}
      </h2>
      {action && <div>{action}</div>}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-14 text-center', className)}>
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <svg
          className="h-4 w-4"
          style={{ color: 'var(--color-text-faint)' }}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.5 9h5M5.5 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>{title}</p>
      {description && (
        <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--color-text-faint)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
