import type { ReadinessScore, CategoryCoverage } from '@/types'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { cn } from '@/utils/cn'

interface ReadinessPanelProps {
  readiness: ReadinessScore
  coverage: CategoryCoverage[]
}

const READINESS_LABELS: Record<keyof Omit<ReadinessScore, 'overall'>, string> = {
  boissons: 'Boissons',
  sucre: 'Sucré',
  vaisselle: 'Vaisselle',
  sale: 'Salé',
}

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100)
  const barColor =
    score >= 4 ? 'var(--color-accent)'
    : score >= 2 ? '#d97706'
    : '#ef4444'

  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div
        className="relative flex-1 h-1 rounded-full overflow-hidden"
        style={{ background: 'var(--color-surface-muted)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className="text-xs tabular w-5 text-right shrink-0" style={{ color: 'var(--color-text-faint)' }}>
        {score}/5
      </span>
    </div>
  )
}

export function ReadinessPanel({ readiness, coverage }: ReadinessPanelProps) {
  const gaps = coverage.filter((c) => c.count === 0).map((c) => c.label)
  const low  = coverage.filter((c) => c.count > 0 && c.count < 2).map((c) => c.label)

  const overallPct = Math.round((readiness.overall / 5) * 100)
  const overallColor =
    overallPct >= 80 ? 'var(--color-accent)'
    : overallPct >= 50 ? '#d97706'
    : '#ef4444'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Préparation
          </h3>
          <div className="flex items-center gap-2">
            <div
              className="relative w-16 h-1 rounded-full overflow-hidden"
              style={{ background: 'var(--color-surface-muted)' }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ width: `${overallPct}%`, background: overallColor }}
              />
            </div>
            <span
              className="text-xs tabular font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {readiness.overall}/5
            </span>
          </div>
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        {(Object.keys(READINESS_LABELS) as Array<keyof typeof READINESS_LABELS>).map((key) => (
          <div key={key} className="flex items-center gap-3">
            <span
              className="text-sm w-20 shrink-0 leading-none"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {READINESS_LABELS[key]}
            </span>
            <ScoreBar score={readiness[key]} />
          </div>
        ))}

        {(gaps.length > 0 || low.length > 0) && (
          <div
            className="mt-1 pt-3 border-t flex flex-col gap-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {gaps.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" aria-hidden />
                <p className="text-xs leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="font-medium text-red-600">Manquants : </span>
                  {gaps.join(', ')}
                </p>
              </div>
            )}
            {low.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden />
                <p className="text-xs leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="font-medium text-amber-600">Peu couverts : </span>
                  {low.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
