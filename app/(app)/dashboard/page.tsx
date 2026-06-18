import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/invite'
import type { Event } from '@/types'

export const metadata: Metadata = { title: 'Tableau de bord' }

export default async function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [{ data: myEvents }, { data: participatingRaw }, { data: profile }] = await Promise.all([
    supabase.from('events').select('*').eq('organizer_id', user.id).order('date', { ascending: true }),
    supabase.from('event_participants').select('event_id, events(*)').eq('user_id', user.id).order('joined_at', { ascending: false }),
    supabase.from('profiles').select('first_name, display_name').eq('id', user.id).single(),
  ])

  const myEventsList = (myEvents ?? []) as Event[]
  const participatingList = ((participatingRaw ?? []) as Array<{ events: Event | null }>)
    .map((p) => p.events)
    .filter((e): e is Event => e !== null && e.organizer_id !== user.id)

  const firstName = profile?.display_name ?? profile?.first_name ?? null

  return (
    <PageWrapper>
      {/* En-tête */}
      <div className="mb-10 flex items-start justify-between gap-4 animate-fade-in">
        <div>
          {firstName && (
            <p
              className="text-xs font-medium tracking-[0.18em] uppercase mb-1"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Bonjour, {firstName}
            </p>
          )}
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            {firstName ? 'Vos événements' : 'Tableau de bord'}
          </h1>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-[var(--radius-md)] transition-ui shrink-0"
          style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Nouvel événement
        </Link>
      </div>

      {/* Mes événements */}
      <section className="mb-10 animate-fade-in">
        <div className="mb-4">
          <h2
            className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2"
            style={{ color: 'var(--color-text-faint)' }}
          >
            J'organise
            {myEventsList.length > 0 && (
              <span
                className="font-normal normal-case tracking-normal tabular"
                style={{ color: 'var(--color-border-strong)' }}
              >
                {myEventsList.length}
              </span>
            )}
          </h2>
        </div>

        {myEventsList.length === 0 ? (
          <div
            className="rounded-[var(--radius-xl)] border border-dashed px-8 py-14 text-center"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface-elevated)',
            }}
          >
            <div
              className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <svg
                className="h-4 w-4"
                style={{ color: 'var(--color-text-faint)' }}
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 3V2M11 3V2M1.5 7h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M8 10v-2M7 9h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Aucun événement
            </p>
            <p
              className="text-xs mb-5 max-w-xs mx-auto leading-relaxed"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Créez votre premier événement et partagez le lien à vos invités.
            </p>
            <Link
              href="/events/new"
              className="inline-flex h-8 px-4 items-center text-xs font-medium rounded-[var(--radius-sm)] border transition-ui"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface-elevated)',
                color: 'var(--color-text-muted)',
              }}
            >
              Créer un événement
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {myEventsList.map((event) => (
              <EventCard key={event.id} event={event} role="organizer" />
            ))}
          </div>
        )}
      </section>

      {/* Participations */}
      {participatingList.length > 0 && (
        <section className="animate-fade-in" style={{ animationDelay: '80ms' }}>
          <div className="mb-4">
            <h2
              className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Je participe
              <span
                className="font-normal normal-case tracking-normal tabular"
                style={{ color: 'var(--color-border-strong)' }}
              >
                {participatingList.length}
              </span>
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {participatingList.map((event) => (
              <EventCard key={event.id} event={event} role="participant" />
            ))}
          </div>
        </section>
      )}
    </PageWrapper>
  )
}

function statusBadge(status: Event['status']) {
  switch (status) {
    case 'active':    return <Badge variant="success">Actif</Badge>
    case 'closed':    return <Badge variant="neutral">Fermé</Badge>
    case 'cancelled': return <Badge variant="danger">Annulé</Badge>
    case 'draft':     return <Badge variant="warning">Brouillon</Badge>
  }
}

function EventCard({ event, role }: { event: Event; role: 'organizer' | 'participant' }) {
  const href = role === 'organizer'
    ? `/events/${event.id}/manage`
    : `/events/${event.id}/respond`

  const today = new Date().toISOString().slice(0, 10)
  const isPast = event.date < today

  return (
    <Link href={href} className="group block">
      <div
        className="relative rounded-[var(--radius-xl)] border p-5 transition-all duration-150 hover:shadow-card"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface-elevated)',
        }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className="text-sm font-semibold leading-snug flex-1 min-w-0 truncate"
            style={{ color: 'var(--color-text)' }}
          >
            {event.title}
          </h3>
          {statusBadge(event.status)}
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <svg
              className="h-3 w-3 shrink-0"
              style={{ color: 'var(--color-border-strong)' }}
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden
            >
              <rect x="1" y="2" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1" />
              <path d="M1 5h10M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span
              style={{ color: isPast ? 'var(--color-text-faint)' : 'var(--color-text-muted)' }}
              className={isPast ? '' : 'font-medium'}
            >
              {formatDate(event.date)}
              {event.time ? ` à ${event.time.slice(0, 5).replace(':', 'h')}` : ''}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-faint)' }}>
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M6 1C4.34 1 3 2.34 3 4c0 2.5 3 7 3 7s3-4.5 3-7c0-1.66-1.34-3-3-3z" stroke="currentColor" strokeWidth="1" />
                <circle cx="6" cy="4" r="1" fill="currentColor" />
              </svg>
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            {role === 'organizer' ? 'Organisateur' : 'Participant'}
          </span>
          <span
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--color-text-faint)' }}
          >
            {role === 'organizer' ? 'Gérer' : 'Ma réponse'} →
          </span>
        </div>
      </div>
    </Link>
  )
}
