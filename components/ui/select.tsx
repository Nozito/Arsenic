import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, options, placeholder, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {label}
            {props.required && <span className="ml-1" style={{ color: 'var(--color-text-faint)' }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm transition-colors appearance-none outline-none',
            'focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-400 focus:ring-red-500',
            className
          )}
          style={{
            borderColor: error ? undefined : 'var(--color-border)',
            background: 'var(--color-surface-elevated)',
            color: 'var(--color-text)',
          }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export { Select }
