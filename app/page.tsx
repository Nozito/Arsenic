import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/layout/nav'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      <Nav />

      <main className="flex flex-1 flex-col">
        {/* Hero — sobre, concentré */}
        <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <p
            className="text-xs font-medium tracking-[0.22em] uppercase mb-8"
            style={{ color: 'var(--color-text-faint)' }}
          >
            Arsenic — Pique-nique collaboratif
          </p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08] mb-6 max-w-2xl"
            style={{ color: 'var(--color-text)' }}
          >
            Coordonnez votre repas en plein air.
          </h1>
          <p
            className="text-base sm:text-lg leading-relaxed mb-10 max-w-md"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Un lien d'invitation. Chaque participant sait ce qu'il apporte.
            L'organisateur voit tout.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/auth/sign-up"
              className="h-11 px-7 flex items-center text-sm font-medium rounded-[var(--radius-md)] transition-ui"
              style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
            >
              Organiser un événement
            </Link>
            <Link
              href="/auth/sign-in"
              className="h-11 px-6 flex items-center text-sm font-medium rounded-[var(--radius-md)] border transition-ui"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface-elevated)',
                color: 'var(--color-text-muted)',
              }}
            >
              Se connecter
            </Link>
          </div>
        </section>

        {/* Ligne séparatrice */}
        <div className="h-px mx-6 sm:mx-0" style={{ background: 'var(--color-border)' }} />

        {/* Fonctionnalités — trois colonnes sobres */}
        <section style={{ background: 'var(--color-surface-elevated)' }}>
          <div className="mx-auto max-w-4xl px-6 py-20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex flex-col">
                  <div
                    className="w-5 h-px mb-5"
                    style={{ background: 'var(--color-accent)' }}
                  />
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
          <div className="mx-auto max-w-4xl px-6 py-20">
            <p
              className="text-xs font-medium tracking-[0.22em] uppercase mb-12"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Comment ça marche
            </p>
            <div className="flex flex-col gap-8 max-w-lg">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-5">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold shrink-0 mt-0.5 tabular"
                    style={{
                      borderColor: 'var(--color-border-strong)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                      {step.title}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section
          className="border-t"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
        >
          <div className="mx-auto max-w-2xl px-6 py-20 text-center">
            <h2
              className="text-2xl font-semibold tracking-tight mb-3"
              style={{ color: 'var(--color-text)' }}
            >
              Prêt à organiser ?
            </h2>
            <p
              className="text-sm mb-8 max-w-xs mx-auto leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Gratuit, sans abonnement. Quelques secondes pour créer votre premier événement.
            </p>
            <Link
              href="/auth/sign-up"
              className="inline-flex h-11 px-8 items-center text-sm font-medium rounded-[var(--radius-md)] transition-ui"
              style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
            >
              Commencer maintenant
            </Link>
          </div>
        </section>
      </main>

      <footer
        className="border-t"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
      >
        <div
          className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between text-xs"
          style={{ color: 'var(--color-text-faint)' }}
        >
          <span className="font-medium tracking-tight">Arsenic</span>
          <span>Fait avec soin</span>
        </div>
      </footer>
    </div>
  )
}

const FEATURES = [
  {
    title: 'Lien de partage',
    description:
      'Un lien unique par événement. Vos invités remplissent leur réponse en deux minutes, sans inscription obligatoire.',
  },
  {
    title: 'Zéro doublon',
    description:
      "Chaque participant voit ce que les autres apportent déjà. Un avertissement s'affiche en temps réel.",
  },
  {
    title: 'Vue organisateur',
    description:
      "Tableau de bord complet : présences, allergènes, contributions. Tout visible d'un seul coup d'œil.",
  },
] as const

const STEPS = [
  {
    title: 'Créez votre événement',
    description: 'Renseignez les informations essentielles : date, lieu, catégories de contributions souhaitées.',
  },
  {
    title: 'Partagez le lien ou le QR code',
    description: 'Envoyez le lien à vos invités ou affichez le QR code.',
  },
  {
    title: 'Vos invités répondent',
    description: "Chacun indique sa présence et ce qu'il apporte. L'interface les prévient des doublons.",
  },
  {
    title: 'Vous pilotez',
    description: "Suivez les réponses en temps réel sur votre tableau de bord d'organisateur.",
  },
] as const
