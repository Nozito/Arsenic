'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback, useTransition } from 'react'
import { useRealtimeEvent } from '@/hooks/use-realtime-event'

interface Props {
  eventId: string
}

interface Notification {
  id: number
  message: string
}

export function RealtimeUpdater({ eventId }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [counter, setCounter] = useState(0)

  const refresh = useCallback(() => {
    startTransition(() => router.refresh())
  }, [router, startTransition])

  const notify = useCallback((message: string) => {
    const id = Date.now()
    setNotifications((prev) => [...prev.slice(-2), { id, message }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4000)
    refresh()
  }, [refresh])

  useRealtimeEvent({
    eventId,
    channelSuffix: '-updater',
    onContributionChange: (payload) => {
      if (payload.eventType === 'INSERT') notify('Nouvelle contribution ajoutée.')
      else if (payload.eventType === 'DELETE') notify('Une contribution a été retirée.')
      else refresh()
    },
    onResponseChange: () => notify('Une réponse a été mise à jour.'),
    onParticipantJoin: () => notify('Quelqu\'un vient de rejoindre l\'événement.'),
    onCommentInsert: () => refresh(),
    onReactionChange: () => refresh(),
  })

  if (notifications.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {notifications.map((n) => (
        <div
          key={n.id}
          className="animate-slide-up rounded-[var(--radius-md)] border px-4 py-2.5 text-sm shadow-md"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface-elevated)',
            color: 'var(--color-text)',
            maxWidth: '22rem',
          }}
        >
          {n.message}
        </div>
      ))}
    </div>
  )
}
