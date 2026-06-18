'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addParticipantManually,
  updateParticipant,
  removeParticipant,
  addContributionAsOrganizer,
  deleteContributionAsOrganizer,
} from '@/features/events/organizer-actions'
import { CONTRIBUTION_CATEGORIES, DIETARY_OPTIONS, ALLERGEN_OPTIONS, type ContributionCategory } from '@/types'
import type { ParticipantWithResponseAndContributions } from '@/types'

interface Props {
  eventId: string
  participants: ParticipantWithResponseAndContributions[]
}

export function OrganizerParticipantPanel({ eventId, participants }: Props) {
  const [view, setView] = useState<'list' | 'add'>('list')

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
          Gestion des participants
        </h3>
        <button
          type="button"
          onClick={() => setView(view === 'list' ? 'add' : 'list')}
          className="text-xs font-medium transition-ui h-7 px-3 rounded-[var(--radius-md)] border"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          {view === 'list' ? 'Ajouter manuellement' : 'Voir la liste'}
        </button>
      </div>

      {view === 'list' ? (
        <ParticipantList participants={participants} eventId={eventId} />
      ) : (
        <AddParticipantForm eventId={eventId} onSuccess={() => setView('list')} />
      )}
    </div>
  )
}

// ---- Participant list with inline actions ----

