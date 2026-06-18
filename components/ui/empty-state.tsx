interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed px-8 py-12 text-center"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface-elevated)',
      }}
    >
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
        {title}
      </p>
      {description && (
        <p className="text-xs max-w-xs leading-relaxed mb-4" style={{ color: 'var(--color-text-faint)' }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
