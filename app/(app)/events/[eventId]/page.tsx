import { redirect } from 'next/navigation'

// Rediriger vers respond si participant, manage si organisateur
export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  redirect(`/events/${eventId}/respond`)
}
