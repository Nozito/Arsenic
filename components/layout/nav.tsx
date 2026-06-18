import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/features/auth/actions'

export async function Nav() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()

  let displayName: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, first_name')
      .eq('id', user.id)
      .single()
    displayName = profile?.display_name ?? profile?.first_name ?? user.email?.split('@')[0] ?? null
  }

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-sm"
      style={{
        borderColor: 'var(--color-border)',
        background: 'color-mix(in srgb, var(--color-surface-elevated) 96%, transparent)',
      }}
    >
      <div className="mx-auto flex h-13 max-w-5xl items-center justify-between px-5 sm:px-6">
        {/* Marque */}
        <Link
          href={user ? '/dashboard' : '/'}
          className="flex items-center gap-2.5 group"
          aria-label="Arsenic — accueil"
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-[3px] transition-colors"
            style={{ background: 'var(--color-text)' }}
          >
            <span className="block h-[7px] w-[7px] rounded-[1px] bg-white opacity-90" />
          </span>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            Arsenic
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-0.5" aria-label="Navigation principale">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="h-8 px-3 flex items-center text-sm rounded-[var(--radius-sm)] transition-ui"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Événements
              </Link>
              <Link
                href="/profile"
                className="h-8 px-3 flex items-center text-sm rounded-[var(--radius-sm)] transition-ui"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {displayName ?? 'Profil'}
              </Link>
              <form action={signOut} className="ml-1">
                <button
                  type="submit"
                  className="h-8 px-3 text-xs font-medium rounded-[var(--radius-sm)] transition-ui"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  Quitter
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="h-8 px-3 flex items-center text-sm rounded-[var(--radius-sm)] transition-ui"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Connexion
              </Link>
              <Link
                href="/auth/sign-up"
                className="ml-1 h-8 px-4 flex items-center text-sm font-medium rounded-[var(--radius-sm)] transition-ui"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-accent-fg)',
                }}
              >
                Inscription
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
