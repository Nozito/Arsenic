import { cn } from '@/utils/cn'

interface StarsProps {
  score: number
  max?: number
  size?: 'sm' | 'md'
  className?: string
}

/* Barres de progression — plus lisibles que des carrés */
export function Stars({ score, max = 5, size = 'md', className }: StarsProps) {
  const pct = Math.round((score / max) * 100)

  if (size === 'sm') {
    return (
      <div
        className={cn('flex items-center gap-px', className)}
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${score} sur ${max}`}
      >
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-ui',
              i < score ? 'bg-stone-700 w-3.5' : 'bg-stone-200 w-3.5'
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${score} sur ${max}`}
    >
      <div className="relative h-1.5 flex-1 bg-stone-100 rounded-full overflow-hidden min-w-16">
        <div
          className="absolute inset-y-0 left-0 bg-stone-700 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular text-stone-500 w-5 text-right shrink-0">{score}</span>
    </div>
  )
}
