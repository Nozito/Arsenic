'use client'

import { useState, useEffect, useTransition } from 'react'
import { CardStepper } from '@/components/ui/card-stepper'
import type { StepDef } from '@/components/ui/card-stepper'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { submitResponse, addContribution, deleteContribution } from '@/features/events/actions'
import { detectDuplicates } from '@/utils/duplicates'
import {
  DIETARY_OPTIONS,
  ALLERGEN_OPTIONS,
  CONTRIBUTION_CATEGORIES,
  type Event,
  type ParticipantResponse,
  type Contribution,
  type Profile,
  type ResponseStatus,
  type ContributionCategory,
} from '@/types'
import type { ContributionSuggestion } from '@/components/contributions/contribution-form'
import { cn } from '@/utils/cn'

export interface RespondStepperProps {
  eventId: string
  participantId: string
  event: Event
  existingResponse: ParticipantResponse | null
  existingContributions: Contribution[]
  allContributions: Array<Contribution & { contributor_name: string }>
  suggestions: ContributionSuggestion[]
  profile: Profile | null
  statusCounts?: Record<string, number>
}

const STATUS_OPTIONS: { value: ResponseStatus; label: string; sub: string }[] = [
  { value: 'attending',     label: 'Présent',    sub: 'Je serai là' },
  { value: 'maybe',         label: 'Peut-être',  sub: 'Je ne suis pas sûr' },
  { value: 'not_attending', label: 'Absent',     sub: 'Je ne peux pas' },
]

