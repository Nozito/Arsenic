'use client'

import { useActionState, useRef, useEffect, useOptimistic, startTransition } from 'react'
import { addComment, deleteComment } from '@/features/events/comment-actions'
import { useRealtimeEvent } from '@/hooks/use-realtime-event'
import { useRouter } from 'next/navigation'
import type { EventComment } from '@/types'

interface Props {
  eventId: string
  currentUserId: string
  isOrganizer: boolean
  initialComments: EventComment[]
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

export function EventComments({ eventId, currentUserId, isOrganizer, initialComments }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(addComment, {})
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [comments, setOptimisticComments] = useOptimistic(
    initialComments,
    (current, newComment: EventComment) => [...current, newComment]
  )

  // Clear textarea on success
  useEffect(() => {
    if (state.success && textareaRef.current) {
      textareaRef.current.value = ''
    }
  }, [state.success])

  // Realtime: refresh on new comments
  useRealtimeEvent({
    eventId,
    channelSuffix: '-comments',
    onCommentInsert: () => router.refresh(),
  })

  async function handleDelete(commentId: string) {
    await deleteComment(commentId, eventId)
    router.refresh()
  }

  const visible = comments.filter((c) => !c.deleted_at)

  return (
    <div className="flex flex-col">
      {/* Thread */}
      {visible.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: 'var(--color-text-faint)' }}>
          Personne n'a encore écrit. Soyez le premier.
        </p>
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {visible.map((comment) => {
            const name =
              comment.profile?.display_name ??
              comment.profile?.first_name ??
              comment.guest_name ??
              'Inconnu'
            const isOwn = comment.user_id === currentUserId
            const isOrganizerComment = isOrganizer && comment.user_id !== currentUserId
            // Crude organizer detection from parent prop + separate check
            const canDelete = isOwn || isOrganizer

            return (
              <div
                key={comment.id}
                className="flex flex-col gap-1 px-4 py-3"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                      {name}
                    </span>
                    {isOrganizerComment === false && isOwn && (
                      <span
                        className="text-xs"
                        style={{ color: 'var(--color-text-faint)' }}
                      >
                        Vous
                      </span>
                    )}
                    {/* Organisateur label — affiché seulement sur ses propres commentaires quand il est organizer */}
                    {comment.user_id === currentUserId && isOrganizer && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded border"
                        style={{
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-faint)',
                          background: 'var(--color-surface-muted)',
                        }}
                      >
                        Organisateur
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      {timeAgo(comment.created_at)}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs transition-ui"
                        style={{ color: 'var(--color-text-faint)' }}
                        aria-label="Supprimer"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                  {comment.content}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Input */}
      <div
        className="border-t px-4 py-3"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <form action={action} className="flex gap-2 items-end">
          <input type="hidden" name="event_id" value={eventId} />
          <textarea
            ref={textareaRef}
            name="content"
            placeholder="Écrire un message…"
            maxLength={500}
            rows={2}
            className="flex-1 rounded-[var(--radius-md)] border px-3 py-2 text-sm outline-none resize-none transition-ui"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface-elevated)',
              color: 'var(--color-text)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-accent)'
              e.target.style.boxShadow = '0 0 0 3px var(--color-accent-muted)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border)'
              e.target.style.boxShadow = 'none'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <button
            type="submit"
            disabled={pending}
            className="h-9 px-4 text-sm font-medium rounded-[var(--radius-md)] shrink-0 transition-ui disabled:opacity-40"
            style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
          >
            {pending ? '…' : 'Envoyer'}
          </button>
        </form>
        {state.error && (
          <p className="mt-1.5 text-xs text-red-600">{state.error}</p>
        )}
      </div>
    </div>
  )
}
