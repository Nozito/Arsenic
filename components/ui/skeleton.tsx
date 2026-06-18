import { cn } from '@/utils/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('rounded skeleton-shimmer', className)}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-[var(--radius-xl)] border p-5 space-y-3"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-px sm:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-4 space-y-2"
          style={{ background: 'var(--color-surface-elevated)' }}
        >
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}
