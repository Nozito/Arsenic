import type { ParticipantWithResponseAndContributions } from '@/types'
import { Card, CardBody, CardHeader } from '@/components/ui/card'

interface AllergensSummaryProps {
  participants: ParticipantWithResponseAndContributions[]
}

export function AllergensSummary({ participants }: AllergensSummaryProps) {
  const allergenMap = new Map<string, string[]>()
  const dietaryMap  = new Map<string, string[]>()

  for (const p of participants) {
    if (!p.response) continue
    const name = p.profile?.display_name ?? p.profile?.first_name ?? p.guest_name ?? 'Invité'
    for (const a of p.response.allergens) {
      if (!allergenMap.has(a)) allergenMap.set(a, [])
      allergenMap.get(a)!.push(name)
    }
    for (const d of p.response.dietary_restrictions) {
      if (!dietaryMap.has(d)) dietaryMap.set(d, [])
      dietaryMap.get(d)!.push(name)
    }
  }

  if (allergenMap.size === 0 && dietaryMap.size === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
            Aucune contrainte alimentaire signalée.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {allergenMap.size > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-red-700">Allergènes</h3>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-2">
              {Array.from(allergenMap.entries()).map(([allergen, names]) => (
                <div key={allergen} className="flex items-start gap-3">
                  <span
                    className="text-sm font-medium w-32 shrink-0"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {allergen}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {names.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {dietaryMap.size > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold" style={{ color: '#0369a1' }}>Régimes alimentaires</h3>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-2">
              {Array.from(dietaryMap.entries()).map(([diet, names]) => (
                <div key={diet} className="flex items-start gap-3">
                  <span
                    className="text-sm font-medium w-32 shrink-0"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {diet}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {names.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
