import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { StatsBar } from '@/components/dashboard/stats-bar'
import { ReadinessPanel } from '@/components/dashboard/readiness-panel'
import { ParticipantsList } from '@/components/dashboard/participants-list'
import { ContributionsOverview } from '@/components/dashboard/contributions-overview'
import { AllergensSummary } from '@/components/dashboard/allergens-summary'
import { InvitePanel } from '@/components/dashboard/invite-panel'
import { RealtimeUpdater } from '@/components/dashboard/realtime-updater'
import { EventEditPanel } from '@/components/dashboard/event-edit-panel'
import { OrganizerParticipantPanel } from '@/components/dashboard/organizer-participant-panel'
import { EventComments } from '@/components/comments/event-comments'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/layout/page-wrapper'
import { computeReadinessScore, computeCategoryCoverage } from '@/utils/readiness'
import { groupDuplicates } from '@/utils/duplicates'
import { formatDate, formatTime } from '@/utils/invite'
import type {
  Event,
  ParticipantWithResponseAndContributions,
  DashboardStats,
  Contribution,
  EventComment,
} from '@/types'
import { ManageClientControls } from './manage-client-controls'

export const metadata: Metadata = { title: 'Gestion' }

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: eventRaw } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (!eventRaw) notFound()
  const event = eventRaw as Event

  const [{ data: rawParticipants }, { data: rawComments }] = await Promise.all([
    supabase
      .from('event_participants')
      .select(`*, profile:profiles(*), response:participant_responses(*), contributions(*)`)
      .eq('event_id', eventId)
      .order('joined_at', { ascending: true }),
    supabase
      .from('event_comments')
      .select('*, profile:profiles(display_name, first_name)')
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
  ])

  const participants    = (rawParticipants ?? []) as ParticipantWithResponseAndContributions[]
  const comments        = (rawComments ?? []) as EventComment[]
  const allContribs: Contribution[] = participants.flatMap((p) => p.contributions)

  const attending      = participants.filter((p) => p.response?.status === 'attending')
  const totalHeadcount = attending.reduce((sum, p) => sum + (p.response?.headcount ?? 1), 0)

  const stats: DashboardStats = {
    totalInvited:   event.expected_participants ?? participants.length,
    totalResponses: participants.filter((p) => p.response).length,
    attending:      attending.length,
    notAttending:   participants.filter((p) => p.response?.status === 'not_attending').length,
    maybe:          participants.filter((p) => p.response?.status === 'maybe').length,
    pending:        participants.filter((p) => !p.response).length,
    totalHeadcount,
  }

  const readiness  = computeReadinessScore(allContribs, Math.max(totalHeadcount, 1))
  const coverage   = computeCategoryCoverage(allContribs)

  const contribsWithNames = allContribs.map((c) => {
    const p = participants.find((part) => part.id === c.participant_id)
    return {
      ...c,
      contributor_name:
        p?.profile?.display_name ?? p?.profile?.first_name ?? p?.guest_name ?? 'Invité',
    }
  })
  const duplicates = groupDuplicates(contribsWithNames)

  return (
    <PageWrapper>
      {/* Realtime — aucun rendu visible, juste la souscription */}
      <RealtimeUpdater eventId={eventId} />

      {/* En-tête */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <EventStatusBadge status={event.status} />
            </div>
            <h1
              className="text-xl font-semibold tracking-tight leading-tight"
              style={{ color: 'var(--color-text)' }}
            >
              {event.title}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-faint)' }}>
              {formatDate(event.date)}
              {event.time ? ` · ${formatTime(event.time)}` : ''}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
          {/* Bouton modifier — client component pour le toggle */}
          <ManageClientControls event={event} participants={participants} />
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 animate-fade-in" style={{ animationDelay: '30ms' }}>
        <StatsBar stats={stats} />
      </div>

      {/* Lien d'invitation */}
      <div className="mb-8 animate-fade-in" style={{ animationDelay: '60ms' }}>
        <InvitePanel
          inviteToken={event.invite_token}
          invitationMessage={event.invitation_message}
        />
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="lg:col-span-2 flex flex-col gap-6 animate-fade-in" style={{ animationDelay: '90ms' }}>

          <section>
            <SectionHeader title="Participants" count={participants.length} />
            <ParticipantsList participants={participants} />
          </section>

          {event.allergens_enabled && (
            <section>
              <SectionHeader title="Contraintes alimentaires" />
              <AllergensSummary participants={participants} />
            </section>
          )}

          {/* Fil de discussion */}
          <section>
            <SectionHeader title="Discussion" count={comments.length > 0 ? comments.length : undefined} />
            <div
              className="rounded-[var(--radius-lg)] border overflow-hidden"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
            >
              <EventComments
                eventId={eventId}
                currentUserId={user.id}
                isOrganizer={true}
                initialComments={comments}
              />
            </div>
          </section>
        </div>

        {/* Colonne latérale */}
        <div className="flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '120ms' }}>
          <ReadinessPanel readiness={readiness} coverage={coverage} />
          <ContributionsOverview coverage={coverage} duplicates={duplicates} />

          {event.organizer_notes && (
            <div
              className="rounded-[var(--radius-lg)] border overflow-hidden"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
            >
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  Notes privées
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {event.organizer_notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

function EventStatusBadge({ status }: { status: Event['status'] }) {
  switch (status) {
    case 'active':    return <Badge variant="success">Actif</Badge>
    case 'closed':    return <Badge variant="neutral">Fermé</Badge>
    case 'cancelled': return <Badge variant="danger">Annulé</Badge>
    case 'draft':     return <Badge variant="warning">Brouillon</Badge>
  }
}
