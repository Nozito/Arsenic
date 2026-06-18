'use client'

import { useActionState, useState } from 'react'
import { updateProfile } from '@/features/events/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { DIETARY_OPTIONS, ALLERGEN_OPTIONS } from '@/types'
import type { Profile } from '@/types'

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfile, {})
  const [allergens, setAllergens] = useState<string[]>(profile.allergens ?? [])
  const [dietary, setDietary] = useState<string[]>(profile.dietary_restrictions ?? [])

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">Profil mis à jour.</Alert>}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-stone-900">Informations personnelles</h2>
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
            label="Email"
            type="email"
            value={profile.email}
            disabled
            hint="L'email ne peut pas être modifié ici."
          />
          <Input
            label="Téléphone"
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ''}
            autoComplete="tel"
          />
          <Textarea
            label="Notes"
            name="notes"
            defaultValue={profile.notes ?? ''}
            placeholder="Informations supplémentaires..."
            rows={3}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-stone-900">Allergènes</h2>
          <p className="text-xs text-stone-500 mt-0.5">Ces informations seront pré-remplies lors de vos réponses.</p>
        </CardHeader>
        <CardBody>
          <ToggleGroup
            name="allergens"
            options={ALLERGEN_OPTIONS.map((a) => ({ value: a, label: a }))}
            selected={allergens}
            onChange={setAllergens}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-stone-900">Régime alimentaire</h2>
        </CardHeader>
        <CardBody>
          <ToggleGroup
            name="dietary_restrictions"
            options={DIETARY_OPTIONS.map((d) => ({ value: d, label: d }))}
            selected={dietary}
            onChange={setDietary}
          />
        </CardBody>
      </Card>

      <div className="flex justify-end pb-4">
        <Button type="submit" loading={pending}>
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
