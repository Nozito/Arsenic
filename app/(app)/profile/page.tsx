import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { ProfileForm } from '@/components/profile/profile-form'
import type { Profile, Contribution } from '@/types'

export const metadata: Metadata = { title: 'Mon profil' }

export default async function ProfilePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [{ data: profileRaw }, { data: recentContribsRaw }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('contributions')
      .select('id, name, quantity, category, created_at')
      .eq('event_participants.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const recentContributions = (recentContribsRaw ?? []) as Contribution[]

  if (!profileRaw) {
    const { data: newProfileRaw } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email ?? '',
        first_name: user.user_metadata?.first_name ?? null,
        last_name: user.user_metadata?.last_name ?? null,
        display_name:
          user.user_metadata?.display_name ??
          user.email?.split('@')[0] ??
          null,
      })
      .select()
      .single()

    if (!newProfileRaw) redirect('/dashboard')

    return (
      <PageWrapper narrow>
        <PageHeader title="Mon profil" subtitle="Complétez vos informations." />
        <ProfileForm profile={newProfileRaw as Profile} recentContributions={[]} />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper narrow>
      <PageHeader
        title="Mon profil"
        subtitle="Gérez vos informations et préférences alimentaires."
      />
      <ProfileForm profile={profileRaw as Profile} recentContributions={recentContributions} />
    </PageWrapper>
  )
}
