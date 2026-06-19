import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { ManageTabs } from '@/components/dashboard/manage-tabs'
import { RealtimeUpdater } from '@/components/dashboard/realtime-updater'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/utils/invite'
import type {
  Event,
  ParticipantWithResponseAndContributions,
  DashboardStats,
  Contribution,
  EventComment,
} from '@/types'

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
    .single()

  if (!eventRaw) notFound()
  const event = eventRaw as Event
  const isEventOrganizer = event.organizer_id === user.id

  if (!isEventOrganizer) {
    const { data: coOrgCheck } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .eq('is_co_organizer', true)
      .single()
    if (!coOrgCheck) notFound()
  }

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

  const participants = (rawParticipants ?? []) as ParticipantWithResponseAndContributions[]
  const comments     = (rawComments ?? []) as EventComment[]
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

  return (
    <PageWrapper>
      <RealtimeUpdater eventId={eventId} />

      {/* En-tête */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
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

      {/* Navigation par onglets */}
      <ManageTabs
        event={event}
        participants={participants}
        stats={stats}
        comments={comments}
        currentUserId={user.id}
        isOrganizer={isEventOrganizer}
      />
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
