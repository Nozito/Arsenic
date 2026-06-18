import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Header minimal */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className="mx-auto flex h-13 max-w-5xl items-center px-6">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Arsenic — accueil">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[3px] transition-colors"
              style={{ background: 'var(--color-text)' }}
            >
              <span className="block h-2 w-2 rounded-[1px] bg-white opacity-90" />
            </span>
            <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>
              Arsenic
            </span>
          </Link>
        </div>
      </header>

      {/* Contenu centré — card bien définie */}
      <main className="flex flex-1 items-start justify-center px-5 pt-12 pb-20 sm:items-center sm:pt-0">
        <div
          className="w-full max-w-md rounded-[var(--radius-2xl)] border p-8 sm:p-10"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface-elevated)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
