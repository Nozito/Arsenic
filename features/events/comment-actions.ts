'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface CommentState {
  error?: string
  success?: boolean
}

export async function addComment(
  prevState: CommentState,
  formData: FormData
): Promise<CommentState> {
  const eventId = formData.get('event_id') as string
  const content = (formData.get('content') as string)?.trim()

  if (!content) return { error: 'Le commentaire est vide.' }
  if (content.length > 500) return { error: 'Maximum 500 caractères.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = await createClient() as any
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Vérifier que l'utilisateur est participant ou organisateur
  const [{ data: asParticipant }, { data: asOrganizer }] = await Promise.all([
    db.from('event_participants').select('id').eq('event_id', eventId).eq('user_id', user.id).single(),
    db.from('events').select('id').eq('id', eventId).eq('organizer_id', user.id).single(),
  ])

  if (!asParticipant && !asOrganizer) {
    return { error: "Vous n'êtes pas participant de cet événement." }
  }

  const { error } = await db.from('event_comments').insert({
    event_id: eventId,
    user_id: user.id,
    content,
  })

  if (error) return { error: "Erreur lors de l'envoi." }

  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}/respond`)
  return { success: true }
}

export async function deleteComment(commentId: string, eventId: string): Promise<CommentState> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = await createClient() as any
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Soft delete — la RLS policy "comments_delete_own_or_organizer" vérifie l'autorisation
  const { error } = await db
    .from('event_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) return { error: 'Erreur lors de la suppression.' }

  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}/respond`)
  return { success: true }
}
