'use client'

import { useState } from 'react'
import { EventEditPanel } from '@/components/dashboard/event-edit-panel'
import { OrganizerParticipantPanel } from '@/components/dashboard/organizer-participant-panel'
import type { Event, ParticipantWithResponseAndContributions } from '@/types'

interface Props {
  event: Event
  participants: ParticipantWithResponseAndContributions[]
}

type Panel = null | 'edit' | 'participants'

export function ManageClientControls({ event, participants }: Props) {
  const [open, setOpen] = useState<Panel>(null)

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(open === 'participants' ? null : 'participants')}
          className="h-8 px-3 text-xs font-medium rounded-[var(--radius-md)] border transition-ui"
          style={{
            borderColor: 'var(--color-border)',
            background: open === 'participants' ? 'var(--color-surface-muted)' : 'var(--color-surface-elevated)',
            color: 'var(--color-text-muted)',
          }}
        >
          Participants
        </button>
        <button
          type="button"
          onClick={() => setOpen(open === 'edit' ? null : 'edit')}
          className="h-8 px-3 text-xs font-medium rounded-[var(--radius-md)] border transition-ui"
          style={{
            borderColor: 'var(--color-border)',
            background: open === 'edit' ? 'var(--color-surface-muted)' : 'var(--color-surface-elevated)',
            color: 'var(--color-text-muted)',
          }}
        >
          Modifier
        </button>
      </div>

      {open === 'edit' && (
        <div className="w-full mt-4">
          <EventEditPanel event={event} onClose={() => setOpen(null)} />
        </div>
      )}

      {open === 'participants' && (
        <div className="w-full mt-4">
          <OrganizerParticipantPanel eventId={event.id} participants={participants} />
        </div>
      )}
    </div>
  )
}
