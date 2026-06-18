'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface AuthState {
  error?: string
  success?: boolean
}

export async function signUp(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string

  if (!email || !password || !firstName) {
    return { error: 'Tous les champs obligatoires doivent être remplis.' }
  }

  if (password.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`.trim(),
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Un compte existe déjà avec cet email.' }
    }
    return { error: 'Erreur lors de la création du compte. Veuillez réessayer.' }
  }

  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      first_name: firstName,
      last_name: lastName || null,
      display_name: `${firstName} ${lastName}`.trim(),
    })
  }

  return { success: true }
}

export async function signIn(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string | null

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (
      error.message.includes('Invalid login credentials') ||
      error.message.includes('invalid_credentials')
    ) {
      return { error: 'Email ou mot de passe incorrect.' }
    }
    if (
      error.message.includes('Email not confirmed') ||
      error.message.includes('email_not_confirmed')
    ) {
      return { error: "Votre email n'a pas encore été confirmé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation." }
    }
    if (error.message.includes('User not found')) {
      return { error: 'Aucun compte trouvé avec cet email.' }
    }
    return { error: `Erreur de connexion : ${error.message}` }
  }

  redirect(redirectTo ?? '/dashboard')
}

export async function signOut() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  await supabase.auth.signOut()
  redirect('/auth/sign-in')
}
