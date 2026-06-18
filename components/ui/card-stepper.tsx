'use client'

import { cn } from '@/utils/cn'

export interface StepDef {
  id: string
  label: string
  title: string
  description?: string
  content: React.ReactNode
  optional?: boolean
}

interface CardStepperProps {
  steps: StepDef[]
  currentStep: number
  direction: 'next' | 'prev'
  onNext: () => void
  onPrev: () => void
  nextLabel?: string
  prevLabel?: string
  nextDisabled?: boolean
  isLastStep?: boolean
  submitLabel?: string
  isSubmitting?: boolean
  submitButton?: React.ReactNode
  stepError?: string | null
  className?: string
}

export function CardStepper({
  steps,
  currentStep,
  direction,
  onNext,
  onPrev,
  nextLabel = 'Continuer',
  prevLabel = 'Retour',
  nextDisabled = false,
  isLastStep = false,
  submitLabel = 'Confirmer',
  isSubmitting = false,
  submitButton,
  stepError,
  className,
}: CardStepperProps) {
  const step = steps[currentStep]
  const animClass = direction === 'next' ? 'step-enter-next' : 'step-enter-prev'
  const total = steps.length

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Progress indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* Card content */}
      <div className="overflow-hidden">
        <div key={`${step.id}-${currentStep}`} className={animClass}>
          {/* Step header */}
          <div className="mb-7">
            <p className="text-xs font-medium text-[var(--color-text-faint)] mb-3 tabular">
              {currentStep + 1} / {total}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] leading-tight mb-2">
              {step.title}
            </h2>
            {step.description && (
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {step.description}
              </p>
            )}
          </div>

          {/* Step fields */}
          <div className="mb-6">
            {step.content}
          </div>

          {/* Inline step error */}
          {stepError && (
            <div
              role="alert"
              className="mb-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {stepError}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={onPrev}
              disabled={isSubmitting}
              className={cn(
                'h-9 px-4 text-sm font-medium rounded-[var(--radius-md)]',
                'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                'hover:bg-[var(--color-surface-muted)]',
                'transition-ui disabled:opacity-40'
              )}
            >
              {prevLabel}
            </button>
          )}
        </div>

        <div>
          {isLastStep ? (
            submitButton ?? (
              <button
                type="submit"
                disabled={isSubmitting || nextDisabled}
                className={cn(
                  'h-11 px-8 text-sm font-medium rounded-[var(--radius-md)]',
                  'bg-[var(--color-accent)] text-[var(--color-accent-fg)]',
                  'hover:bg-[var(--color-accent-hover)]',
                  'transition-ui disabled:opacity-40 disabled:pointer-events-none',
                  'active:scale-[0.98]'
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {submitLabel}
                  </span>
                ) : submitLabel}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || isSubmitting}
              className={cn(
                'h-9 px-5 text-sm font-medium rounded-[var(--radius-md)]',
                'bg-[var(--color-text)] text-[var(--color-surface-elevated)]',
                'hover:bg-[var(--color-text-muted)]',
                'transition-ui disabled:opacity-40 disabled:pointer-events-none',
                'active:scale-[0.98]',
                'flex items-center gap-2'
              )}
            >
              {nextLabel}
              <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ steps, currentStep }: { steps: StepDef[]; currentStep: number }) {
  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="h-px w-full bg-[var(--color-border)] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-500 ease-out rounded-full"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      {/* Labels — only show current step label */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              'text-xs transition-ui',
              i === currentStep
                ? 'text-[var(--color-text)] font-semibold'
                : i < currentStep
                  ? 'text-[var(--color-text-muted)]'
                  : 'text-[var(--color-text-faint)]'
            )}
          >
            {s.label}
            {i < steps.length - 1 && (
              <span className="ml-1.5 text-[var(--color-border-strong)]">/</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
