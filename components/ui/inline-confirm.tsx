'use client'

interface InlineConfirmProps {
  onConfirm: () => void
  onCancel: () => void
  message?: string
  confirmLabel?: string
  cancelLabel?: string
}

export function InlineConfirm({
  onConfirm,
  onCancel,
  message = 'Confirmer la suppression ?',
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
}: InlineConfirmProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {message}
      </span>
      <button
        type="button"
        onClick={onCancel}
        className="h-7 px-2.5 text-xs font-medium rounded-[var(--radius-sm)] border transition-ui"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface-elevated)',
          color: 'var(--color-text-muted)',
        }}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="h-7 px-2.5 text-xs font-medium rounded-[var(--radius-sm)] border border-red-200 bg-red-50 text-red-700 transition-ui hover:bg-red-100"
      >
        {confirmLabel}
      </button>
    </div>
  )
}