function ParticipantList({
  participants,
  eventId,
}: {
  participants: ParticipantWithResponseAndContributions[]
  eventId: string
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (participants.length === 0) {
    return (
      <p className="px-5 py-6 text-sm text-center" style={{ color: 'var(--color-text-faint)' }}>
        Aucun participant pour l'instant.
      </p>
    )
  }

  return (
    <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
      {participants.map((p) => {
        const name =
          p.profile?.display_name ?? p.profile?.first_name ?? p.guest_name ?? 'Invité'
        const isExpanded = expanded === p.id

        return (
          <div key={p.id} className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{ background: isExpanded ? 'var(--color-surface-muted)' : undefined }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {p.response?.status === 'attending' ? `Présent · ${p.response.headcount} pers.`
                    : p.response?.status === 'not_attending' ? 'Absent'
                    : p.response?.status === 'maybe' ? 'Peut-être'
                    : 'Pas encore répondu'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : p.id)}
                className="text-xs transition-ui"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {isExpanded ? 'Fermer' : 'Gérer'}
              </button>
            </div>

            {isExpanded && (
              <ParticipantEditForm participant={p} eventId={eventId} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---- Inline edit form for one participant ----

function ParticipantEditForm({
  participant: p,
  eventId,
}: {
  participant: ParticipantWithResponseAndContributions
  eventId: string
}) {
  const router = useRouter()
  const [updateState, updateAction, updatePending] = useActionState(updateParticipant, {})
  const [addContribState, addContribAction, addContribPending] = useActionState(addContributionAsOrganizer, {})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [, startTransition] = useTransition()
  const [contribCat, setContribCat] = useState<ContributionCategory>('autre')

  const isGuest = !p.user_id
  const name = p.profile?.display_name ?? p.profile?.first_name ?? p.guest_name ?? ''

  function handleRemove() {
    startTransition(async () => {
      await removeParticipant(p.id, eventId)
      router.refresh()
    })
  }

  async function handleDeleteContrib(contribId: string) {
    await deleteContributionAsOrganizer(contribId, eventId)
    router.refresh()
  }

  return (
    <div className="px-5 py-4 space-y-4" style={{ background: 'var(--color-surface-muted)' }}>
      <form action={updateAction} className="space-y-3">
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="participant_id" value={p.id} />

        {isGuest && (
          <MiniField
            label="Nom affiché"
            name="guest_name"
            defaultValue={p.guest_name ?? ''}
          />
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Présence
            </label>
            <select
              name="status"
              defaultValue={p.response?.status ?? 'attending'}
              className="w-full h-8 rounded-[var(--radius-sm)] border px-2 text-xs outline-none appearance-none"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface-elevated)',
                color: 'var(--color-text)',
              }}
            >
              <option value="attending">Présent</option>
              <option value="maybe">Peut-être</option>
              <option value="not_attending">Absent</option>
            </select>
          </div>
          <MiniField
            label="Nb personnes"
            name="headcount"
            type="number"
            min="1"
            defaultValue={String(p.response?.headcount ?? 1)}
          />
        </div>

        <MiniField
          label="Note"
          name="note"
          defaultValue={p.response?.note ?? ''}
        />

        {updateState.error && <p className="text-xs text-red-600">{updateState.error}</p>}
        {updateState.success && (
          <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
            Enregistré.
          </p>
        )}

        <button
          type="submit"
          disabled={updatePending}
          className="h-8 px-4 text-xs font-medium rounded-[var(--radius-md)] transition-ui disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
        >
          {updatePending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      {/* Contributions de ce participant */}
      {p.contributions.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Contributions
          </p>
          <div
            className="rounded-[var(--radius-md)] border overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {p.contributions.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-3 py-2 text-xs"
                style={i > 0 ? { borderTop: '1px solid var(--color-border)' } : undefined}
              >
                <span className="flex-1 truncate" style={{ color: 'var(--color-text)' }}>
                  {c.name}
                </span>
                <span style={{ color: 'var(--color-text-faint)' }}>{c.quantity}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteContrib(c.id)}
                  className="transition-ui"
                  style={{ color: 'var(--color-text-faint)' }}
                  aria-label="Supprimer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ajouter une contribution */}
      <form action={addContribAction} className="space-y-2">
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="participant_id" value={p.id} />
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Ajouter une contribution
        </p>
        <div className="flex gap-2">
          <input
            name="name"
            placeholder="Quiche"
            className="flex-1 h-8 rounded-[var(--radius-sm)] border px-2 text-xs outline-none"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface-elevated)',
              color: 'var(--color-text)',
            }}
          />
          <input
            name="quantity"
            placeholder="1"
            className="w-12 h-8 rounded-[var(--radius-sm)] border px-2 text-xs outline-none text-center"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface-elevated)',
              color: 'var(--color-text)',
            }}
          />
        </div>
        <input type="hidden" name="category" value={contribCat} />
        <select
          value={contribCat}
          onChange={(e) => setContribCat(e.target.value as ContributionCategory)}
          className="w-full h-8 rounded-[var(--radius-sm)] border px-2 text-xs outline-none appearance-none"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface-elevated)',
            color: 'var(--color-text)',
          }}
        >
          {CONTRIBUTION_CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {addContribState.error && <p className="text-xs text-red-600">{addContribState.error}</p>}
        <button
          type="submit"
          disabled={addContribPending}
          className="h-8 px-3 text-xs font-medium rounded-[var(--radius-md)] border transition-ui disabled:opacity-50"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          {addContribPending ? 'Ajout…' : 'Ajouter'}
        </button>
      </form>

      {/* Suppression du participant */}
      <div className="pt-1">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-xs transition-ui"
            style={{ color: 'var(--color-text-faint)' }}
          >
            Retirer ce participant
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Confirmer la suppression ?
            </p>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-red-600 font-medium transition-ui"
            >
              Supprimer
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-xs transition-ui"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Add participant form ----

function AddParticipantForm({ eventId, onSuccess }: { eventId: string; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(addParticipantManually, {})
  const [dietary, setDietary] = useState<string[]>([])
  const [allergens, setAllergens] = useState<string[]>([])

  if (state.success) {
    onSuccess()
  }

  return (
    <form action={action} className="p-5 space-y-3">
      <input type="hidden" name="event_id" value={eventId} />
      {dietary.map((d) => <input key={d} type="hidden" name="dietary_restrictions" value={d} />)}
      {allergens.map((a) => <input key={a} type="hidden" name="allergens" value={a} />)}

      <MiniField label="Prénom + nom affiché *" name="guest_name" autoFocus />
      <MiniField label="Email" name="guest_email" type="email" />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Présence
          </label>
          <select
            name="status"
            defaultValue="attending"
            className="w-full h-8 rounded-[var(--radius-sm)] border px-2 text-xs outline-none appearance-none"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface-elevated)',
              color: 'var(--color-text)',
            }}
          >
            <option value="attending">Présent</option>
            <option value="maybe">Peut-être</option>
            <option value="not_attending">Absent</option>
          </select>
        </div>
        <MiniField label="Nb personnes" name="headcount" type="number" min="1" defaultValue="1" />
      </div>

      <MiniField label="Note" name="note" />

      <TagPicker label="Régimes" options={DIETARY_OPTIONS} selected={dietary} onChange={setDietary} />
      <TagPicker label="Allergènes" options={ALLERGEN_OPTIONS} selected={allergens} onChange={setAllergens} />

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full h-9 text-sm font-medium rounded-[var(--radius-md)] transition-ui disabled:opacity-50"
        style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
      >
        {pending ? 'Ajout…' : 'Ajouter le participant'}
      </button>
    </form>
  )
}

// ---- Local primitives ----

function MiniField({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <input
        name={name}
        className="w-full h-8 rounded-[var(--radius-sm)] border px-2 text-xs outline-none transition-ui"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface-elevated)',
          color: 'var(--color-text)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-accent)'
          e.target.style.boxShadow = '0 0 0 2px var(--color-accent-muted)'
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

function TagPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() =>
                onChange(active ? selected.filter((x) => x !== opt) : [...selected, opt])
              }
              className="h-6 px-2 text-xs rounded-full border transition-ui"
              style={{
                borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
                background: active ? 'var(--color-accent-muted)' : 'transparent',
                color: 'var(--color-text)',
                fontWeight: active ? 500 : 400,
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
