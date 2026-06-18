'use client'

import { useActionState, useState, useEffect } from 'react'
import { updateProfile } from '@/features/events/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { DIETARY_OPTIONS, ALLERGEN_OPTIONS } from '@/types'
import type { Profile, Contribution } from '@/types'

interface ProfileFormProps {
  profile: Profile
  recentContributions?: Contribution[]
}

export function ProfileForm({ profile, recentContributions = [] }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfile, {})
  const [allergens, setAllergens] = useState<string[]>(profile.allergens ?? [])
  const [dietary, setDietary] = useState<string[]>(profile.dietary_restrictions ?? [])
  const { toast } = useToast()

  useEffect(() => {
    if (state.success) {
      toast('Profil mis à jour.', 'success')
    } else if (state.error) {
      toast(state.error, 'error')
    }
  }, [state, toast])

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* Section identité */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Identité
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              name="first_name"
              defaultValue={profile.first_name ?? ''}
              required
              autoComplete="given-name"
            />
            <Input
              label="Nom"
              name="last_name"
              defaultValue={profile.last_name ?? ''}
              autoComplete="family-name"
            />
          </div>
          <Input
            label="Nom affiché"
            name="display_name"
            defaultValue={profile.display_name ?? ''}
            placeholder="Nom visible par les autres"
          />
          <Input
            label="Téléphone"
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ''}
            autoComplete="tel"
          />
        </CardBody>
      </Card>

      {/* Section préférences alimentaires */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Préférences alimentaires
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
            Ces informations seront pré-remplies lors de vos réponses.
          </p>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-faint)' }}>
              Régime alimentaire
            </p>
            <ToggleGroup
              name="dietary_restrictions"
              options={DIETARY_OPTIONS.map((d) => ({ value: d, label: d }))}
              selected={dietary}
              onChange={setDietary}
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-faint)' }}>
              Allergènes
            </p>
            <ToggleGroup
              name="allergens"
              options={ALLERGEN_OPTIONS.map((a) => ({ value: a, label: a }))}
              selected={allergens}
              onChange={setAllergens}
            />
          </div>
        </CardBody>
      </Card>

      {/* Section sécurité */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Compte
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <Input
            label="Email"
            type="email"
            value={profile.email}
            readOnly
            aria-label="Adresse email (non modifiable)"
          />
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            L'email ne peut pas être modifié ici.
          </p>
        </CardBody>
      </Card>

      {/* Contributions habituelles */}
      {recentContributions.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Contributions récentes
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
              Vos 5 dernières contributions sur tous les événements.
            </p>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-2">
              {recentContributions.map((c) => (
                <div key={c.id} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 truncate" style={{ color: 'var(--color-text)' }}>{c.name}</span>
                  <span className="text-xs shrink-0" style={{ color: 'var(--color-text-faint)' }}>{c.quantity}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex justify-end pb-4">
        <Button type="submit" loading={pending}>
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
