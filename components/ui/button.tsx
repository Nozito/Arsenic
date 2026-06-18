'use client'

import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'relative inline-flex items-center justify-center font-medium select-none',
          'transition-ui cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1',
          'disabled:pointer-events-none disabled:opacity-40',
          variant === 'primary' && [
            'bg-[var(--color-accent)] text-[var(--color-accent-fg)]',
            'hover:bg-[var(--color-accent-hover)] active:scale-[0.98]',
          ],
          variant === 'secondary' && [
            'bg-[var(--color-surface-muted)] text-[var(--color-text)] border border-[var(--color-border)]',
            'hover:bg-[var(--color-surface-muted)] hover:border-[var(--color-border-strong)] active:scale-[0.98]',
          ],
          variant === 'ghost' && [
            'text-[var(--color-text-muted)]',
            'hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] active:scale-[0.98]',
          ],
          variant === 'outline' && [
            'border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]',
            'hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] active:scale-[0.98]',
          ],
          variant === 'danger' && [
            'bg-red-600 text-white',
            'hover:bg-red-700 active:scale-[0.98]',
          ],
          size === 'sm' && 'h-8 px-3 text-xs rounded-[var(--radius-sm)] gap-1.5',
          size === 'md' && 'h-9 px-4 text-sm rounded-[var(--radius-md)] gap-2',
          size === 'lg' && 'h-11 px-6 text-sm rounded-[var(--radius-md)] gap-2',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-3.5 w-3.5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {children}
          </span>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
