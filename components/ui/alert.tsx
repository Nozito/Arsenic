import { cn } from '@/utils/cn'

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  className?: string
  children: React.ReactNode
}

export function Alert({ variant = 'info', title, className, children }: AlertProps) {
  const styles = {
    info:    { border: 'var(--color-border)', bg: 'var(--color-surface-muted)', text: 'var(--color-text-muted)' },
    success: { border: 'var(--color-accent)', bg: 'var(--color-accent-muted)',  text: 'var(--color-accent)' },
    warning: { border: '#fcd34d',              bg: '#fffbeb',                     text: '#92400e' },
    error:   { border: '#fca5a5',              bg: '#fef2f2',                     text: '#991b1b' },
  }[variant]

  return (
    <div
      role="alert"
      className={cn('rounded-[var(--radius-md)] border px-4 py-3 text-sm leading-relaxed', className)}
      style={{
        borderColor: styles.border,
        background:  styles.bg,
        color:       styles.text,
      }}
    >
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div>{children}</div>
    </div>
  )
}
