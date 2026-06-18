'use client'

import { buildInviteUrl } from '@/utils/invite'
import { ShareBlock } from '@/components/ui/share-block'

interface InvitePanelProps {
  inviteToken: string
  invitationMessage?: string | null
  eventTitle?: string
}

export function InvitePanel({ inviteToken, invitationMessage, eventTitle }: InvitePanelProps) {
  const url = buildInviteUrl(inviteToken)

  return (
    <div className="flex flex-col gap-3">
      <ShareBlock url={url} title={eventTitle} />

      {invitationMessage && (
        <div
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-5 py-4"
          style={{ background: 'var(--color-surface-muted)' }}
        >
          <p className="text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-widest mb-2">
            Message d'invitation
          </p>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed italic">
            {invitationMessage}
          </p>
        </div>
      )}
    </div>
  )
}
