import type { ParticipantWithResponseAndContributions } from '@/types'
import { CONTRIBUTION_CATEGORIES } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'

interface ParticipantsListProps {
  participants: ParticipantWithResponseAndContributions[]
}

const STATUS_CONFIG = {
  attending:     { label: 'Présent',    variant: 'success'  as const },
  not_attending: { label: 'Absent',     variant: 'danger'   as const },
  maybe:         { label: 'Peut-être',  variant: 'warning'  as const },
  pending:       { label: 'En attente', variant: 'neutral'  as const },
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  if (participants.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-10 rounded-[var(--radius-lg)] border"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
          Aucun participant pour l'instant.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-[var(--radius-lg)] border overflow-hidden"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
    >
      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {participants.map((p, idx) => (
          <ParticipantRow key={p.id} participant={p} idx={idx} />
        ))}
      </div>
    </div>
  )
}

function ParticipantRow({
  participant: p,
  idx,
}: {
  participant: ParticipantWithResponseAndContributions
  idx: number
}) {
  const name = p.profile?.display_name ?? p.profile?.first_name ?? p.guest_name ?? 'Invité'
  const response = p.response
  const status = response?.status ?? 'pending'
  const config = STATUS_CONFIG[status]

  const allergens = response?.allergens ?? []
  const dietary  = response?.dietary_restrictions ?? []
  const contribs = p.contributions ?? []

  return (
    <div
      className={cn(
        'px-4 py-3 sm:px-5 transition-colors',
        idx === 0 && 'rounded-t-[var(--radius-lg)]'
      )}
      style={{ '--hover-bg': 'var(--color-surface-muted)' } as React.CSSProperties}
    >
      {/* Ligne principale */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold select-none"
          style={{
            background: 'var(--color-surface-muted)',
            color: 'var(--color-text-muted)',
          }}
          aria-hidden="true"
        >
          {name.charAt(0).toUpperCase()}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-medium truncate"
              style={{ color: 'var(--color-text)' }}
            >
              {name}
            </span>
            {response?.headcount && response.headcount > 1 && (
              <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                × {response.headcount}
              </span>
            )}
          </div>

          {contribs.length > 0 && (
            <p
              className="mt-0.5 text-xs truncate leading-snug"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {contribs.map((c) => {
                const catLabel = CONTRIBUTION_CATEGORIES.find((cat) => cat.value === c.category)?.label
                return `${c.name}${c.quantity ? ` (${c.quantity})` : ''}${catLabel ? ` — ${catLabel}` : ''}`
              }).join(' · ')}
            </p>
          )}
        </div>

        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      {(allergens.length > 0 || dietary.length > 0) && (
        <div className="mt-2 ml-10 flex flex-wrap gap-1">
          {allergens.map((a) => (
            <span
              key={a}
              className="text-xs px-1.5 py-0.5 rounded-[var(--radius-xs)] border"
              style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}
            >
              {a}
            </span>
          ))}
          {dietary.map((d) => (
            <span
              key={d}
              className="text-xs px-1.5 py-0.5 rounded-[var(--radius-xs)] border"
              style={{ background: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }}
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {response?.note && (
        <p
          className="mt-1.5 ml-10 text-xs italic leading-snug"
          style={{ color: 'var(--color-text-faint)' }}
        >
          &ldquo;{response.note}&rdquo;
        </p>
      )}
    </div>
  )
}
