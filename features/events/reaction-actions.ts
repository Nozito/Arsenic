'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleReaction(
  contributionId: string,
  eventId: string
): Promise<{ error?: string; liked?: boolean }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = await createClient() as any
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: existing } = await db
    .from('contribution_reactions')
    .select('id')
    .eq('contribution_id', contributionId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await db.from('contribution_reactions').delete().eq('id', existing.id)
    revalidatePath(`/events/${eventId}/respond`)
    revalidatePath(`/events/${eventId}/manage`)
    return { liked: false }
  } else {
    await db.from('contribution_reactions').insert({
      contribution_id: contributionId,
      user_id: user.id,
      reaction_type: 'like',
    })
    revalidatePath(`/events/${eventId}/respond`)
    revalidatePath(`/events/${eventId}/manage`)
    return { liked: true }
  }
}
