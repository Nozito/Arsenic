import type { CategoryCoverage, DuplicateWarning } from '@/types'
import { Card, CardHeader, CardBody } from '@/components/ui/card'

interface ContributionsOverviewProps {
  coverage: CategoryCoverage[]
  duplicates: DuplicateWarning[]
}

export function ContributionsOverview({ coverage, duplicates }: ContributionsOverviewProps) {
  const maxCount = Math.max(...coverage.map((c) => c.count), 1)

  return (
    <div className="flex flex-col gap-4">
      {/* Couverture par catégorie */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Contributions
          </h3>
        </CardHeader>
        <CardBody className="py-3">
          <div className="flex flex-col gap-2.5">
            {coverage.map((cat) => {
              const pct = Math.round((cat.count / maxCount) * 100)
              const barColor =
                cat.count === 0 ? 'transparent'
                : cat.count < 2 ? '#d97706'
                : 'var(--color-accent)'
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-medium leading-none"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {cat.label}
                    </span>
                    <span
                      className="text-xs tabular"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      {cat.count}
                    </span>
                  </div>
                  <div
                    className="relative h-1 rounded-full overflow-hidden"
                    style={{ background: 'var(--color-surface-muted)' }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.count === 0 ? 0 : Math.max(pct, 8)}%`,
                        background: barColor,
                      }}
                    />
                  </div>
                  {cat.items.length > 0 && (
                    <p
                      className="mt-1 text-xs truncate leading-none"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      {cat.items.join(', ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* Doublons */}
      {duplicates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Doublons
              </h3>
            </div>
          </CardHeader>
          <CardBody className="py-3">
            <div className="flex flex-col gap-3">
              {duplicates.map((dup, i) => (
                <div key={i}>
                  <p
                    className="text-sm font-medium capitalize leading-snug"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {dup.name}
                  </p>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    {dup.contributors.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
