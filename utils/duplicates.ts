import type { Contribution, DuplicateWarning, ContributionCategory } from '@/types'

// Table de normalisation pour les variantes courantes
const NORMALIZATION_MAP: Record<string, string> = {
  'coca': 'coca-cola',
  'coke': 'coca-cola',
  'coca cola': 'coca-cola',
  'iced tea': 'ice tea',
  'icetea': 'ice tea',
  'chips': 'chips / crisps',
  'crisps': 'chips / crisps',
  'biere': 'bière',
  'beer': 'bière',
  'vin rouge': 'vin',
  'vin blanc': 'vin',
  'eau plat': 'eau plate',
  'eau gazeuse': 'eau pétillante',
  'eau sparkling': 'eau pétillante',
  'gateau': 'gâteau',
  'cake': 'gâteau',
}

export function normalizeItemName(name: string): string {
  const lower = name.toLowerCase().trim()
  return NORMALIZATION_MAP[lower] ?? lower
}

export function detectDuplicates(
  contributions: Array<Contribution & { contributor_name: string }>,
  currentName: string,
  currentCategory: ContributionCategory,
  excludeParticipantId?: string
): string[] {
  const normalized = normalizeItemName(currentName)
  if (!normalized || normalized.length < 2) return []

  return contributions
    .filter((c) => {
      if (excludeParticipantId && c.participant_id === excludeParticipantId) return false
      if (c.category !== currentCategory) return false
      const cNorm = normalizeItemName(c.name)
      return cNorm === normalized || cNorm.includes(normalized) || normalized.includes(cNorm)
    })
    .map((c) => c.contributor_name)
    .filter((v, i, a) => a.indexOf(v) === i)
}

export function groupDuplicates(
  contributions: Array<Contribution & { contributor_name: string }>
): DuplicateWarning[] {
  const groups = new Map<string, DuplicateWarning>()

  for (const contrib of contributions) {
    const normalized = normalizeItemName(contrib.name)
    const key = `${contrib.category}:${normalized}`

    if (groups.has(key)) {
      const group = groups.get(key)!
      if (!group.contributors.includes(contrib.contributor_name)) {
        group.contributors.push(contrib.contributor_name)
      }
    } else {
      groups.set(key, {
        name: contrib.name,
        normalized,
        category: contrib.category,
        contributors: [contrib.contributor_name],
      })
    }
  }

  return Array.from(groups.values()).filter((g) => g.contributors.length > 1)
}
