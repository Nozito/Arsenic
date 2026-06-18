'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export interface InviteAuthState {
  error?: string
  field?: 'email' | 'password' | 'first_name'
}

// ----------------------------------------------------------------
// Inscription rapide depuis une invitation (3 champs, sans confirm email)
// ----------------------------------------------------------------
export async function signUpAndJoinEvent(
  prevState: InviteAuthState,
  formData: FormData
): Promise<InviteAuthState> {
  const token     = formData.get('invite_token') as string
  const email     = (formData.get('email') as string)?.trim()
  const password  = formData.get('password') as string
  const firstName = (formData.get('first_name') as string)?.trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Adresse email invalide.', field: 'email' }
  }
  if (!password || password.length < 8) {
    return { error: 'Mot de passe trop court (8 caractères minimum).', field: 'password' }
  }
  if (!firstName || firstName.length < 2) {
    return { error: 'Prénom requis (au moins 2 caractères).', field: 'first_name' }
  }

  const service = createServiceClient()

  // Vérifier l'événement
  const { data: event } = await service
    .from('events')
    .select('id, status')
    .eq('invite_token', token)
    .single()

  if (!event) return { error: "Lien d'invitation invalide." }
  if (event.status === 'cancelled') return { error: "Cet événement a été annulé." }
  if (event.status === 'closed') return { error: "Cet événement est fermé aux nouvelles réponses." }

  // Créer l'utilisateur via l'API admin (bypass email confirmation)
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      display_name: firstName,
    },
  })

  if (createError) {
    if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
      return { error: 'Un compte existe déjà avec cet email. Connectez-vous à la place.', field: 'email' }
    }
    return { error: `Erreur : ${createError.message}` }
  }

  const userId = created.user.id

  // Créer le profil manuellement (le trigger peut ne pas se déclencher via admin)
  await service.from('profiles').upsert({
    id: userId,
    email,
    first_name: firstName,
    display_name: firstName,
  })

  // Rejoindre l'événement
  await service.from('event_participants').insert({
    event_id: event.id,
    user_id: userId,
  })

  // Se connecter pour créer la session (cookies)
  const server = await createClient()
  const { error: signInError } = await server.auth.signInWithPassword({ email, password })

  if (signInError) {
    return { error: 'Compte créé mais connexion échouée. Connectez-vous manuellement.' }
  }

  redirect(`/events/${event.id}/respond`)
}

// ----------------------------------------------------------------
// Connexion rapide depuis une invitation
// ----------------------------------------------------------------
export async function signInAndJoinEvent(
  prevState: InviteAuthState,
  formData: FormData
): Promise<InviteAuthState> {
  const token    = formData.get('invite_token') as string
  const email    = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email) return { error: "Email requis.", field: 'email' }
  if (!password) return { error: "Mot de passe requis.", field: 'password' }

  const server = await createClient()

  const { error: signInError } = await server.auth.signInWithPassword({ email, password })

  if (signInError) {
    if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('invalid_credentials')) {
      return { error: 'Email ou mot de passe incorrect.', field: 'email' }
    }
    if (signInError.message.includes('Email not confirmed') || signInError.message.includes('email_not_confirmed')) {
      return { error: "Email non confirmé. Vérifiez votre boîte mail." }
    }
    return { error: `Erreur de connexion : ${signInError.message}` }
  }

  const { data: { user } } = await server.auth.getUser()
  if (!user) return { error: 'Connexion échouée.' }

  const service = createServiceClient()

  // Vérifier l'événement
  const { data: event } = await service
    .from('events')
    .select('id, status')
    .eq('invite_token', token)
    .single()

  if (!event) return { error: "Lien d'invitation invalide." }
  if (event.status === 'cancelled') return { error: "Cet événement a été annulé." }

  // Rejoindre si pas encore participant
  const { data: existing } = await service
    .from('event_participants')
    .select('id')
    .eq('event_id', event.id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    await service.from('event_participants').insert({
      event_id: event.id,
      user_id: user.id,
    })
  }

  redirect(`/events/${event.id}/respond`)
}
