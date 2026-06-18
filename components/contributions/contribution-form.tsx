'use client'

import { useActionState, useState, useEffect } from 'react'
import { addContribution } from '@/features/events/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { detectDuplicates } from '@/utils/duplicates'
import type { ContributionCategory, Contribution } from '@/types'
import { CONTRIBUTION_CATEGORIES } from '@/types'

export interface ContributionSuggestion {
  name: string
  quantity: string
  category: ContributionCategory
}

interface ContributionFormProps {
  eventId: string
  participantId: string
  enabledCategories: ContributionCategory[]
  existingContributions: Array<Contribution & { contributor_name: string }>
  suggestions?: ContributionSuggestion[]
}

export function ContributionForm({
  eventId,
  participantId,
  enabledCategories,
  existingContributions,
  suggestions = [],
}: ContributionFormProps) {
  const [state, action, pending] = useActionState(addContribution, {})
  const [category, setCategory]       = useState<ContributionCategory>(enabledCategories[0] ?? 'autre')
  const [name, setName]               = useState('')
  const [quantity, setQuantity]       = useState('')
  const [duplicates, setDuplicates]   = useState<string[]>([])

  const filteredSuggestions = suggestions.filter((s) => s.category === category).slice(0, 4)

  const categoryOptions = CONTRIBUTION_CATEGORIES
    .filter((c) => enabledCategories.includes(c.value))
    .map((c) => ({ value: c.value, label: c.label }))

  useEffect(() => {
    if (name.length < 3) { setDuplicates([]); return }
    setDuplicates(detectDuplicates(existingContributions, name, category, participantId))
  }, [name, category, existingContributions, participantId])

  return (
    <div className="rounded-[var(--radius-lg)] border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
      {/* Header */}
      <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-faint)' }}>Ajouter une contribution</p>
      </div>

      <form action={action} className="px-5 py-4 flex flex-col gap-4">
        <input type="hidden" name="event_id"      value={eventId} />
        <input type="hidden" name="participant_id" value={participantId} />
        <input type="hidden" name="category"       value={category} />

        {state.error   && <Alert variant="error">{state.error}</Alert>}
        {state.success && <Alert variant="success">Contribution ajoutée.</Alert>}

        <Select
          label="Catégorie"
          options={categoryOptions}
          value={category}
          onChange={(e) => setCategory(e.target.value as ContributionCategory)}
          required
        />

        {/* Suggestions rapides */}
        {filteredSuggestions.length > 0 && (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-faint)' }}>
              La dernière fois vous avez apporté
            </p>
            <div className="flex flex-wrap gap-1.5">
              {filteredSuggestions.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => { setName(s.name); setQuantity(s.quantity) }}
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

        <div>
          <Input
            label="Ce que vous apportez"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Quiche lorraine, Jus d'orange…"
            required
            maxLength={80}
          />
          {/* Avertissement doublon */}
          {duplicates.length > 0 && (
            <div className="mt-2 flex items-start gap-2 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 px-3 py-2.5">
              <svg className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 6v4M8 12h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M6.257 2.657A2 2 0 018 2a2 2 0 011.743 1.017l5.196 9A2 2 0 0113.196 15H2.804a2 2 0 01-1.743-3.017l5.196-9z" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong className="font-semibold">{duplicates.join(', ')}</strong>{' '}
                {duplicates.length === 1 ? 'en apporte' : 'en apportent'} déjà.
                Pensez à varier les plaisirs ou réduisez la quantité.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantité"
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="6 parts, 1L, pour 8…"
            required
            maxLength={60}
          />
          <Input
            label="Précision"
            name="detail"
            placeholder="Marque, variante…"
            maxLength={80}
          />
        </div>

        <Textarea
          label="Note"
          name="note"
          placeholder="Optionnel"
          rows={2}
          maxLength={200}
        />

        <Button type="submit" loading={pending} className="w-full">
          Ajouter
        </Button>
      </form>
    </div>
  )
}
