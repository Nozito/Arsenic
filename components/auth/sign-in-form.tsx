'use client'

import { useActionState, useState, useRef } from 'react'
import Link from 'next/link'
import { signIn } from '@/features/auth/actions'
import { Input } from '@/components/ui/input'
import { CardStepper } from '@/components/ui/card-stepper'
import type { StepDef } from '@/components/ui/card-stepper'

interface SignInFormProps {
  redirect?: string
}

export function SignInForm({ redirect }: SignInFormProps) {
  const [state, action, pending] = useActionState(signIn, {})
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [stepError, setStepError] = useState<string | null>(null)
  const [capturedEmail, setCapturedEmail] = useState('')

  const emailRef = useRef<HTMLInputElement>(null)

  function validate(step: number): string | null {
    if (step === 0) {
      const v = emailRef.current?.value ?? ''
      if (!v) return 'Votre adresse email est requise.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Adresse email invalide.'
    }
    return null
  }

  function handleNext() {
    const err = validate(currentStep)
    if (err) { setStepError(err); return }
    if (currentStep === 0) {
      setCapturedEmail(emailRef.current?.value ?? '')
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

  const STEPS: StepDef[] = [
    {
      id: 'email',
      label: 'Email',
      title: 'Bon retour.',
      description: "Entrez l’adresse email de votre compte Arsenic.",
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
      title: 'Votre mot de passe.',
      description: 'Entrez votre mot de passe pour vous connecter.',
      content: (
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          autoFocus
        />
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
        {redirect && <input type="hidden" name="redirect" value={redirect} />}
        {capturedEmail && <input type="hidden" name="email" value={capturedEmail} />}

        <CardStepper
          steps={STEPS}
          currentStep={currentStep}
          direction={direction}
          onNext={handleNext}
          onPrev={handlePrev}
          stepError={stepError}
          isLastStep={currentStep === STEPS.length - 1}
          submitLabel="Se connecter"
          isSubmitting={pending}
        />
      </form>

      <p className="mt-8 text-center text-xs text-[var(--color-text-faint)]">
        Pas encore de compte ?{' '}
        <Link href="/auth/sign-up" className="font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-2">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
