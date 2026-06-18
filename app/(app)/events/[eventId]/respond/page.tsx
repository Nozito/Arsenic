import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper, SectionHeader } from '@/components/layout/page-wrapper'
import { RespondStepper } from '@/components/events/respond-stepper'
import { ContributionLike } from '@/components/contributions/contribution-like'
import { EventComments } from '@/components/comments/event-comments'
import { formatDate, formatTime } from '@/utils/invite'
import type {
  Event,
  ParticipantResponse,
  Contribution,
  EventParticipant,
  ContributionReaction,
  EventComment,
  Profile,
} from '@/types'
import type { ContributionSuggestion } from '@/components/contributions/contribution-form'

export const metadata: Metadata = { title: 'Ma réponse' }

export default async function RespondPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/sign-in?redirect=/events/${eventId}/respond`)

  const { data: eventRaw } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!eventRaw) notFound()
  const event = eventRaw as Event

  if (event.status === 'cancelled') {
    return (
      <PageWrapper narrow>
        <div
          className="rounded-[var(--radius-lg)] border px-6 py-12 text-center"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Cet événement a été annulé.
          </p>
        </div>
      </PageWrapper>
    )
  }

  // Auto-join
  let { data: participantRaw } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (!participantRaw) {
    const { data: newP } = await supabase
      .from('event_participants')
      .insert({ event_id: eventId, user_id: user.id })
      .select()
      .single()
    participantRaw = newP
  }

  if (!participantRaw) notFound()
  const participant = participantRaw as EventParticipant

  const isOrganizer = event.organizer_id === user.id

  const [
    { data: responseRaw },
    { data: myContributionsRaw },
    { data: allContributionsRaw },
    { data: allParticipantsRaw },
    { data: commentsRaw },
    { data: pastContribsRaw },
    { data: profileRaw },
  ] = await Promise.all([
    supabase.from('participant_responses').select('*').eq('participant_id', participant.id).single(),
    supabase.from('contributions').select('*').eq('participant_id', participant.id).order('created_at', { ascending: false }),
    supabase.from('contributions').select('*').eq('event_id', eventId),
    supabase.from('event_participants').select('id, profile:profiles(display_name, first_name), guest_name').eq('event_id', eventId),
    supabase.from('event_comments')
      .select('*, profile:profiles(display_name, first_name)')
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    supabase.from('contributions')
      .select('name, quantity, category, event_id')
      .not('event_id', 'eq', eventId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  const response         = responseRaw as ParticipantResponse | null
  const myContributions  = (myContributionsRaw ?? []) as Contribution[]
  const allContributions = (allContributionsRaw ?? []) as Contribution[]
  const profile          = profileRaw as Profile | null

  // Réactions
  const contributionIds = allContributions.map((c) => c.id)
  const { data: reactionsRaw } = contributionIds.length > 0
    ? await supabase.from('contribution_reactions').select('*').in('contribution_id', contributionIds)
    : { data: [] as ContributionReaction[] }
  const reactions = (reactionsRaw ?? []) as ContributionReaction[]
  const comments  = (commentsRaw ?? []) as EventComment[]

  const allParticipants = (allParticipantsRaw ?? []) as Array<{
    id: string
    profile?: { display_name?: string; first_name?: string } | null
    guest_name?: string | null
  }>

  // Suggestions
  const pastContribs = (pastContribsRaw ?? []) as Array<{ name: string; quantity: string; category: string }>
  const suggestionsByCategory = pastContribs.reduce(
    (acc, c) => {
      if (!acc[c.category]) acc[c.category] = new Map()
      const map = acc[c.category]
      map.set(c.name, (map.get(c.name) ?? 0) + 1)
      return acc
    },
    {} as Record<string, Map<string, number>>
  )
  const suggestions: ContributionSuggestion[] = Object.entries(suggestionsByCategory).flatMap(
    ([cat, counts]) =>
      Array.from(counts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name]) => ({
          name,
          quantity: pastContribs.find((c) => c.category === cat && c.name === name)?.quantity ?? '1',
          category: cat as Contribution['category'],
        }))
  )

  const contribsWithNames = allContributions.map((c) => {
    const p = allParticipants.find((ap) => ap.id === c.participant_id)
    return {
      ...c,
      contributor_name:
        p?.profile?.display_name ?? p?.profile?.first_name ?? p?.guest_name ?? 'Invité',
    }
  })

  const isClosed       = event.status === 'closed'
  const othersContribs = contribsWithNames.filter((c) => c.participant_id !== participant.id)

  const subtitle = [
    formatDate(event.date),
    event.time ? formatTime(event.time) : null,
    event.location,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <PageWrapper narrow>
      {/* En-tête événement */}
      <div className="mb-8 animate-fade-in">
        <h1
          className="text-xl font-semibold tracking-tight leading-tight mb-1"
          style={{ color: 'var(--color-text)' }}
        >
          {event.title}
        </h1>
        {subtitle && (
          <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Message d'invitation */}
      {event.invitation_message && (
        <div
          className="mb-6 border-l-2 pl-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p className="text-sm leading-relaxed italic" style={{ color: 'var(--color-text-muted)' }}>
            {event.invitation_message}
          </p>
        </div>
      )}

      {/* Événement fermé */}
      {isClosed && (
        <div
          className="mb-6 flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Cet événement est fermé aux nouvelles réponses.
          </p>
        </div>
      )}

      {/* Stepper principal */}
      {!isClosed && (
        <section className="mb-8 animate-fade-in">
          <RespondStepper
            eventId={eventId}
            participantId={participant.id}
            event={event}
            existingResponse={response}
            existingContributions={myContributions}
            allContributions={contribsWithNames}
            suggestions={suggestions}
            profile={profile}
          />
        </section>
      )}

      {/* Déjà prévu par les autres */}
      {othersContribs.length > 0 && (
        <section className="mb-8 animate-fade-in" style={{ animationDelay: '120ms' }}>
          <SectionHeader title="Déjà prévu" count={othersContribs.length} />
          <div
            className="rounded-[var(--radius-lg)] border overflow-hidden"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            {othersContribs.map((c, i) => {
              const contribReactions = reactions.filter((r) => r.contribution_id === c.id)
              const userLiked = contribReactions.some((r) => r.user_id === user.id)
              return (
                <div
                  key={c.id}
                  className={`flex items-start justify-between gap-3 px-4 py-3${i > 0 ? ' border-t' : ''}`}
                  style={i > 0 ? { borderColor: 'var(--color-border)' } : undefined}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug" style={{ color: 'var(--color-text)' }}>
                      {c.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                      {c.contributor_name}
                      {c.quantity ? <span className="mx-1">·</span> : null}
                      {c.quantity}
                    </p>
                  </div>
                  <ContributionLike
                    contributionId={c.id}
                    eventId={eventId}
                    initialCount={contribReactions.length}
                    initialLiked={userLiked}
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Fil de discussion */}
      <section className="animate-fade-in" style={{ animationDelay: '160ms' }}>
        <SectionHeader
          title="Discussion"
          count={comments.length > 0 ? comments.length : undefined}
        />
        <div
          className="rounded-[var(--radius-lg)] border overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
        >
          <EventComments
            eventId={eventId}
            currentUserId={user.id}
            isOrganizer={isOrganizer}
            initialComments={comments}
          />
        </div>
      </section>
    </PageWrapper>
  )
}
