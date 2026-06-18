import type { DashboardStats } from '@/types'

interface StatsBarProps {
  stats: DashboardStats
}

export function StatsBar({ stats }: StatsBarProps) {
  const responseRate = stats.totalInvited > 0
    ? Math.round((stats.totalResponses / stats.totalInvited) * 100)
    : 0

  return (
    <div className="flex flex-col gap-3">
      {/* Résumé haut */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          {stats.totalInvited} invité{stats.totalInvited !== 1 ? 's' : ''}
        </span>
        <span style={{ color: 'var(--color-border-strong)' }}>·</span>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {stats.totalResponses} réponse{stats.totalResponses !== 1 ? 's' : ''}
          {stats.totalInvited > 0 && (
            <span className="ml-1" style={{ color: 'var(--color-text-faint)' }}>
              ({responseRate}%)
            </span>
          )}
        </span>
        {stats.totalHeadcount > stats.attending && (
          <>
            <span style={{ color: 'var(--color-border-strong)' }}>·</span>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {stats.totalHeadcount} personnes au total
            </span>
          </>
        )}
      </div>

      {/* Cards Oui / Non / Peut-être / En attente */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ResponseCard
          value={stats.attending}
          label="Oui"
          sub={stats.totalHeadcount > stats.attending ? `${stats.totalHeadcount} avec accompagnants` : undefined}
          emphasis
        />
        <ResponseCard
          value={stats.notAttending}
          label="Non"
        />
        <ResponseCard
          value={stats.maybe}
          label="Peut-être"
        />
        <ResponseCard
          value={stats.pending}
          label="En attente"
          muted
        />
      </div>
    </div>
  )
}

function ResponseCard({
  value,
  label,
  sub,
  emphasis,
  muted,
}: {
  value: number
  label: string
  sub?: string
  emphasis?: boolean
  muted?: boolean
}) {
  return (
    <div
      className="rounded-[var(--radius-lg)] border px-4 py-3.5"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface-elevated)',
      }}
    >
      <p
        className="text-3xl font-semibold tabular tracking-tight leading-none"
        style={{
          color: emphasis
            ? 'var(--color-text)'
            : muted
            ? 'var(--color-text-faint)'
            : 'var(--color-text-muted)',
        }}
      >
        {value}
      </p>
      <p
        className="mt-2 text-xs font-medium"
        style={{ color: muted ? 'var(--color-text-faint)' : 'var(--color-text-muted)' }}
      >
        {label}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-faint)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
