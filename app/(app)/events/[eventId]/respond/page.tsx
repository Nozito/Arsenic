import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper, SectionHeader } from '@/components/layout/page-wrapper'
import { RespondForm } from '@/components/events/respond-form'
import { ContributionForm } from '@/components/contributions/contribution-form'
import { ContributionsList } from '@/components/contributions/contributions-list'
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
    // Contributions passées de l'utilisateur (autres événements) pour suggestions
    supabase.from('contributions')
      .select('name, quantity, category, event_id')
      .eq('event_participants.user_id', user.id)
      .not('event_id', 'eq', eventId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const response         = responseRaw as ParticipantResponse | null
  const myContributions  = (myContributionsRaw ?? []) as Contribution[]
  const allContributions = (allContributionsRaw ?? []) as Contribution[]

  // Réactions : filtrées par les IDs de contributions déjà chargées
  const contributionIds = allContributions.map((c) => c.id)
  const { data: reactionsRaw } = contributionIds.length > 0
    ? await supabase.from('contribution_reactions').select('*').in('contribution_id', contributionIds)
    : { data: [] as ContributionReaction[] }
  const reactions = (reactionsRaw ?? []) as ContributionReaction[]
  const comments         = (commentsRaw ?? []) as EventComment[]

  const allParticipants = (allParticipantsRaw ?? []) as Array<{
    id: string
    profile?: { display_name?: string; first_name?: string } | null
    guest_name?: string | null
  }>

  // Suggestions préremplies : top 3 par catégorie depuis les contributions passées
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

      {/* Votre présence */}
      {!isClosed && (
        <section className="mb-8 animate-fade-in">
          <SectionHeader title="Votre présence" />
          <RespondForm
            eventId={eventId}
            participantId={participant.id}
            plusOneEnabled={event.plus_one_enabled}
            dietaryEnabled={event.dietary_enabled}
            allergensEnabled={event.allergens_enabled}
            existingResponse={response}
          />
        </section>
      )}

      {/* Ce que j'apporte */}
      <section className="mb-8 animate-fade-in" style={{ animationDelay: '60ms' }}>
        <SectionHeader title="Ce que j'apporte" count={myContributions.length} />
        {myContributions.length > 0 && (
          <div className="mb-4">
            <ContributionsList
              contributions={myContributions}
              eventId={eventId}
              canDelete={!isClosed}
            />
          </div>
        )}
        {!isClosed && (
          <ContributionForm
            eventId={eventId}
            participantId={participant.id}
            enabledCategories={event.categories_enabled}
            existingContributions={contribsWithNames}
            suggestions={suggestions}
          />
        )}
      </section>

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
                  className={`flex items-center gap-4 px-4 py-3 text-sm${i > 0 ? ' border-t' : ''}`}
                  style={i > 0 ? { borderColor: 'var(--color-border)' } : undefined}
                >
                  <span
                    className="text-xs w-24 shrink-0 truncate"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    {c.contributor_name}
                  </span>
                  <span className="flex-1 font-medium truncate" style={{ color: 'var(--color-text)' }}>
                    {c.name}
                  </span>
                  <span className="text-xs shrink-0 tabular" style={{ color: 'var(--color-text-faint)' }}>
                    {c.quantity}
                  </span>
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
