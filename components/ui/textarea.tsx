import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)] leading-none">
            {label}
            {props.required && (
              <span className="ml-1 text-[var(--color-text-faint)] font-normal" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 text-sm text-[var(--color-text)]',
            'rounded-[var(--radius-md)] border bg-[var(--color-surface-elevated)]',
            'placeholder:text-[var(--color-text-faint)] resize-none',
            'transition-ui leading-relaxed',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]',
            'disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:border-[var(--color-border)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 leading-snug" role="alert">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--color-text-faint)] leading-snug">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export { Textarea }
