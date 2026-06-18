'use client'

import { useActionState, useState, useRef } from 'react'
import Link from 'next/link'
import { signUp } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardStepper } from '@/components/ui/card-stepper'
import type { StepDef } from '@/components/ui/card-stepper'
import { DIETARY_OPTIONS, ALLERGEN_OPTIONS } from '@/types'
import { cn } from '@/utils/cn'

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, {})
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [stepError, setStepError] = useState<string | null>(null)
  const [dietary, setDietary] = useState<string[]>([])
  const [allergens, setAllergens] = useState<string[]>([])

  // Valeurs capturées en state au moment d'avancer (les refs deviennent null une fois le step démonté)
  const [capturedEmail, setCapturedEmail] = useState('')
  const [capturedPassword, setCapturedPassword] = useState('')
  const [capturedFirstName, setCapturedFirstName] = useState('')
  const [capturedLastName, setCapturedLastName] = useState('')

  // Refs pour validation inline
  const emailRef    = useRef<HTMLInputElement>(null)
  const passRef     = useRef<HTMLInputElement>(null)
  const passConfRef = useRef<HTMLInputElement>(null)
  const firstRef    = useRef<HTMLInputElement>(null)
  const lastRef     = useRef<HTMLInputElement>(null)

  function validate(step: number): string | null {
    if (step === 0) {
      const v = emailRef.current?.value ?? ''
      if (!v) return 'Votre adresse email est requise.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Adresse email invalide.'
    }
    if (step === 1) {
      const p = passRef.current?.value ?? ''
      const c = passConfRef.current?.value ?? ''
      if (!p) return 'Le mot de passe est requis.'
      if (p.length < 8) return 'Minimum 8 caractères.'
      if (p !== c) return 'Les mots de passe ne correspondent pas.'
    }
    if (step === 2) {
      const f = firstRef.current?.value ?? ''
      if (!f.trim()) return 'Votre prénom est requis.'
    }
    return null
  }

  function handleNext() {
    const err = validate(currentStep)
    if (err) { setStepError(err); return }
    // Capturer les valeurs avant que le step se démonte
    if (currentStep === 0) setCapturedEmail(emailRef.current?.value ?? '')
    if (currentStep === 1) {
      setCapturedPassword(passRef.current?.value ?? '')
    }
    if (currentStep === 2) {
      setCapturedFirstName(firstRef.current?.value ?? '')
      setCapturedLastName(lastRef.current?.value ?? '')
    }
    setStepError(null)
    setDirection('next')
    setCurrentStep((s) => s + 1)
  }

  function handlePrev() {
    setStepError(null)
    setDirection('prev')
    setCurrentStep((s) => s - 1)
  }

  if (state.success) {
    return (
      <div className="w-full max-w-md mx-auto step-enter-up">
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-muted)] px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
            <svg className="h-5 w-5 text-[var(--color-accent)]" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Compte créé</h2>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-5">
            Vérifiez votre email pour confirmer votre inscription.
          </p>
          <Link href="/auth/sign-in">
            <Button size="sm" variant="outline">Se connecter</Button>
          </Link>
        </div>
      </div>
    )
  }

  const STEPS: StepDef[] = [
    {
      id: 'email',
      label: 'Email',
      title: 'Bienvenue sur Arsenic.',
      description: 'Entrez votre adresse email pour créer votre compte.',
      content: (
        <Input
          ref={emailRef}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleNext())}
        />
      ),
    },
    {
      id: 'password',
      label: 'Mot de passe',
      title: 'Créez votre mot de passe.',
      description: 'Au moins 8 caractères.',
      content: (
        <div className="flex flex-col gap-4">
          <Input
            ref={passRef}
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            autoFocus
          />
          <Input
            ref={passConfRef}
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Confirmez le mot de passe"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleNext())}
          />
        </div>
      ),
    },
    {
      id: 'identity',
      label: 'Votre nom',
      title: 'Comment vous appelle-t-on ?',
      description: 'Votre nom sera visible par les organisateurs.',
      content: (
        <div className="flex flex-col gap-4">
          <Input
            ref={firstRef}
            name="first_name"
            autoComplete="given-name"
            placeholder="Prénom"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleNext())}
          />
          <Input
            ref={lastRef}
            name="last_name"
            autoComplete="family-name"
            placeholder="Nom (facultatif)"
          />
        </div>
      ),
    },
    {
      id: 'dietary',
      label: 'Habitudes',
      title: 'Vos habitudes alimentaires.',
      description: 'Informations partagées avec les organisateurs de vos événements.',
      optional: true,
      content: (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-3">Régimes</p>
            <TagSelector
              options={DIETARY_OPTIONS}
              selected={dietary}
              onChange={setDietary}
              name="dietary_restrictions"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-3">Allergènes à signaler</p>
            <TagSelector
              options={ALLERGEN_OPTIONS}
              selected={allergens}
              onChange={setAllergens}
              name="allergens"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'confirm',
      label: 'Confirmation',
      title: 'Tout est prêt.',
      description: 'Vérifiez vos informations avant de créer votre compte.',
      content: (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] divide-y divide-[var(--color-border)] overflow-hidden">
          <SummaryRow label="Email" value={capturedEmail || '—'} />
          <SummaryRow label="Prénom" value={capturedFirstName || '—'} />
          {dietary.length > 0 && (
            <SummaryRow label="Régimes" value={dietary.join(', ')} />
          )}
          {allergens.length > 0 && (
            <SummaryRow label="Allergènes" value={allergens.join(', ')} />
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="w-full max-w-md mx-auto">
      {state.error && (
        <div
          role="alert"
          className="mb-6 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <form action={action}>
        {/* Valeurs des steps passés — les inputs DOM sont démontés, on passe via hidden */}
        {capturedEmail    && <input type="hidden" name="email"      value={capturedEmail} />}
        {capturedPassword && <input type="hidden" name="password"   value={capturedPassword} />}
        {capturedFirstName && <input type="hidden" name="first_name" value={capturedFirstName} />}
        {capturedLastName  && <input type="hidden" name="last_name"  value={capturedLastName} />}
        {dietary.map((v)   => <input key={v} type="hidden" name="dietary_restrictions" value={v} />)}
        {allergens.map((v) => <input key={v} type="hidden" name="allergens" value={v} />)}

        <CardStepper
          steps={STEPS}
          currentStep={currentStep}
          direction={direction}
          onNext={handleNext}
          onPrev={handlePrev}
          stepError={stepError}
          isLastStep={currentStep === STEPS.length - 1}
          submitLabel="Créer mon compte"
          isSubmitting={pending}
        />
      </form>

      <p className="mt-8 text-center text-xs text-[var(--color-text-faint)]">
        Déjà inscrit ?{' '}
        <Link href="/auth/sign-in" className="font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-2">
          Se connecter
        </Link>
      </p>
    </div>
  )
}

// Tag selector réutilisable
function TagSelector({
  options,
  selected,
  onChange,
  name,
}: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  name: string
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(opt)}
            className={cn(
              'tag-select',
              active && 'bg-[var(--color-accent-muted)] border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
            )}
          >
            {opt}
          </button>
        )
      })}
      {selected.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <span className="text-xs text-[var(--color-text-faint)] w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[var(--color-text)] font-medium flex-1 leading-snug">{value}</span>
    </div>
  )
}
