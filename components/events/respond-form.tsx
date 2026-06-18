'use client'

import { useActionState, useState } from 'react'
import { submitResponse } from '@/features/events/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { DIETARY_OPTIONS, ALLERGEN_OPTIONS } from '@/types'
import type { ResponseStatus, ParticipantResponse } from '@/types'
import { cn } from '@/utils/cn'

interface RespondFormProps {
  eventId: string
  participantId: string
  plusOneEnabled: boolean
  dietaryEnabled: boolean
  allergensEnabled: boolean
  existingResponse?: ParticipantResponse | null
}

const STATUS_OPTIONS: { value: ResponseStatus; label: string; sub: string }[] = [
  { value: 'attending',     label: 'Présent',     sub: 'Je serai là' },
  { value: 'not_attending', label: 'Absent',      sub: 'Je ne peux pas' },
  { value: 'maybe',         label: 'Peut-être',   sub: 'Je ne suis pas sûr' },
]

export function RespondForm({
  eventId,
  participantId,
  plusOneEnabled,
  dietaryEnabled,
  allergensEnabled,
  existingResponse,
}: RespondFormProps) {
  const [state, action, pending] = useActionState(submitResponse, {})
  const [status, setStatus]   = useState<ResponseStatus>(existingResponse?.status ?? 'attending')
  const [headcount, setHc]    = useState(existingResponse?.headcount ?? 1)
  const [allergens, setAll]   = useState<string[]>(existingResponse?.allergens ?? [])
  const [dietary, setDiet]    = useState<string[]>(existingResponse?.dietary_restrictions ?? [])

  return (
    <form action={action} className="flex flex-col gap-0 divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden">
      <input type="hidden" name="event_id"      value={eventId} />
      <input type="hidden" name="participant_id" value={participantId} />
      <input type="hidden" name="status"         value={status} />
      <input type="hidden" name="headcount"      value={headcount} />

      {/* Sélecteur de statut */}
      <div className="grid grid-cols-3 divide-x divide-[var(--color-border)]">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = status === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              aria-pressed={isActive}
              className={cn(
                'flex flex-col items-center gap-1 py-4 px-3 text-center transition-colors',
                isActive
                  ? 'bg-[var(--color-text)] text-[var(--color-surface-elevated)]'
                  : 'bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
              )}
            >
              <span className={cn('text-sm font-semibold', isActive ? 'text-[var(--color-surface-elevated)]' : 'text-[var(--color-text)]')}>
                {opt.label}
              </span>
              <span className="text-xs leading-tight text-[var(--color-text-faint)]">
                {opt.sub}
              </span>
            </button>
          )
        })}
      </div>

      {/* Nombre de personnes */}
      {status === 'attending' && plusOneEnabled && (
        <div className="px-5 py-4">
          <Input
            label="Nombre de personnes (vous + invités)"
            type="number"
            min="1"
            max="20"
            value={headcount}
            onChange={(e) => setHc(parseInt(e.target.value) || 1)}
          />
        </div>
      )}

      {/* Allergènes */}
      {allergensEnabled && (
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-faint)' }}>Allergènes</p>
          <ToggleGroup
            name="allergens"
            options={ALLERGEN_OPTIONS.map((a) => ({ value: a, label: a }))}
            selected={allergens}
            onChange={setAll}
          />
        </div>
      )}

      {/* Régimes */}
      {dietaryEnabled && (
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-faint)' }}>Régime alimentaire</p>
          <ToggleGroup
            name="dietary_restrictions"
            options={DIETARY_OPTIONS.map((d) => ({ value: d, label: d }))}
            selected={dietary}
            onChange={setDiet}
          />
        </div>
      )}

      {/* Note + Submit */}
      <div className="px-5 py-4 flex flex-col gap-4">
        {state.error   && <Alert variant="error">{state.error}</Alert>}
        {state.success && <Alert variant="success">Réponse enregistrée.</Alert>}
        <Textarea
          name="note"
          placeholder="Note pour l'organisateur (optionnel)"
          defaultValue={existingResponse?.note ?? ''}
          rows={2}
        />
        <Button type="submit" loading={pending} className="w-full">
          {existingResponse ? 'Mettre à jour' : 'Enregistrer ma réponse'}
        </Button>
      </div>
    </form>
  )
}
