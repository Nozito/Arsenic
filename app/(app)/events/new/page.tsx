import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateEventForm } from '@/components/events/create-event-form'

export const metadata: Metadata = { title: 'Nouvel événement' }

export default async function NewEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  return (
    <main
      className="flex flex-1 items-start justify-center px-5 pt-12 pb-20 sm:items-center sm:pt-0 min-h-[calc(100vh-52px)]"
      style={{ background: 'var(--color-bg)' }}
    >
      <div
        className="w-full max-w-lg rounded-[var(--radius-2xl)] border p-8 sm:p-10"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface-elevated)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <CreateEventForm />
      </div>
    </main>
  )
}
