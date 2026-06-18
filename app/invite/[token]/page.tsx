import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { joinEventByToken } from '@/features/events/actions'
import { InviteAuthForm } from './invite-auth-form'
import { formatDate, formatTime } from '@/utils/invite'
import type { Event } from '@/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const db = createServiceClient()
  const { data } = await db.from('events').select('title').eq('invite_token', token).single()
  return { title: data?.title ?? 'Invitation' }
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const db = createServiceClient()

  const { data: eventRaw } = await db
    .from('events')
    .select('*')
    .eq('invite_token', token)
    .single()

  if (!eventRaw) notFound()
  const event = eventRaw as Event

  const subtitle = [
    formatDate(event.date),
    event.time ? formatTime(event.time) : null,
    event.location,
  ]
    .filter(Boolean)
    .join(' · ')

  // Utilisateur connecté → rejoindre l'événement et rediriger
  const server = await createClient()
  const { data: { user } } = await server.auth.getUser()

  if (user) {
    // joinEventByToken gère le cas déjà-participant gracieusement
    await joinEventByToken(token)
    redirect(`/events/${event.id}/respond`)
  }

  const isClosed = event.status === 'cancelled' || event.status === 'closed'

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      {/* Topbar minimaliste */}
      <header
        className="border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
      >
        <div className="mx-auto flex h-12 max-w-sm items-center px-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Arsenic">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-[2px]"
              style={{ background: 'var(--color-text)' }}
            >
              <span className="block h-[6px] w-[6px] rounded-[1px] bg-white opacity-90" />
            </span>
            <span
              className="text-xs font-semibold tracking-tight"
              style={{ color: 'var(--color-text)' }}
            >
              Arsenic
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-sm px-4 py-10 space-y-6">
        {/* En-tête événement */}
        <div className="animate-fade-in">
          <h1
            className="text-2xl font-semibold tracking-tight leading-tight mb-1.5"
            style={{ color: 'var(--color-text)' }}
          >
            {event.title}
          </h1>
          {subtitle && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {subtitle}
            </p>
          )}
          {event.description && (
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {event.description}
            </p>
          )}
        </div>

        {/* Message de l'organisateur */}
        {event.invitation_message && (
          <div
            className="border-l-2 pl-4 py-1 animate-fade-in"
            style={{ borderColor: 'var(--color-accent)' }}
          >
            <p
              className="text-sm italic leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {event.invitation_message}
            </p>
          </div>
        )}

        {/* Événement fermé ou annulé */}
        {isClosed ? (
          <div
            className="rounded-[var(--radius-md)] border px-4 py-3 text-sm"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface-muted)',
              color: 'var(--color-text-muted)',
            }}
          >
            {event.status === 'cancelled'
              ? "Cet événement a été annulé."
              : "Cet événement est fermé aux nouvelles réponses."}
          </div>
        ) : (
          /* Micro-auth inline */
          <div className="animate-fade-in" style={{ animationDelay: '60ms' }}>
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Pour participer, créez votre accès en quelques secondes.
            </p>
            <InviteAuthForm inviteToken={token} />
          </div>
        )}
      </main>
    </div>
  )
}
