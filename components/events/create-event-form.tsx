'use client'

import { useActionState, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from '@/features/events/actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CardStepper } from '@/components/ui/card-stepper'
import type { StepDef } from '@/components/ui/card-stepper'
import { CONTRIBUTION_CATEGORIES } from '@/types'
import type { ContributionCategory } from '@/types'
import { cn } from '@/utils/cn'

const ALL_CATEGORIES = CONTRIBUTION_CATEGORIES.map((c) => c.value)

export function CreateEventForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createEvent, {})

  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [stepError, setStepError] = useState<string | null>(null)

  const [categories, setCategories] = useState<ContributionCategory[]>(ALL_CATEGORIES)
  const [allergensEnabled, setAllergens] = useState(true)
  const [dietaryEnabled, setDietary] = useState(true)
  const [plusOneEnabled, setPlusOne] = useState(false)

  // Refs pour validation
  const titleRef    = useRef<HTMLInputElement>(null)
  const dateRef     = useRef<HTMLInputElement>(null)
  const countRef    = useRef<HTMLInputElement>(null)

  // Redirect après création
  useEffect(() => {
    if (state.success && state.data?.eventId) {
      router.push(`/events/${state.data.eventId}/manage`)
    }
  }, [state.success, state.data?.eventId, router])

  function validate(step: number): string | null {
    if (step === 0) {
      if (!titleRef.current?.value?.trim()) return "Le titre de l’événement est requis."
    }
    if (step === 1) {
      if (!dateRef.current?.value) return 'La date est requise.'
    }
    return null
  }

  function handleNext() {
    const err = validate(currentStep)
    if (err) { setStepError(err); return }
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
      id: 'basics',
      label: 'Événement',
      title: 'Quel est votre événement ?',
      description: 'Ces informations sont affichées à vos invités.',
      content: (
        <div className="flex flex-col gap-4">
          <Input
            ref={titleRef}
            name="title"
            label="Titre"
            required
            placeholder="Pique-nique du dimanche"
            maxLength={120}
            autoFocus
          />
          <Textarea
            name="description"
            label="Description"
            placeholder="Quelques mots sur l'événement…"
            rows={3}
          />
        </div>
      ),
    },
    {
      id: 'datetime',
      label: 'Date & lieu',
      title: 'Quand et où ?',
      description: 'Informations pratiques pour vos invités.',
      content: (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input ref={dateRef} label="Date" name="date" type="date" required />
            <Input label="Heure" name="time" type="time" />
          </div>
          <Input
            label="Lieu"
            name="location"
            placeholder="Parc de la Villette, Paris"
          />
        </div>
      ),
    },
    {
      id: 'logistics',
      label: 'Participants',
      title: 'Combien de personnes attendez-vous ?',
      description: 'Aide à estimer les quantités de contributions.',
      content: (
        <div className="grid grid-cols-2 gap-4">
          <Input
            ref={countRef}
            label="Participants attendus"
            name="expected_participants"
            type="number"
            min="1"
            max="500"
            placeholder="20"
          />
          <Input
            label="Date limite de réponse"
            name="response_deadline"
            type="date"
          />
        </div>
      ),
    },
    {
      id: 'categories',
      label: 'Contributions',
      title: 'Quelles contributions voulez-vous gérer ?',
      description: 'Les participants choisiront dans ces catégories.',
      content: (
        <CategoryPicker
          selected={categories}
          onChange={(vals) => setCategories(vals as ContributionCategory[])}
        />
      ),
    },
    {
      id: 'constraints',
      label: 'Contraintes',
      title: 'Des contraintes alimentaires à gérer ?',
      description: 'Activez ce que vous souhaitez recueillir auprès des participants.',
      content: (
        <div className="flex flex-col gap-4">
          <Toggle
            label="Demander les allergènes"
            description="Les participants déclarent leurs allergènes."
            checked={allergensEnabled}
            onChange={setAllergens}
          />
          <Toggle
            label="Demander les régimes alimentaires"
            description="Végétarien, sans gluten, halal, etc."
            checked={dietaryEnabled}
            onChange={setDietary}
          />
          <Toggle
            label='Autoriser les "+1"'
            description="Un participant peut venir accompagné."
            checked={plusOneEnabled}
            onChange={setPlusOne}
          />
          {/* Hidden inputs */}
          <input type="hidden" name="allergens_enabled" value={String(allergensEnabled)} />
          <input type="hidden" name="dietary_enabled"   value={String(dietaryEnabled)} />
          <input type="hidden" name="plus_one_enabled"  value={String(plusOneEnabled)} />
        </div>
      ),
    },
    {
      id: 'message',
      label: 'Message',
      title: 'Un message pour vos invités ?',
      description: "Texte affiché à l'ouverture du lien d'invitation. Facultatif.",
      optional: true,
      content: (
        <Textarea
          name="invitation_message"
          placeholder="Bonjour ! Merci de confirmer votre présence et ce que vous apportez…"
          rows={4}
        />
      ),
    },
    {
      id: 'review',
      label: 'Confirmation',
      title: 'Récapitulatif.',
      description: "Vérifiez les informations avant de créer l'événement.",
      content: (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden"
            style={{ background: 'var(--color-surface-muted)' }}
          >
            <ReviewRow label="Titre" getValue={() => titleRef.current?.value ?? '—'} />
            <ReviewRow label="Date" getValue={() => dateRef.current?.value ?? '—'} />
            <ReviewRow
              label="Catégories"
              getValue={() =>
                categories.length === ALL_CATEGORIES.length
                  ? 'Toutes'
                  : `${categories.length} sélectionnées`
              }
            />
          </div>
          {state.error && (
            <div role="alert" className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="w-full max-w-lg mx-auto">
      <form action={action}>
        {/* Hidden inputs catégories */}
        {categories.map((c) => (
          <input key={c} type="hidden" name="categories_enabled" value={c} />
        ))}

        <CardStepper
          steps={STEPS}
          currentStep={currentStep}
          direction={direction}
          onNext={handleNext}
          onPrev={handlePrev}
          stepError={stepError}
          isLastStep={currentStep === STEPS.length - 1}
          submitLabel={state.success ? 'Création réussie…' : "Créer l'événement"}
          isSubmitting={pending || (!!state.success && !!state.data?.eventId)}
        />
      </form>
    </div>
  )
}

// Sélecteur de catégories
function CategoryPicker({
  selected,
  onChange,
}: {
  selected: ContributionCategory[]
  onChange: (v: ContributionCategory[]) => void
}) {
  const toggle = (v: ContributionCategory) =>
    onChange(
      selected.includes(v)
        ? selected.filter((c) => c !== v)
        : [...selected, v]
    )

  return (
    <div className="flex flex-wrap gap-2">
      {CONTRIBUTION_CATEGORIES.map(({ value, label }) => {
        const active = selected.includes(value)
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(value)}
            className={cn(
              'h-9 px-3.5 text-sm font-medium rounded-[var(--radius-md)] border transition-ui select-none',
              active
                ? 'bg-[var(--color-accent-muted)] border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
                : 'bg-[var(--color-surface-elevated)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// Toggle on/off
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      className="flex items-start gap-4 cursor-pointer select-none group p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-ui"
      style={{ background: 'var(--color-surface-muted)' }}
    >
      {/* Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors',
          checked
            ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
            : 'bg-[var(--color-surface-elevated)] border-[var(--color-border-strong)]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-all duration-200',
            checked ? 'left-4' : 'left-0.5'
          )}
        />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text)] leading-snug">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--color-text-faint)] leading-snug">{description}</p>
        )}
      </div>
    </label>
  )
}

// Ligne de récapitulatif
function ReviewRow({ label, getValue }: { label: string; getValue: () => string }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <span className="text-xs text-[var(--color-text-faint)] w-24 shrink-0">{label}</span>
      <span className="text-sm text-[var(--color-text)] font-medium flex-1">{getValue()}</span>
    </div>
  )
}