export function RespondStepper({
  eventId,
  participantId,
  event,
  existingResponse,
  existingContributions,
  allContributions,
  suggestions,
  profile,
  statusCounts = {},
}: RespondStepperProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // Données accumulées
  const [status, setStatus]   = useState<ResponseStatus>(existingResponse?.status ?? 'attending')
  const [headcount, setHc]    = useState(existingResponse?.headcount ?? 1)
  const [allergens, setAll]   = useState<string[]>(existingResponse?.allergens ?? profile?.allergens ?? [])
  const [dietary, setDiet]    = useState<string[]>(existingResponse?.dietary_restrictions ?? profile?.dietary_restrictions ?? [])
  const [note, setNote]       = useState(existingResponse?.note ?? '')
  const [myContributions, setMyContributions] = useState<Contribution[]>(existingContributions)

  // Navigation stepper
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection]     = useState<'next' | 'prev'>('next')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted]     = useState(false)

  // Contribution form state
  const [activeCategory, setActiveCategory] = useState<ContributionCategory>(
    event.categories_enabled[0] ?? 'autre'
  )
  const [contribName, setContribName]     = useState('')
  const [contribQty, setContribQty]       = useState('')
  const [contribDups, setContribDups]     = useState<string[]>([])
  const [addingContrib, setAddingContrib] = useState(false)
  const [contribError, setContribError]   = useState<string | null>(null)

  useEffect(() => {
    if (contribName.length < 3) { setContribDups([]); return }
    setContribDups(detectDuplicates(allContributions, contribName, activeCategory, participantId))
  }, [contribName, activeCategory, allContributions, participantId])

  // Build steps dynamically
  const hasDietary = event.dietary_enabled || event.allergens_enabled
  const hasContribs = event.categories_enabled.length > 0

  function goNext() {
    setDirection('next')
    setCurrentStep((s) => s + 1)
  }
  function goPrev() {
    setSubmitted(false)
    setDirection('prev')
    setCurrentStep((s) => s - 1)
  }
  function goTo(n: number) {
    setSubmitted(false)
    setDirection(n > currentStep ? 'next' : 'prev')
    setCurrentStep(n)
  }

  // --- Contenu des steps ---

  // STEP 1 — Présence
  const step1Content = (
    <div className="flex flex-col gap-2.5">
      {STATUS_OPTIONS.map((opt) => {
        const isActive = status === opt.value
        const count = statusCounts[opt.value] ?? 0
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center gap-4 w-full px-4 py-4 rounded-[var(--radius-lg)] border text-left transition-ui',
              isActive
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]'
            )}
          >
            <span
              className={cn(
                'flex h-4 w-4 shrink-0 rounded-full border-2 items-center justify-center',
                isActive ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-strong)]'
              )}
            >
              {isActive && (
                <span className="block h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-semibold',
                isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
              )}>
                {opt.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                {opt.sub}
              </p>
            </div>
            {count > 0 && (
              <span
                className={cn(
                  'shrink-0 text-xs font-medium px-2 py-0.5 rounded-full tabular',
                  isActive
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]'
                    : 'bg-[var(--color-surface-muted)] text-[var(--color-text-faint)] border border-[var(--color-border)]'
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}

      {(status === 'attending' || status === 'maybe') && event.plus_one_enabled && (
        <div className="mt-1">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Combien de personnes ? (vous inclus)
          </p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setHc(Math.max(1, headcount - 1))}
              className="h-8 w-8 rounded-[var(--radius-sm)] border flex items-center justify-center text-lg"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>−</button>
            <span className="w-8 text-center text-sm font-semibold tabular" style={{ color: 'var(--color-text)' }}>{headcount}</span>
            <button type="button" onClick={() => setHc(Math.min(20, headcount + 1))}
              className="h-8 w-8 rounded-[var(--radius-sm)] border flex items-center justify-center text-lg"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>+</button>
          </div>
        </div>
      )}
    </div>
  )

  // STEP 2 — Habitudes alimentaires
  const step2Content = (
    <div className="flex flex-col gap-5">
      {event.dietary_enabled && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-faint)' }}>
            Régime alimentaire
          </p>
          <ToggleGroup
            name="dietary_restrictions"
            options={DIETARY_OPTIONS.map((d) => ({ value: d, label: d }))}
            selected={dietary}
            onChange={setDiet}
          />
        </div>
      )}
      {event.allergens_enabled && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-faint)' }}>
            Allergènes
          </p>
          <ToggleGroup
            name="allergens"
            options={ALLERGEN_OPTIONS.map((a) => ({ value: a, label: a }))}
            selected={allergens}
            onChange={setAll}
          />
        </div>
      )}
    </div>
  )

  // STEP 3 — Note
  const step3Content = (
    <div>
      <Textarea
        aria-label="Note pour l'organisateur"
        placeholder="Optionnel — une note, une question..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        maxLength={300}
      />
      <p className="mt-1.5 text-xs text-right" style={{ color: 'var(--color-text-faint)' }}>
        {note.length}/300
      </p>
    </div>
  )

  // STEP 4 — Contributions
  const categoryOptions = CONTRIBUTION_CATEGORIES.filter((c) => event.categories_enabled.includes(c.value))
  const activeSuggestions = suggestions.filter((s) => s.category === activeCategory).slice(0, 4)
  const myActiveContribs  = myContributions.filter((c) => c.category === activeCategory)

  async function handleAddContrib() {
    if (!contribName.trim() || !contribQty.trim()) {
      setContribError('Nom et quantité sont requis.')
      return
    }
    setContribError(null)
    setAddingContrib(true)
    const fd = new FormData()
    fd.append('event_id', eventId)
    fd.append('participant_id', participantId)
    fd.append('category', activeCategory)
    fd.append('name', contribName.trim())
    fd.append('quantity', contribQty.trim())
    const res = await addContribution({}, fd)
    setAddingContrib(false)
    if (res.error) {
      setContribError(res.error)
    } else {
      // Optimistic update
      const newContrib: Contribution = {
        id: Math.random().toString(36),
        participant_id: participantId,
        event_id: eventId,
        category: activeCategory,
        name: contribName.trim(),
        quantity: contribQty.trim(),
        detail: null,
        note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setMyContributions((prev) => [...prev, newContrib])
      setContribName('')
      setContribQty('')
      toast('Contribution ajoutée.', 'success')
    }
  }

  async function handleDeleteContrib(id: string) {
    const res = await deleteContribution(id, eventId)
    if (res?.error) {
      toast(res.error, 'error')
    } else {
      setMyContributions((prev) => prev.filter((c) => c.id !== id))
      toast('Contribution supprimée.', 'info')
    }
  }

  const step4Content = (
    <div>
      {/* Tabs catégories */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categoryOptions.map((cat) => {
          const hasContrib = myContributions.some((c) => c.category === cat.value)
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'relative h-8 px-3 text-xs font-medium rounded-[var(--radius-md)] border shrink-0 transition-ui',
                activeCategory === cat.value
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]'
              )}
            >
              {cat.label}
              {!hasContrib && (
                <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-[var(--color-border-strong)]" aria-hidden />
              )}
            </button>
          )
        })}
      </div>

      {/* Suggestions */}
      {activeSuggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-faint)' }}>
            Suggestions rapides
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activeSuggestions.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => { setContribName(s.name); setContribQty(s.quantity) }}
                className="h-7 px-2.5 text-xs rounded-full border transition-ui"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-surface-muted)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire ajout */}
      <div className="flex flex-col gap-3">
        <div>
          <Input
            label="Ce que j'apporte"
            value={contribName}
            onChange={(e) => setContribName(e.target.value)}
            placeholder="Quiche lorraine, jus d'orange..."
            maxLength={80}
          />
          {contribDups.length > 0 && (
            <div className="mt-2 flex items-start gap-2 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 px-3 py-2.5">
              <svg className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 6v4M8 12h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M6.257 2.657A2 2 0 018 2a2 2 0 011.743 1.017l5.196 9A2 2 0 0113.196 15H2.804a2 2 0 01-1.743-3.017l5.196-9z" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong className="font-semibold">{contribDups.join(', ')}</strong>{' '}
                {contribDups.length === 1 ? 'apporte' : 'apportent'} déjà {contribName.toLowerCase()}. Pensez à varier.
              </p>
            </div>
          )}
        </div>

        <Input
          label="Quantité"
          value={contribQty}
          onChange={(e) => setContribQty(e.target.value)}
          placeholder="6 parts, 1L, pour 8..."
          maxLength={60}
        />

        {contribError && (
          <p className="text-xs text-red-600">{contribError}</p>
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={addingContrib}
          onClick={handleAddContrib}
          className="self-start"
        >
          Ajouter
        </Button>
      </div>

      {/* Liste contributions existantes */}
      {myActiveContribs.length > 0 && (
        <div
          className="mt-4 rounded-[var(--radius-lg)] border overflow-hidden"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {myActiveContribs.map((c, i) => (
            <div
              key={c.id}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm',
                i > 0 && 'border-t'
              )}
              style={i > 0 ? { borderColor: 'var(--color-border)' } : undefined}
            >
              <span className="flex-1 font-medium truncate" style={{ color: 'var(--color-text)' }}>
                {c.name}
              </span>
              <span className="text-xs shrink-0 tabular" style={{ color: 'var(--color-text-faint)' }}>
                {c.quantity}
              </span>
              <button
                type="button"
                onClick={() => handleDeleteContrib(c.id)}
                className="shrink-0 h-6 w-6 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-red-50 transition-ui"
                aria-label={`Supprimer ${c.name}`}
              >
                <svg className="h-3 w-3 text-red-400" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // STEP 5 — Récapitulatif
  const isUpdate = !!existingResponse
  const summaryStepIndex = buildStepIndexes(hasDietary, hasContribs).recap

  const step5Content = (
    <div className="flex flex-col gap-4">
      {/* Présence */}
      <SummaryLine
        label="Présence"
        value={status === 'attending' ? 'Présent' : status === 'maybe' ? 'Peut-être' : 'Absent'}
        sub={event.plus_one_enabled && (status === 'attending' || status === 'maybe') && headcount > 1
          ? `${headcount} personnes`
          : undefined}
        onEdit={() => goTo(0)}
      />

      {/* Alimentaire */}
      {hasDietary && (
        <SummaryLine
          label="Alimentaire"
          value={[...dietary, ...allergens].join(', ') || 'Aucune restriction'}
          onEdit={() => goTo(1)}
        />
      )}

      {/* Note */}
      <SummaryLine
        label="Note"
        value={note || 'Aucune note'}
        onEdit={() => goTo(hasDietary ? 2 : 1)}
      />

      {/* Contributions */}
      {hasContribs && myContributions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-faint)' }}>
              Ce que j'apporte
            </p>
            <button
              type="button"
              onClick={() => goTo(summaryStepIndex - 1)}
              className="text-xs transition-ui"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Modifier
            </button>
          </div>
          <div
            className="rounded-[var(--radius-lg)] border overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {myContributions.map((c, i) => {
              const catLabel = CONTRIBUTION_CATEGORIES.find((cat) => cat.value === c.category)?.label
              return (
                <div
                  key={c.id}
                  className={cn('flex items-center gap-3 px-4 py-2.5 text-sm', i > 0 && 'border-t')}
                  style={i > 0 ? { borderColor: 'var(--color-border)' } : undefined}
                >
                  <span className="flex-1 font-medium truncate" style={{ color: 'var(--color-text)' }}>
                    {c.name}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: 'var(--color-text-faint)' }}>
                    {c.quantity}
                  </span>
                  {catLabel && (
                    <Badge variant="neutral">{catLabel}</Badge>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {submitError && (
        <Alert variant="error">{submitError}</Alert>
      )}
    </div>
  )

  // Build step list
  const steps = buildSteps({
    hasDietary,
    hasContribs,
    step1Content,
    step2Content,
    step3Content,
    step4Content,
    step5Content,
  })

  const isLastStep = currentStep === steps.length - 1

  // Submit final
  async function handleSubmit() {
    setSubmitError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('event_id', eventId)
      fd.append('participant_id', participantId)
      fd.append('status', status)
      fd.append('headcount', String(headcount))
      allergens.forEach((a) => fd.append('allergens', a))
      dietary.forEach((d) => fd.append('dietary_restrictions', d))
      fd.append('note', note)

      const res = await submitResponse({}, fd)
      if (res.error) {
        setSubmitError(res.error)
      } else {
        setSubmitted(true)
        toast(isUpdate ? 'Réponse mise à jour.' : 'Réponse enregistrée.', 'success')
      }
    })
  }

  if (submitted) {
    return (
      <div className="rounded-[var(--radius-xl)] border overflow-hidden"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'var(--color-accent-muted)' }}>
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 13l4 4L19 7" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
              {isUpdate ? 'Réponse mise à jour' : 'Réponse confirmée'}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {status === 'attending' ? 'On compte sur vous !' : status === 'maybe' ? 'On espère vous voir.' : 'Merci de nous avoir prévenu.'}
            </p>
          </div>
          <button type="button" onClick={() => setSubmitted(false)}
            className="text-sm transition-ui"
            style={{ color: 'var(--color-text-faint)' }}>
            Modifier ma réponse
          </button>
        </div>
      </div>
    )
  }

  return (
    <CardStepper
      steps={steps}
      currentStep={currentStep}
      direction={direction}
      onNext={isLastStep ? handleSubmit : goNext}
      onPrev={currentStep === 0 ? () => {} : goPrev}
      prevLabel="Retour"
      nextLabel={isLastStep ? undefined : 'Continuer'}
      isLastStep={isLastStep}
      submitLabel={isUpdate ? 'Mettre à jour' : 'Confirmer ma réponse'}
      isSubmitting={isPending}
      nextDisabled={false}
    />
  )
}

// --- Helpers ---

function buildStepIndexes(hasDietary: boolean, hasContribs: boolean) {
  let i = 0
  const presence = i++
  const dietary  = hasDietary ? i++ : -1
  const note     = i++
  const contribs = hasContribs ? i++ : -1
  const recap    = i++
  return { presence, dietary, note, contribs, recap }
}

function buildSteps({
  hasDietary,
  hasContribs,
  step1Content,
  step2Content,
  step3Content,
  step4Content,
  step5Content,
}: {
  hasDietary: boolean
  hasContribs: boolean
  step1Content: React.ReactNode
  step2Content: React.ReactNode
  step3Content: React.ReactNode
  step4Content: React.ReactNode
  step5Content: React.ReactNode
}): StepDef[] {
  const steps: StepDef[] = [
    {
      id: 'presence',
      label: 'Présence',
      title: 'Serez-vous présent ?',
      content: step1Content,
    },
  ]

  if (hasDietary) {
    steps.push({
      id: 'dietary',
      label: 'Alimentaire',
      title: 'Vos habitudes alimentaires',
      description: "Ces informations aident l'organisateur à équilibrer le repas.",
      content: step2Content,
      optional: true,
    })
  }

  steps.push({
    id: 'note',
    label: 'Note',
    title: "Un mot pour l'organisateur ?",
    content: step3Content,
    optional: true,
  })

  if (hasContribs) {
    steps.push({
      id: 'contributions',
      label: 'Contributions',
      title: 'Que vais-je apporter ?',
      content: step4Content,
      optional: true,
    })
  }

  steps.push({
    id: 'recap',
    label: 'Récapitulatif',
    title: 'Récapitulatif',
    description: 'Vérifiez vos informations avant de confirmer.',
    content: step5Content,
  })

  return steps
}

function SummaryLine({
  label,
  value,
  sub,
  onEdit,
}: {
  label: string
  value: string
  sub?: string
  onEdit: () => void
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-faint)' }}>
          {label}
        </p>
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
            {sub}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 h-7 px-2.5 text-xs rounded-[var(--radius-sm)] border transition-ui"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface-muted)',
        }}
      >
        Modifier
      </button>
    </div>
  )
}
