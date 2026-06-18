'use client'

import { useTransition } from 'react'
import { deleteContribution } from '@/features/events/actions'
import type { Contribution } from '@/types'
import { CONTRIBUTION_CATEGORIES } from '@/types'

interface ContributionsListProps {
  contributions: Contribution[]
  eventId: string
  canDelete?: boolean
}

export function ContributionsList({ contributions, eventId, canDelete = false }: ContributionsListProps) {
  const [isPending, startTransition] = useTransition()

  if (contributions.length === 0) return null

  const byCategory = CONTRIBUTION_CATEGORIES.reduce(
    (acc, cat) => {
      const items = contributions.filter((c) => c.category === cat.value)
      if (items.length > 0) acc[cat.value] = { label: cat.label, items }
      return acc
    },
    {} as Record<string, { label: string; items: Contribution[] }>
  )

  function handleDelete(id: string) {
    startTransition(async () => { await deleteContribution(id, eventId) })
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-stone-200 bg-white overflow-hidden">
      {Object.entries(byCategory).map(([cat, { label, items }], catIndex) => (
        <div key={cat}>
          {catIndex > 0 && <div className="border-t border-stone-100" />}
          <div className="px-4 py-2 bg-stone-50/60 border-b border-stone-100">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">{label}</p>
          </div>
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-start justify-between gap-3 px-4 py-3${i > 0 ? ' border-t border-stone-100' : ''}`}
            >
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
                <div className="flex flex-wrap gap-1.5 text-xs text-stone-400">
                  <span>{item.quantity}</span>
                  {item.detail && <span>· {item.detail}</span>}
                  {item.note  && <span>· {item.note}</span>}
                </div>
              </div>
              {canDelete && (
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  aria-label="Supprimer"
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4l.5 9h5l.5-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
