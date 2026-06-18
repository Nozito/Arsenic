'use client'

import { useActionState, useState } from 'react'
import { updateEvent, type OrganizerActionState } from '@/features/events/organizer-actions'
import { CONTRIBUTION_CATEGORIES, type Event } from '@/types'

interface Props {
  event: Event
  onClose: () => void
}

export function EventEditPanel({ event, onClose }: Props) {
  const [state, action, pending] = useActionState(updateEvent, {})
  const [categories, setCategories] = useState<string[]>(event.categories_enabled ?? [])
  const [status, setStatus] = useState(event.status)
  const [allergensEnabled, setAllergens] = useState(event.allergens_enabled)
  const [dietaryEnabled, setDietary] = useState(event.dietary_enabled)
  const [plusOneEnabled, setPlusOne] = useState(event.plus_one_enabled)

  function toggleCat(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  return (
    <div
      className="rounded-[var(--radius-xl)] border overflow-hidden"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Modifier l'événement
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm transition-ui"
          style={{ color: 'var(--color-text-faint)' }}
        >
          Fermer
        </button>
      </div>

      <form action={action} className="p-5 space-y-4">
        <input type="hidden" name="event_id" value={event.id} />
        <input type="hidden" name="allergens_enabled" value={String(allergensEnabled)} />
        <input type="hidden" name="dietary_enabled" value={String(dietaryEnabled)} />
        <input type="hidden" name="plus_one_enabled" value={String(plusOneEnabled)} />
        {categories.map((c) => (
          <input key={c} type="hidden" name="categories_enabled" value={c} />
        ))}

        {/* Infos de base */}
        <div className="space-y-3">
          <FormField label="Titre *" name="title" defaultValue={event.title} />
          <FormTextarea label="Description" name="description" defaultValue={event.description ?? ''} />
        </div>

        {/* Date et lieu */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date *" name="date" type="date" defaultValue={event.date} />
          <FormField label="Heure" name="time" type="time" defaultValue={event.time ?? ''} />
        </div>
        <FormField label="Lieu" name="location" defaultValue={event.location ?? ''} />

        {/* Logistique */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Participants attendus"
            name="expected_participants"
            type="number"
            min="1"
            defaultValue={event.expected_participants?.toString() ?? ''}
          />
          <FormField
            label="Date limite de réponse"
            name="response_deadline"
            type="date"
            defaultValue={event.response_deadline ?? ''}
          />
        </div>

        {/* Message d'invitation */}
        <FormTextarea
          label="Message d'invitation"
          name="invitation_message"
          defaultValue={event.invitation_message ?? ''}
          rows={3}
        />

        {/* Notes privées */}
        <FormTextarea
          label="Notes privées"
          name="organizer_notes"
          defaultValue={event.organizer_notes ?? ''}
        />

        {/* Statut */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Statut
          </label>
          <input type="hidden" name="status" value={status} />
          <div className="flex gap-2 flex-wrap">
            {([
              { value: 'active', label: 'Ouvert' },
              { value: 'closed', label: 'Fermé' },
              { value: 'cancelled', label: 'Annulé' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className="h-8 px-3 text-xs rounded-[var(--radius-md)] border transition-ui"
                style={{
                  borderColor: status === opt.value ? 'var(--color-accent)' : 'var(--color-border)',
                  background: status === opt.value ? 'var(--color-accent-muted)' : 'transparent',
                  color: 'var(--color-text)',
                  fontWeight: status === opt.value ? 500 : 400,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {status === 'cancelled' && (
            <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-faint)' }}>
              Les participants seront informés lors de leur prochaine visite.
            </p>
          )}
        </div>

        {/* Catégories */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Catégories activées
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CONTRIBUTION_CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleCat(value)}
                className="h-7 px-2.5 text-xs rounded-full border transition-ui"
                style={{
                  borderColor: categories.includes(value) ? 'var(--color-accent)' : 'var(--color-border)',
                  background: categories.includes(value) ? 'var(--color-accent-muted)' : 'transparent',
                  color: 'var(--color-text)',
                  fontWeight: categories.includes(value) ? 500 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-2">
          <Toggle label="Allergènes" value={allergensEnabled} onChange={setAllergens} />
          <Toggle label="Régimes alimentaires" value={dietaryEnabled} onChange={setDietary} />
          <Toggle label="Invités supplémentaires (+1)" value={plusOneEnabled} onChange={setPlusOne} />
        </div>

        {state.error && (
          <p className="text-sm text-red-700">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
            Événement mis à jour.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full h-10 text-sm font-medium rounded-[var(--radius-md)] transition-ui disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
        >
          {pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  )
}

// ---- Primitives locales ----

function FormField({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <input
        name={name}
        className="w-full h-9 rounded-[var(--radius-md)] border px-3 text-sm outline-none transition-ui"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface-elevated)',
          color: 'var(--color-text)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-accent)'
          e.target.style.boxShadow = '0 0 0 3px var(--color-accent-muted)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color-border)'
          e.target.style.boxShadow = 'none'
        }}
        {...props}
      />
    </div>
  )
}

function FormTextarea({
  label,
  name,
  rows = 2,
  ...props
}: { label: string; name: string; rows?: number } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <textarea
        name={name}
        rows={rows}
        className="w-full rounded-[var(--radius-md)] border px-3 py-2 text-sm outline-none resize-none transition-ui"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface-elevated)',
          color: 'var(--color-text)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-accent)'
          e.target.style.boxShadow = '0 0 0 3px var(--color-accent-muted)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color-border)'
          e.target.style.boxShadow = 'none'
        }}
        {...props}
      />
    </div>
  )
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: 'var(--color-text)' }}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="relative h-5 w-9 rounded-full transition-colors duration-200"
        style={{ background: value ? 'var(--color-accent)' : 'var(--color-border)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: value ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  )
}
