'use client'

import { cn } from '@/utils/cn'

interface Option {
  value: string
  label: string
}

interface ToggleGroupProps {
  name: string
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  label?: string
  className?: string
}

export function ToggleGroup({ name, options, selected, onChange, label, className }: ToggleGroupProps) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              aria-pressed={active}
              className={cn(
                'tag-select',
                active && 'tag-select[aria-pressed="true"]'
              )}
              style={active ? {
                background: 'var(--color-accent-muted)',
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent)',
                fontWeight: '600',
              } : undefined}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </div>
  )
}
