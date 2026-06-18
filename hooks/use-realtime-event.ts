'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeEventOptions {
  eventId: string
  channelSuffix?: string
  onContributionChange?: (payload: RealtimePayload) => void
  onResponseChange?: (payload: RealtimePayload) => void
  onParticipantJoin?: (payload: RealtimePayload) => void
  onCommentInsert?: (payload: RealtimePayload) => void
  onReactionChange?: (payload: RealtimePayload) => void
}

export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown>
  old: Record<string, unknown>
}

export function useRealtimeEvent({
  eventId,
  channelSuffix = '',
  onContributionChange,
  onResponseChange,
  onParticipantJoin,
  onCommentInsert,
  onReactionChange,
}: UseRealtimeEventOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Stable callbacks via ref so effect doesn't re-run on every render
  const handlers = useRef({
    onContributionChange,
    onResponseChange,
    onParticipantJoin,
    onCommentInsert,
    onReactionChange,
  })
  handlers.current = {
    onContributionChange,
    onResponseChange,
    onParticipantJoin,
    onCommentInsert,
    onReactionChange,
  }

  useEffect(() => {
    if (!eventId) return

    const supabase = createClient()
    const channel = supabase.channel(`event-${eventId}${channelSuffix}`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contributions', filter: `event_id=eq.${eventId}` },
        (payload) => handlers.current.onContributionChange?.(payload as unknown as RealtimePayload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participant_responses', filter: `event_id=eq.${eventId}` },
        (payload) => handlers.current.onResponseChange?.(payload as unknown as RealtimePayload)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_participants', filter: `event_id=eq.${eventId}` },
        (payload) => handlers.current.onParticipantJoin?.(payload as unknown as RealtimePayload)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_comments', filter: `event_id=eq.${eventId}` },
        (payload) => handlers.current.onCommentInsert?.(payload as unknown as RealtimePayload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contribution_reactions' },
        (payload) => handlers.current.onReactionChange?.(payload as unknown as RealtimePayload)
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[realtime] channel error — will retry automatically')
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [eventId, channelSuffix])
}
