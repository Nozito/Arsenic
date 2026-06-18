'use client'

import { useState, useTransition } from 'react'
import { toggleReaction } from '@/features/events/reaction-actions'

interface Props {
  contributionId: string
  eventId: string
  initialCount: number
  initialLiked: boolean
  likerNames?: string[]
}

export function ContributionLike({
  contributionId,
  eventId,
  initialCount,
  initialLiked,
  likerNames = [],
}: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [, startTransition] = useTransition()

  function handleToggle() {
    // Mise à jour optimiste
    const wasLiked = liked
    setLiked(!wasLiked)
    setCount((c) => (wasLiked ? c - 1 : c + 1))

    startTransition(async () => {
      const result = await toggleReaction(contributionId, eventId)
      if (result.error) {
        // Rollback
        setLiked(wasLiked)
        setCount((c) => (wasLiked ? c + 1 : c - 1))
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={likerNames.length > 0 ? likerNames.join(', ') : undefined}
      className="flex items-center gap-1 transition-ui"
      style={{ color: liked ? 'var(--color-accent)' : 'var(--color-text-faint)' }}
      aria-pressed={liked}
      aria-label={liked ? 'Retirer mon approbation' : 'Approuver'}
    >
      {/* Icône check sobre — pas d'emoji */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden
        style={{
          stroke: liked ? 'var(--color-accent)' : 'var(--color-text-faint)',
          transition: 'stroke 150ms',
        }}
      >
        <path
          d="M2.5 7.5L5.5 10.5L11.5 4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && (
        <span className="text-xs tabular" style={{ minWidth: '0.75rem' }}>
          {count}
        </span>
      )}
    </button>
  )
}
