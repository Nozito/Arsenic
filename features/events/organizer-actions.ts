'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateInviteToken } from '@/utils/invite'
import type { ContributionCategory, ResponseStatus } from '@/types'

export interface OrganizerActionState {
  error?: string
  success?: boolean
  data?: Record<string, unknown>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrganizerDb(eventId: string): Promise<{ db: any; userId: string } | { error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = await createClient() as any
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: event } = await db
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (!event) return { error: "Événement introuvable ou accès refusé." }

  return { db, userId: user.id }
}

// ----------------------------------------------------------------
// ÉVÉNEMENT
// ----------------------------------------------------------------

export async function updateEvent(
  prevState: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  const eventId = formData.get('event_id') as string
  const auth = await getOrganizerDb(eventId)
  if ('error' in auth) return auth

  const title               = (formData.get('title') as string)?.trim()
  const description         = (formData.get('description') as string)?.trim() || null
  const date                = formData.get('date') as string
  const time                = formData.get('time') as string | null
  const location            = (formData.get('location') as string)?.trim() || null
  const expectedParticipants = formData.get('expected_participants')
  const responseDeadline    = formData.get('response_deadline') as string | null
  const organizerNotes      = (formData.get('organizer_notes') as string)?.trim() || null
  const invitationMessage   = (formData.get('invitation_message') as string)?.trim() || null
  const status              = formData.get('status') as string | null

  if (!title) return { error: 'Le titre est obligatoire.' }
  if (!date)  return { error: 'La date est obligatoire.' }

  const categoriesEnabled   = formData.getAll('categories_enabled') as ContributionCategory[]
  const allergensEnabled    = formData.get('allergens_enabled') === 'true'
  const dietaryEnabled      = formData.get('dietary_enabled') === 'true'
  const plusOneEnabled      = formData.get('plus_one_enabled') === 'true'

  const { error } = await auth.db
    .from('events')
    .update({
      title,
      description,
      date,
      time: time || null,
      location,
      expected_participants: expectedParticipants ? parseInt(expectedParticipants as string) : null,
      response_deadline: responseDeadline || null,
      organizer_notes: organizerNotes,
      invitation_message: invitationMessage,
      status: status || 'active',
      categories_enabled: categoriesEnabled.length > 0 ? categoriesEnabled : undefined,
      allergens_enabled: allergensEnabled,
      dietary_enabled: dietaryEnabled,
      plus_one_enabled: plusOneEnabled,
    })
    .eq('id', eventId)

  if (error) return { error: `Erreur : ${error.message}` }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

// ----------------------------------------------------------------
// PARTICIPANTS
// ----------------------------------------------------------------

export async function addParticipantManually(
  prevState: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  const eventId   = formData.get('event_id') as string
  const auth = await getOrganizerDb(eventId)
  if ('error' in auth) return auth

  const guestName = (formData.get('guest_name') as string)?.trim()
  const guestEmail = (formData.get('guest_email') as string)?.trim() || null
  const status    = (formData.get('status') as ResponseStatus) || 'attending'
  const headcount = parseInt(formData.get('headcount') as string) || 1
  const note      = (formData.get('note') as string)?.trim() || null
  const allergens = formData.getAll('allergens') as string[]
  const dietary   = formData.getAll('dietary_restrictions') as string[]

  if (!guestName) return { error: 'Le nom du participant est requis.' }

  const { data: participant, error: pErr } = await auth.db
    .from('event_participants')
    .insert({
      event_id: eventId,
      guest_name: guestName,
      guest_email: guestEmail,
      added_by_organizer: true,
    })
    .select('id')
    .single()

  if (pErr || !participant) return { error: "Erreur lors de l'ajout du participant." }

  await auth.db.from('participant_responses').insert({
    participant_id: participant.id,
    event_id: eventId,
    status,
    headcount,
    note,
    allergens,
    dietary_restrictions: dietary,
    is_manual: true,
  })

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

export async function updateParticipant(
  prevState: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  const eventId       = formData.get('event_id') as string
  const participantId = formData.get('participant_id') as string
  const auth = await getOrganizerDb(eventId)
  if ('error' in auth) return auth

  const guestName = (formData.get('guest_name') as string)?.trim() || null
  const status    = formData.get('status') as ResponseStatus
  const headcount = parseInt(formData.get('headcount') as string) || 1
  const note      = (formData.get('note') as string)?.trim() || null
  const allergens = formData.getAll('allergens') as string[]
  const dietary   = formData.getAll('dietary_restrictions') as string[]

  if (guestName !== null) {
    await auth.db
      .from('event_participants')
      .update({ guest_name: guestName })
      .eq('id', participantId)
      .eq('event_id', eventId)
  }

  const { data: existing } = await auth.db
    .from('participant_responses')
    .select('id')
    .eq('participant_id', participantId)
    .single()

  if (existing) {
    await auth.db
      .from('participant_responses')
      .update({ status, headcount, note, allergens, dietary_restrictions: dietary })
      .eq('id', existing.id)
  } else {
    await auth.db.from('participant_responses').insert({
      participant_id: participantId,
      event_id: eventId,
      status,
      headcount,
      note,
      allergens,
      dietary_restrictions: dietary,
      is_manual: true,
    })
  }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

export async function removeParticipant(
  participantId: string,
  eventId: string
): Promise<OrganizerActionState> {
  const auth = await getOrganizerDb(eventId)
  if ('error' in auth) return auth

  // Cascade supprime réponses + contributions via FK
  const { error } = await auth.db
    .from('event_participants')
    .delete()
    .eq('id', participantId)
    .eq('event_id', eventId)

  if (error) return { error: 'Erreur lors de la suppression.' }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

// ----------------------------------------------------------------
// CONTRIBUTIONS (organisateur)
// ----------------------------------------------------------------

export async function addContributionAsOrganizer(
  prevState: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  const eventId       = formData.get('event_id') as string
  const participantId = formData.get('participant_id') as string
  const auth = await getOrganizerDb(eventId)
  if ('error' in auth) return auth

  const category = formData.get('category') as ContributionCategory
  const name     = (formData.get('name') as string)?.trim()
  const quantity = (formData.get('quantity') as string)?.trim()

  if (!name || !quantity || !category) {
    return { error: 'Nom, quantité et catégorie sont requis.' }
  }

  const { error } = await auth.db.from('contributions').insert({
    participant_id: participantId,
    event_id: eventId,
    category,
    name,
    quantity,
  })

  if (error) return { error: "Erreur lors de l'ajout." }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

export async function updateContribution(
  prevState: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  const eventId        = formData.get('event_id') as string
  const contributionId = formData.get('contribution_id') as string
  const auth = await getOrganizerDb(eventId)
  if ('error' in auth) return auth

  const name     = (formData.get('name') as string)?.trim()
  const quantity = (formData.get('quantity') as string)?.trim()
  const category = formData.get('category') as ContributionCategory

  if (!name || !quantity) return { error: 'Nom et quantité requis.' }

  const { error } = await auth.db
    .from('contributions')
    .update({ name, quantity, category })
    .eq('id', contributionId)
    .eq('event_id', eventId)

  if (error) return { error: 'Erreur lors de la modification.' }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

export async function deleteContributionAsOrganizer(
  contributionId: string,
  eventId: string
): Promise<OrganizerActionState> {
  const auth = await getOrganizerDb(eventId)
  if ('error' in auth) return auth

  const { error } = await auth.db
    .from('contributions')
    .delete()
    .eq('id', contributionId)
    .eq('event_id', eventId)

  if (error) return { error: 'Erreur lors de la suppression.' }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

export async function reassignContribution(
  contributionId: string,
  toParticipantId: string,
  eventId: string
): Promise<OrganizerActionState> {
  const auth = await getOrganizerDb(eventId)
  if ('error' in auth) return auth

  const { error } = await auth.db
    .from('contributions')
    .update({ participant_id: toParticipantId })
    .eq('id', contributionId)
    .eq('event_id', eventId)

  if (error) return { error: 'Erreur lors de la réassignation.' }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}
