'use client'

import { useState, useTransition } from 'react'
import { Stars } from '@/components/ui/stars'
import { Badge } from '@/components/ui/badge'
import { InlineConfirm } from '@/components/ui/inline-confirm'
import { EmptyState } from '@/components/ui/empty-state'
import { ShareBlock } from '@/components/ui/share-block'
import { EventEditPanel } from '@/components/dashboard/event-edit-panel'
import { useToast } from '@/components/ui/toast'
import { removeParticipant } from '@/features/events/organizer-actions'
import { buildInviteUrl, formatDate } from '@/utils/invite'
import { computeReadinessScore, computeCategoryCoverage } from '@/utils/readiness'
import { groupDuplicates } from '@/utils/duplicates'
import { CONTRIBUTION_CATEGORIES } from '@/types'
import type {
  Event,
  ParticipantWithResponseAndContributions,
  DashboardStats,
  Contribution,
  EventComment,
  CategoryCoverage,
  DuplicateWarning,
} from '@/types'
import { cn } from '@/utils/cn'

type TabId = 'synthese' | 'contributions' | 'participants' | 'allergenes' | 'partage' | 'parametres'

const TABS: { id: TabId; label: string }[] = [
  { id: 'synthese',       label: 'Synthèse' },
  { id: 'contributions',  label: 'Contributions' },
  { id: 'participants',   label: 'Participants' },
  { id: 'allergenes',     label: 'Allergènes' },
  { id: 'partage',        label: 'Partage' },
  { id: 'parametres',     label: 'Paramètres' },
]

interface ManageTabsProps {
  event: Event
  participants: ParticipantWithResponseAndContributions[]
  stats: DashboardStats
  comments: EventComment[]
}

export function ManageTabs({ event, participants, stats, comments }: ManageTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('synthese')
  const allContribs: Contribution[] = participants.flatMap((p) => p.contributions)
  const attending = participants.filter((p) => p.response?.status === 'attending')
  const totalHeadcount = attending.reduce((sum, p) => sum + (p.response?.headcount ?? 1), 0)
  const readiness = computeReadinessScore(allContribs, Math.max(totalHeadcount, 1))
  const coverage  = computeCategoryCoverage(allContribs)

  const contribsWithNames = allContribs.map((c) => {
    const p = participants.find((part) => part.id === c.participant_id)
    return {
      ...c,
      contributor_name:
        p?.profile?.display_name ?? p?.profile?.first_name ?? p?.guest_name ?? 'Invité',
    }
  })
  const duplicates = groupDuplicates(contribsWithNames)

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar desktop */}
      <nav className="hidden lg:flex flex-col gap-1 w-44 shrink-0 pt-1" aria-label="Sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'text-left h-9 px-3 text-sm rounded-[var(--radius-md)] transition-ui font-medium',
              activeTab === tab.id
                ? 'bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tabs mobile horizontaux */}
      <div className="lg:hidden flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'shrink-0 h-8 px-3 text-xs font-medium rounded-[var(--radius-md)] border transition-ui',
              activeTab === tab.id
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        {activeTab === 'synthese' && (
          <SyntheseTab event={event} stats={stats} readiness={readiness} coverage={coverage} />
        )}
        {activeTab === 'contributions' && (
          <ContributionsTab event={event} contribsWithNames={contribsWithNames} coverage={coverage} duplicates={duplicates} />
        )}
        {activeTab === 'participants' && (
          <ParticipantsTab event={event} participants={participants} />
        )}
        {activeTab === 'allergenes' && (
          <AllergenesTab participants={participants} />
        )}
        {activeTab === 'partage' && (
          <PartageTab event={event} />
        )}
        {activeTab === 'parametres' && (
          <ParametresTab event={event} />
        )}
      </div>
    </div>
  )
}

// ---- Sections ----

