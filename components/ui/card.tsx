import { cn } from '@/utils/cn'

interface CardProps {
  className?: string
  children: React.ReactNode
  elevated?: boolean
}

export function Card({ className, children, elevated = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border overflow-hidden',
        elevated ? 'shadow-card' : '',
        className
      )}
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface-elevated)',
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn('px-5 py-3.5 border-b', className)}
      style={{ borderColor: 'var(--color-border)' }}
    >
      {children}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-5 py-4', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn('px-5 py-3.5 border-t rounded-b-[var(--radius-lg)]', className)}
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface-muted)',
      }}
    >
      {children}
    </div>
  )
}
