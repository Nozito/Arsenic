'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateInviteToken } from '@/utils/invite'
import type { ContributionCategory, ResponseStatus } from '@/types'

export interface ActionState {
  error?: string
  success?: boolean
  data?: Record<string, unknown>
}

// Cast interne pour éviter les erreurs TypeScript sans types Supabase générés
// Remplacer par les types générés (npx supabase gen types typescript) une fois le projet créé
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getDb() { return await createClient() as any }

export async function createEvent(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const db = await getDb()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const date = formData.get('date') as string
  const time = formData.get('time') as string | null
  const location = formData.get('location') as string | null
  const expectedParticipants = formData.get('expected_participants')
  const responseDeadline = formData.get('response_deadline') as string | null
  const organizerNotes = formData.get('organizer_notes') as string | null
  const invitationMessage = formData.get('invitation_message') as string | null

  if (!title?.trim()) return { error: 'Le titre est obligatoire.' }
  if (!date)         return { error: 'La date est obligatoire.' }

  const categoriesEnabled = formData.getAll('categories_enabled') as ContributionCategory[]
  const allergensEnabled = formData.get('allergens_enabled') === 'true'
  const dietaryEnabled = formData.get('dietary_enabled') === 'true'
  const plusOneEnabled = formData.get('plus_one_enabled') === 'true'

  const { data, error } = await db
    .from('events')
    .insert({
      organizer_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      date,
      time: time || null,
      location: location?.trim() || null,
      expected_participants: expectedParticipants ? parseInt(expectedParticipants as string) : null,
      status: 'active',
      invite_token: generateInviteToken(),
      categories_enabled: categoriesEnabled.length > 0
        ? categoriesEnabled
        : ['boissons', 'sale', 'sucre', 'plats', 'snacks', 'couverts', 'vaisselle', 'autre'],
      allergens_enabled: allergensEnabled,
      dietary_enabled: dietaryEnabled,
      plus_one_enabled: plusOneEnabled,
      response_deadline: responseDeadline || null,
      organizer_notes: organizerNotes?.trim() || null,
      invitation_message: invitationMessage?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createEvent] Supabase error:', error)
    return { error: `Erreur lors de la création : ${error.message}` }
  }
  if (!data?.id) {
    console.error('[createEvent] Insert succeeded but no data returned')
    return { error: "Événement créé mais identifiant introuvable. Vérifiez votre tableau de bord." }
  }

  return { success: true, data: { eventId: data.id } }
}

export async function updateEventStatus(eventId: string, status: 'active' | 'closed' | 'cancelled') {
  const db = await getDb()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { error } = await db
    .from('events')
    .update({ status })
    .eq('id', eventId)
    .eq('organizer_id', user.id)

  if (error) return { error: 'Erreur lors de la mise à jour.' }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

export async function joinEventByToken(token: string): Promise<ActionState> {
  const db = await getDb()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté pour rejoindre un événement.' }

  const { data: event, error: eventError } = await db
    .from('events')
    .select('id, status')
    .eq('invite_token', token)
    .single()

  if (eventError || !event) return { error: 'Événement introuvable ou lien invalide.' }
  if (event.status === 'closed') return { error: 'Cet événement est fermé aux nouvelles réponses.' }
  if (event.status === 'cancelled') return { error: 'Cet événement a été annulé.' }

  const { data: existing } = await db
    .from('event_participants')
    .select('id')
    .eq('event_id', event.id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    const { error: joinError } = await db
      .from('event_participants')
      .insert({ event_id: event.id, user_id: user.id })

    if (joinError) return { error: "Erreur lors de la participation à l'événement." }
  }

  return { success: true, data: { eventId: event.id } }
}

export async function submitResponse(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = await getDb()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const eventId = formData.get('event_id') as string
  const participantId = formData.get('participant_id') as string
  const status = formData.get('status') as ResponseStatus
  const headcount = parseInt(formData.get('headcount') as string) || 1
  const allergens = formData.getAll('allergens') as string[]
  const dietaryRestrictions = formData.getAll('dietary_restrictions') as string[]
  const note = formData.get('note') as string | null

  const { data: existing } = await db
    .from('participant_responses')
    .select('id')
    .eq('participant_id', participantId)
    .single()

  let responseError
  if (existing) {
    const { error } = await db
      .from('participant_responses')
      .update({ status, headcount, allergens, dietary_restrictions: dietaryRestrictions, note: note || null })
      .eq('id', existing.id)
    responseError = error
  } else {
    const { error } = await db
      .from('participant_responses')
      .insert({ participant_id: participantId, event_id: eventId, status, headcount, allergens, dietary_restrictions: dietaryRestrictions, note: note || null })
    responseError = error
  }

  if (responseError) return { error: "Erreur lors de l'enregistrement de la réponse." }

  revalidatePath(`/events/${eventId}/respond`)
  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

export async function addContribution(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = await getDb()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const eventId = formData.get('event_id') as string
  const participantId = formData.get('participant_id') as string
  const category = formData.get('category') as ContributionCategory
  const name = formData.get('name') as string
  const quantity = formData.get('quantity') as string
  const detail = formData.get('detail') as string | null
  const note = formData.get('note') as string | null

  if (!name || !quantity || !category) {
    return { error: 'Nom, quantité et catégorie sont obligatoires.' }
  }

  const { error } = await db
    .from('contributions')
    .insert({ participant_id: participantId, event_id: eventId, category, name, quantity, detail: detail || null, note: note || null })

  if (error) return { error: "Erreur lors de l'ajout de la contribution." }

  revalidatePath(`/events/${eventId}/respond`)
  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

export async function deleteContribution(id: string, eventId: string) {
  const db = await getDb()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { error } = await db.from('contributions').delete().eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression.' }

  revalidatePath(`/events/${eventId}/respond`)
  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

export async function updateProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = await getDb()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string | null
  const displayName = formData.get('display_name') as string | null
  const phone = formData.get('phone') as string | null
  const notes = formData.get('notes') as string | null
  const allergens = formData.getAll('allergens') as string[]
  const dietaryRestrictions = formData.getAll('dietary_restrictions') as string[]

  const { error } = await db
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName || null,
      display_name: displayName || firstName,
      phone: phone || null,
      notes: notes || null,
      allergens,
      dietary_restrictions: dietaryRestrictions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: 'Erreur lors de la mise à jour du profil.' }

  revalidatePath('/profile')
  return { success: true }
}
