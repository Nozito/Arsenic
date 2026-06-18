import type { Contribution, ReadinessScore, CategoryCoverage, ContributionCategory } from '@/types'
import { CONTRIBUTION_CATEGORIES } from '@/types'

function scoreCategory(count: number, headcount: number, thresholds: number[]): number {
  // thresholds = [1 star, 2 star, 3 star, 4 star, 5 star] minimums
  const ratio = headcount > 0 ? count / headcount : 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (ratio >= thresholds[i]) return i + 1
  }
  return 0
}

export function computeReadinessScore(
  contributions: Contribution[],
  headcount: number
): ReadinessScore {
  const boissonCount = contributions.filter((c) => c.category === 'boissons').length
  const sucreCount = contributions.filter((c) => c.category === 'sucre').length
  const vaisselleCount = contributions.filter((c) => c.category === 'vaisselle').length
  const saleCount = contributions.filter((c) => c.category === 'sale' || c.category === 'plats').length

  const boissons = scoreCategory(boissonCount, headcount, [0.1, 0.2, 0.4, 0.6, 0.8])
  const sucre = scoreCategory(sucreCount, headcount, [0.05, 0.1, 0.2, 0.35, 0.5])
  const vaisselle = scoreCategory(vaisselleCount, headcount, [0.05, 0.1, 0.2, 0.3, 0.5])
  const sale = scoreCategory(saleCount, headcount, [0.1, 0.2, 0.35, 0.5, 0.7])

  const overall = Math.round((boissons + sucre + vaisselle + sale) / 4)

  return { boissons, sucre, vaisselle, sale, overall }
}

export function computeCategoryCoverage(contributions: Contribution[]): CategoryCoverage[] {
  return CONTRIBUTION_CATEGORIES.map(({ value, label }) => {
    const items = contributions
      .filter((c) => c.category === value)
      .map((c) => c.name)

    return {
      category: value as ContributionCategory,
      label,
      count: items.length,
      items: [...new Set(items)],
      score: Math.min(5, items.length),
    }
  })
}

export function identifyGaps(coverage: CategoryCoverage[], criticalCategories: ContributionCategory[]): ContributionCategory[] {
  return criticalCategories.filter((cat) => {
    const c = coverage.find((cv) => cv.category === cat)
    return !c || c.count === 0
  })
}