function SyntheseTab({ event, stats, readiness, coverage }: {
  event: Event
  stats: DashboardStats
  readiness: ReturnType<typeof computeReadinessScore>
  coverage: CategoryCoverage[]
}) {
  const responseRate = stats.totalInvited > 0
    ? Math.round((stats.totalResponses / stats.totalInvited) * 100)
    : 0

  // Countdown
  const today     = new Date()
  const eventDate = new Date(event.date)
  const diffMs    = eventDate.getTime() - today.getTime()
  const diffDays  = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const countdown =
    diffDays < 0  ? 'Événement passé'
    : diffDays === 0 ? "Aujourd'hui"
    : diffDays === 1 ? 'Demain'
    : diffDays < 14 ? `Dans ${diffDays} jours`
    : `Dans ${Math.ceil(diffDays / 7)} semaines`

  const uncoveredCats = event.categories_enabled.filter((cat) => {
    const cov = coverage.find((c) => c.category === cat)
    return !cov || cov.count === 0
  })

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <KpiCard label="Réponses" value={`${stats.totalResponses} / ${stats.totalInvited}`} />
        <KpiCard label="Présents" value={String(stats.attending)} />
        <KpiCard label="Taux de réponse" value={`${responseRate}%`} />
      </div>

      {/* Countdown */}
      <div
        className="flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
      >
        <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-faint)' }} viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 3V2M11 3V2M1.5 7h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          {countdown}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          {formatDate(event.date)}
        </span>
      </div>

      {/* Readiness */}
      <div
        className="rounded-[var(--radius-lg)] border overflow-hidden"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Préparation globale
            </p>
            <Stars score={readiness.overall} size="sm" />
          </div>
        </div>
        <div className="px-4 py-3 flex flex-col gap-3">
          {(['boissons', 'sale', 'sucre', 'vaisselle'] as const).map((key) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm w-20 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                {key === 'boissons' ? 'Boissons'
                  : key === 'sale' ? 'Salé'
                  : key === 'sucre' ? 'Sucré'
                  : 'Vaisselle'}
              </span>
              <Stars score={readiness[key]} />
            </div>
          ))}
        </div>
      </div>

      {/* Alertes */}
      {uncoveredCats.length > 0 && (
        <div
          className="border-l-2 border-amber-400 pl-4 py-2"
          style={{ background: 'var(--color-surface-elevated)' }}
        >
          <p className="text-sm font-medium text-amber-700 mb-0.5">Catégories non couvertes</p>
          <p className="text-xs text-amber-600">
            {uncoveredCats
              .map((c) => CONTRIBUTION_CATEGORIES.find((cat) => cat.value === c)?.label ?? c)
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

function ContributionsTab({ event, contribsWithNames, coverage, duplicates }: {
  event: Event
  contribsWithNames: Array<Contribution & { contributor_name: string }>
  coverage: CategoryCoverage[]
  duplicates: DuplicateWarning[]
}) {
  const [activeCategory, setActiveCategory] = useState<string>(event.categories_enabled[0] ?? 'autre')
  const categoryOptions = CONTRIBUTION_CATEGORIES.filter((c) => event.categories_enabled.includes(c.value))
  const activeCoverage = coverage.find((c) => c.category === activeCategory)
  const activeContribs = contribsWithNames.filter((c) => c.category === activeCategory)
  const activeDups = duplicates.filter((d) => d.category === activeCategory)

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs catégories */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {categoryOptions.map((cat) => {
          const cov = coverage.find((c) => c.category === cat.value)
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'relative shrink-0 h-8 px-3 text-xs font-medium rounded-[var(--radius-md)] border transition-ui',
                activeCategory === cat.value
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
              )}
            >
              {cat.label}
              {cov && cov.count > 0 && (
                <span className="ml-1.5 text-[var(--color-text-faint)]">({cov.count})</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Readiness catégorie */}
      {activeCoverage && (
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            {activeCoverage.count} contribution{activeCoverage.count !== 1 ? 's' : ''}
          </span>
          <Stars score={Math.min(5, activeCoverage.count)} size="sm" />
        </div>
      )}

      {/* Liste contributions */}
      {activeContribs.length === 0 ? (
        <EmptyState
          title="Aucune contribution dans cette catégorie"
          description="Les participants n'ont pas encore ajouté de contributions ici."
        />
      ) : (
        <div
          className="rounded-[var(--radius-lg)] border overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
        >
          {activeContribs.map((c, i) => {
            const isDup = activeDups.some((d) => d.normalized.includes(c.name.toLowerCase()))
            return (
              <div
                key={c.id}
                className={cn('flex items-center gap-3 px-4 py-3 text-sm', i > 0 && 'border-t')}
                style={i > 0 ? { borderColor: 'var(--color-border)' } : undefined}
              >
                <span className="w-24 shrink-0 text-xs truncate" style={{ color: 'var(--color-text-faint)' }}>
                  {c.contributor_name}
                </span>
                <span className="flex-1 font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {c.name}
                </span>
                <span className="text-xs tabular shrink-0" style={{ color: 'var(--color-text-faint)' }}>
                  {c.quantity}
                </span>
                {isDup && (
                  <Badge variant="warning">doublon</Badge>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ParticipantsTab({ event, participants }: {
  event: Event
  participants: ParticipantWithResponseAndContributions[]
}) {
  const [filter, setFilter] = useState<'all' | 'attending' | 'not_attending' | 'pending'>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const filtered = participants.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'attending') return p.response?.status === 'attending'
    if (filter === 'not_attending') return p.response?.status === 'not_attending'
    if (filter === 'pending') return !p.response
    return true
  })

  const filterTabs: { id: typeof filter; label: string; count: number }[] = [
    { id: 'all',          label: 'Tous',       count: participants.length },
    { id: 'attending',    label: 'Présents',   count: participants.filter((p) => p.response?.status === 'attending').length },
    { id: 'not_attending',label: 'Absents',    count: participants.filter((p) => p.response?.status === 'not_attending').length },
    { id: 'pending',      label: 'En attente', count: participants.filter((p) => !p.response).length },
  ]

  function handleDelete(participantId: string) {
    startTransition(async () => {
      const res = await removeParticipant(participantId, event.id)
      if (res.error) {
        toast(res.error, 'error')
      } else {
        toast('Participant supprimé.', 'info')
        setConfirmDelete(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtres */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              'shrink-0 h-8 px-3 text-xs font-medium rounded-[var(--radius-md)] border transition-ui',
              filter === tab.id
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
            )}
          >
            {tab.label} {tab.count > 0 && <span className="ml-1 opacity-70">{tab.count}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun participant dans ce filtre" />
      ) : (
        <div
          className="rounded-[var(--radius-lg)] border overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
        >
          {filtered.map((p, i) => {
            const name = p.profile?.display_name ?? p.profile?.first_name ?? p.guest_name ?? 'Invité'
            const status = p.response?.status ?? 'pending'
            const contribs = p.contributions ?? []

            return (
              <div
                key={p.id}
                className={cn('px-4 py-3 sm:px-5', i > 0 && 'border-t')}
                style={i > 0 ? { borderColor: 'var(--color-border)' } : undefined}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold select-none"
                    style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}
                    aria-hidden
                  >
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                        {name}
                      </span>
                      {p.response?.headcount && p.response.headcount > 1 && (
                        <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                          × {p.response.headcount}
                        </span>
                      )}
                    </div>
                    {contribs.length > 0 && (
                      <p className="mt-0.5 text-xs truncate" style={{ color: 'var(--color-text-faint)' }}>
                        {contribs.map((c) => c.name).join(' · ')}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={status} />
                  {confirmDelete === p.id ? null : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(p.id)}
                      className="shrink-0 h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-red-50 transition-ui"
                      aria-label={`Supprimer ${name}`}
                    >
                      <svg className="h-3 w-3 text-[var(--color-text-faint)]" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path d="M2 3h8M4.5 3V2h3v1M5 5v4M7 5v4M2 3l.5 7h7l.5-7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Allergènes / régimes */}
                {(p.response?.allergens?.length || p.response?.dietary_restrictions?.length) ? (
                  <div className="mt-2 ml-10 flex flex-wrap gap-1">
                    {(p.response?.allergens ?? []).map((a) => (
                      <span key={a} className="text-xs px-1.5 py-0.5 rounded-[var(--radius-xs)] border"
                        style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}>
                        {a}
                      </span>
                    ))}
                    {(p.response?.dietary_restrictions ?? []).map((d) => (
                      <span key={d} className="text-xs px-1.5 py-0.5 rounded-[var(--radius-xs)] border"
                        style={{ background: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }}>
                        {d}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Confirmation suppression inline */}
                {confirmDelete === p.id && (
                  <div className="mt-2 ml-10">
                    <InlineConfirm
                      message="Supprimer ce participant ?"
                      onCancel={() => setConfirmDelete(null)}
                      onConfirm={() => handleDelete(p.id)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AllergenesTab({ participants }: {
  participants: ParticipantWithResponseAndContributions[]
}) {
  const allergenMap = new Map<string, string[]>()
  const dietaryMap  = new Map<string, string[]>()

  for (const p of participants) {
    if (!p.response) continue
    const name = p.profile?.display_name ?? p.profile?.first_name ?? p.guest_name ?? 'Invité'
    for (const a of p.response.allergens ?? []) {
      if (!allergenMap.has(a)) allergenMap.set(a, [])
      allergenMap.get(a)!.push(name)
    }
    for (const d of p.response.dietary_restrictions ?? []) {
      if (!dietaryMap.has(d)) dietaryMap.set(d, [])
      dietaryMap.get(d)!.push(name)
    }
  }

  if (allergenMap.size === 0 && dietaryMap.size === 0) {
    return (
      <EmptyState
        title="Aucune contrainte alimentaire signalée"
        description="Les participants n'ont pas encore renseigné leurs allergènes ou régimes."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {allergenMap.size > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-faint)' }}>
            Allergènes
          </p>
          <div
            className="rounded-[var(--radius-lg)] border overflow-hidden"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            {Array.from(allergenMap.entries()).map(([allergen, names], i) => (
              <div
                key={allergen}
                className={cn('flex items-start gap-4 px-4 py-3 text-sm', i > 0 && 'border-t')}
                style={i > 0 ? { borderColor: 'var(--color-border)' } : undefined}
              >
                <span className="w-32 shrink-0 font-medium" style={{ color: 'var(--color-text)' }}>
                  {allergen}
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {names.length} personne{names.length !== 1 ? 's' : ''} — {names.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dietaryMap.size > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-faint)' }}>
            Régimes alimentaires
          </p>
          <div
            className="rounded-[var(--radius-lg)] border overflow-hidden"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            {Array.from(dietaryMap.entries()).map(([diet, names], i) => (
              <div
                key={diet}
                className={cn('flex items-start gap-4 px-4 py-3 text-sm', i > 0 && 'border-t')}
                style={i > 0 ? { borderColor: 'var(--color-border)' } : undefined}
              >
                <span className="w-32 shrink-0 font-medium" style={{ color: 'var(--color-text)' }}>
                  {diet}
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {names.length} personne{names.length !== 1 ? 's' : ''} — {names.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PartageTab({ event }: { event: Event }) {
  const url = buildInviteUrl(event.invite_token)
  return (
    <div>
      <ShareBlock url={url} title={event.title} />
    </div>
  )
}

function ParametresTab({ event }: { event: Event }) {
  return (
    <div>
      <EventEditPanel event={event} onClose={() => {}} />
    </div>
  )
}

// ---- Sous-composants ----

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[var(--radius-lg)] border px-4 py-3.5"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
    >
      <p className="text-2xl font-semibold tabular tracking-tight leading-none mb-1.5" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'attending':     return <Badge variant="success">Présent</Badge>
    case 'not_attending': return <Badge variant="danger">Absent</Badge>
    case 'maybe':         return <Badge variant="warning">Peut-être</Badge>
    default:              return <Badge variant="neutral">En attente</Badge>
  }
}
