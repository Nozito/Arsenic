'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Stars } from '@/components/ui/stars'
import { Badge } from '@/components/ui/badge'
import { InlineConfirm } from '@/components/ui/inline-confirm'
import { EmptyState } from '@/components/ui/empty-state'
import { ShareBlock } from '@/components/ui/share-block'
import { EventEditPanel } from '@/components/dashboard/event-edit-panel'
import { EventComments } from '@/components/comments/event-comments'
import { useToast } from '@/components/ui/toast'
import {
  removeParticipant,
  updateParticipant,
  addContributionAsOrganizer,
  deleteContributionAsOrganizer,
  updateContribution,
  setCoOrganizer,
} from '@/features/events/organizer-actions'
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
  ContributionCategory,
  ResponseStatus,
} from '@/types'
import { cn } from '@/utils/cn'

type TabId = 'synthese' | 'contributions' | 'participants' | 'allergenes' | 'discussion' | 'partage' | 'parametres'

const TABS: { id: TabId; label: string }[] = [
  { id: 'synthese',       label: 'Synthèse' },
  { id: 'contributions',  label: 'Contributions' },
  { id: 'participants',   label: 'Participants' },
  { id: 'allergenes',     label: 'Allergènes' },
  { id: 'discussion',     label: 'Discussion' },
  { id: 'partage',        label: 'Partage' },
  { id: 'parametres',     label: 'Paramètres' },
]

interface ManageTabsProps {
  event: Event
  participants: ParticipantWithResponseAndContributions[]
  stats: DashboardStats
  comments: EventComment[]
  currentUserId: string
  isOrganizer: boolean
}

export function ManageTabs({ event, participants, stats, comments, currentUserId, isOrganizer }: ManageTabsProps) {
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
          <ParticipantsTab event={event} participants={participants} isOrganizer={isOrganizer} />
        )}
        {activeTab === 'allergenes' && (
          <AllergenesTab participants={participants} />
        )}
        {activeTab === 'discussion' && (
          <div
            className="rounded-[var(--radius-lg)] border overflow-hidden"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            <EventComments
              eventId={event.id}
              currentUserId={currentUserId}
              isOrganizer={isOrganizer}
              initialComments={comments}
            />
          </div>
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

// ---- ContributionsTab — with inline edit + delete ----

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
              <ContributionRow
                key={c.id}
                contribution={c}
                eventId={event.id}
                isDup={isDup}
                isFirst={i === 0}
                categoryOptions={categoryOptions}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function ContributionRow({
  contribution,
  eventId,
  isDup,
  isFirst,
  categoryOptions,
}: {
  contribution: Contribution & { contributor_name: string }
  eventId: string
  isDup: boolean
  isFirst: boolean
  categoryOptions: { value: ContributionCategory; label: string }[]
}) {
  const [editing, setEditing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [editName, setEditName] = useState(contribution.name)
  const [editQty, setEditQty] = useState(contribution.quantity)
  const [editCat, setEditCat] = useState<ContributionCategory>(contribution.category)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  function handleUpdate() {
    const fd = new FormData()
    fd.append('event_id', eventId)
    fd.append('contribution_id', contribution.id)
    fd.append('name', editName)
    fd.append('quantity', editQty)
    fd.append('category', editCat)
    startTransition(async () => {
      const res = await updateContribution({}, fd)
      if (res.error) {
        toast(res.error, 'error')
      } else {
        toast('Contribution modifiée.', 'success')
        setEditing(false)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteContributionAsOrganizer(contribution.id, eventId)
      if (res.error) {
        toast(res.error, 'error')
      } else {
        toast('Contribution supprimée.', 'info')
        router.refresh()
      }
    })
  }

  return (
    <div
      className={cn('px-4 py-3 text-sm', !isFirst && 'border-t')}
      style={!isFirst ? { borderColor: 'var(--color-border)' } : undefined}
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 min-w-0 h-8 px-2 text-sm rounded-[var(--radius-sm)] border"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder="Nom"
            />
            <input
              value={editQty}
              onChange={(e) => setEditQty(e.target.value)}
              className="w-24 h-8 px-2 text-sm rounded-[var(--radius-sm)] border"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder="Qté"
            />
            <select
              value={editCat}
              onChange={(e) => setEditCat(e.target.value as ContributionCategory)}
              className="h-8 px-2 text-sm rounded-[var(--radius-sm)] border"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isPending}
              className="h-7 px-3 text-xs font-medium rounded-[var(--radius-sm)] transition-ui"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setEditName(contribution.name)
                setEditQty(contribution.quantity)
                setEditCat(contribution.category)
              }}
              className="h-7 px-3 text-xs font-medium rounded-[var(--radius-sm)] border transition-ui"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <span className="w-24 shrink-0 text-xs truncate pt-0.5" style={{ color: 'var(--color-text-faint)' }}>
              {contribution.contributor_name}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-medium truncate block" style={{ color: 'var(--color-text)' }}>
                {contribution.name}
              </span>
              {contribution.detail && (
                <span className="text-xs truncate block" style={{ color: 'var(--color-text-faint)' }}>
                  {contribution.detail}
                </span>
              )}
              {contribution.note && (
                <span className="text-xs truncate block italic" style={{ color: 'var(--color-text-faint)' }}>
                  {contribution.note}
                </span>
              )}
            </div>
            <span className="text-xs tabular shrink-0" style={{ color: 'var(--color-text-faint)' }}>
              {contribution.quantity}
            </span>
            {isDup && <Badge variant="warning">doublon</Badge>}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 h-6 px-2 text-xs rounded-[var(--radius-sm)] border transition-ui"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              Modifier
            </button>
            {!confirmDel && (
              <button
                type="button"
                onClick={() => setConfirmDel(true)}
                className="shrink-0 h-6 w-6 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-red-50 transition-ui"
                aria-label="Supprimer"
              >
                <svg className="h-3 w-3" style={{ color: 'var(--color-text-faint)' }} viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2 3h8M4.5 3V2h3v1M5 5v4M7 5v4M2 3l.5 7h7l.5-7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
          {confirmDel && (
            <div className="mt-2 ml-24">
              <InlineConfirm
                message="Supprimer cette contribution ?"
                onCancel={() => setConfirmDel(false)}
                onConfirm={handleDelete}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ---- ParticipantsTab — with expandable row ----

function ParticipantsTab({ event, participants, isOrganizer }: {
  event: Event
  participants: ParticipantWithResponseAndContributions[]
  isOrganizer: boolean
}) {
  const [filter, setFilter] = useState<'all' | 'attending' | 'not_attending' | 'pending'>('all')

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
          {filtered.map((p, i) => (
            <ParticipantRow
              key={p.id}
              participant={p}
              event={event}
              isFirst={i === 0}
              isOrganizer={isOrganizer}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ParticipantRow({
  participant: p,
  event,
  isFirst,
  isOrganizer,
}: {
  participant: ParticipantWithResponseAndContributions
  event: Event
  isFirst: boolean
  isOrganizer: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  // Presence form state
  const [status, setStatus] = useState<ResponseStatus>(p.response?.status ?? 'attending')
  const [editHc, setEditHc] = useState(p.response?.headcount ?? 1)
  const [note, setNote] = useState(p.response?.note ?? '')

  // Add contribution form state
  const [addName, setAddName] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addCat, setAddCat] = useState<ContributionCategory>(event.categories_enabled[0] ?? 'autre')
  const [confirmDelContrib, setConfirmDelContrib] = useState<string | null>(null)

  const name = p.profile?.display_name ?? p.profile?.first_name ?? p.guest_name ?? 'Invité'
  const statusValue = p.response?.status ?? 'pending'
  const contribs = p.contributions ?? []
  const isEventOrganizer = p.user_id === event.organizer_id

  const categoryOptions = CONTRIBUTION_CATEGORIES.filter((c) =>
    event.categories_enabled.includes(c.value)
  )

  function handleUpdatePresence() {
    const fd = new FormData()
    fd.append('event_id', event.id)
    fd.append('participant_id', p.id)
    fd.append('status', status)
    fd.append('headcount', String(editHc))
    fd.append('note', note)
    startTransition(async () => {
      const res = await updateParticipant({}, fd)
      if (res.error) {
        toast(res.error, 'error')
      } else {
        toast('Présence mise à jour.', 'success')
        router.refresh()
      }
    })
  }

  function handleDeleteContrib(contributionId: string) {
    startTransition(async () => {
      const res = await deleteContributionAsOrganizer(contributionId, event.id)
      if (res.error) {
        toast(res.error, 'error')
      } else {
        toast('Contribution supprimée.', 'info')
        setConfirmDelContrib(null)
        router.refresh()
      }
    })
  }

  function handleAddContrib() {
    if (!addName || !addQty) return
    const fd = new FormData()
    fd.append('event_id', event.id)
    fd.append('participant_id', p.id)
    fd.append('name', addName)
    fd.append('quantity', addQty)
    fd.append('category', addCat)
    startTransition(async () => {
      const res = await addContributionAsOrganizer({}, fd)
      if (res.error) {
        toast(res.error, 'error')
      } else {
        toast('Contribution ajoutée.', 'success')
        setAddName('')
        setAddQty('')
        router.refresh()
      }
    })
  }

  function handleRemove() {
    startTransition(async () => {
      const res = await removeParticipant(p.id, event.id)
      if (res.error) {
        toast(res.error, 'error')
      } else {
        toast('Participant retiré.', 'info')
        router.refresh()
      }
    })
  }

  function handleToggleCoOrg() {
    const newValue = !p.is_co_organizer
    startTransition(async () => {
      const res = await setCoOrganizer(p.id, event.id, newValue)
      if (res.error) {
        toast(res.error, 'error')
      } else {
        toast(newValue ? 'Co-organisateur ajouté.' : 'Rôle retiré.', 'success')
        router.refresh()
      }
    })
  }

  return (
    <div
      className={cn('', !isFirst && 'border-t')}
      style={!isFirst ? { borderColor: 'var(--color-border)' } : undefined}
    >
      {/* Row header — always visible */}
      <div className="px-4 py-3 sm:px-5">
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
              {p.is_co_organizer && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-[var(--radius-xs)] font-medium"
                  style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                >
                  Co-org
                </span>
              )}
              {(p as any).added_by_organizer && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-[var(--radius-xs)] font-medium"
                  style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                >
                  Manuel
                </span>
              )}
            </div>
            {contribs.length > 0 && (
              <p className="mt-0.5 text-xs truncate" style={{ color: 'var(--color-text-faint)' }}>
                {contribs.map((c) => c.name).join(' · ')}
              </p>
            )}
          </div>
          <StatusBadge status={statusValue} />
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border transition-ui"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            aria-label={expanded ? 'Réduire' : 'Modifier'}
          >
            <svg
              className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')}
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
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
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="px-4 pb-4 sm:px-5 flex flex-col gap-4 border-t"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}
        >
          {/* Infos participant */}
          {(p.guest_email || p.joined_at || p.response?.note || (p.response as any)?.is_manual) && (
            <div className="pt-3 flex flex-col gap-1.5">
              {p.guest_email && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <svg className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} viewBox="0 0 16 16" fill="none" aria-hidden>
                    <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M2 6l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <span>{p.guest_email}</span>
                </div>
              )}
              {p.joined_at && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <svg className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-faint)' }} viewBox="0 0 16 16" fill="none" aria-hidden>
                    <rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5 3V2M11 3V2M1.5 7h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <span>Inscrit le {new Date(p.joined_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {(p.response as any)?.is_manual && (
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  Réponse saisie manuellement
                </p>
              )}
              {p.response?.note && (
                <div
                  className="mt-1 rounded-[var(--radius-sm)] px-3 py-2 text-xs"
                  style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  <span className="font-medium" style={{ color: 'var(--color-text-faint)' }}>Note : </span>
                  {p.response.note}
                </div>
              )}
            </div>
          )}

          {/* Section Présence */}
          <div className={p.guest_email || p.joined_at || p.response?.note || (p.response as any)?.is_manual ? '' : 'pt-3'}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-faint)' }}>
              Présence
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ResponseStatus)}
                  className="h-8 px-2 text-sm rounded-[var(--radius-sm)] border flex-1 min-w-[140px]"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="attending">Présent</option>
                  <option value="maybe">Peut-être</option>
                  <option value="not_attending">Absent</option>
                  <option value="pending">En attente</option>
                </select>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setEditHc(Math.max(1, editHc - 1))}
                    className="h-8 w-8 rounded-[var(--radius-sm)] border flex items-center justify-center text-lg"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>−</button>
                  <span className="w-8 text-center text-sm font-semibold tabular" style={{ color: 'var(--color-text)' }}>{editHc}</span>
                  <button type="button" onClick={() => setEditHc(Math.min(20, editHc + 1))}
                    className="h-8 w-8 rounded-[var(--radius-sm)] border flex items-center justify-center text-lg"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>+</button>
                </div>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 text-sm rounded-[var(--radius-sm)] border resize-none"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                placeholder="Note (optionnel)"
              />
              <div>
                <button
                  type="button"
                  onClick={handleUpdatePresence}
                  disabled={isPending}
                  className="h-8 px-4 text-xs font-medium rounded-[var(--radius-sm)] transition-ui"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}
                >
                  {isPending ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>

          {/* Section Contributions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-faint)' }}>
              Contributions
            </p>
            {contribs.length > 0 ? (
              <div
                className="rounded-[var(--radius-md)] border overflow-hidden mb-2"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
              >
                {contribs.map((c, i) => (
                  <div
                    key={c.id}
                    className={cn('flex items-start gap-2 px-3 py-2 text-xs', i > 0 && 'border-t')}
                    style={i > 0 ? { borderColor: 'var(--color-border)' } : undefined}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="truncate font-medium block" style={{ color: 'var(--color-text)' }}>
                        {c.name}
                      </span>
                      {c.detail && (
                        <span className="truncate block" style={{ color: 'var(--color-text-faint)' }}>
                          {c.detail}
                        </span>
                      )}
                      {c.note && (
                        <span className="truncate block italic" style={{ color: 'var(--color-text-faint)' }}>
                          {c.note}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--color-text-faint)' }}>{c.quantity}</span>
                    <span
                      className="px-1.5 py-0.5 rounded-[var(--radius-xs)]"
                      style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}
                    >
                      {CONTRIBUTION_CATEGORIES.find((cat) => cat.value === c.category)?.label ?? c.category}
                    </span>
                    {confirmDelContrib === c.id ? (
                      <InlineConfirm
                        message="Supprimer ?"
                        onCancel={() => setConfirmDelContrib(null)}
                        onConfirm={() => handleDeleteContrib(c.id)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelContrib(c.id)}
                        className="shrink-0 h-5 w-5 flex items-center justify-center rounded-[var(--radius-xs)] hover:bg-red-50 transition-ui"
                        aria-label={`Supprimer ${c.name}`}
                      >
                        <svg className="h-3 w-3" style={{ color: 'var(--color-text-faint)' }} viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path d="M2 3h8M4.5 3V2h3v1M5 5v4M7 5v4M2 3l.5 7h7l.5-7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-faint)' }}>
                Aucune contribution pour ce participant.
              </p>
            )}

            {/* Formulaire ajout contribution */}
            <div className="flex gap-2 flex-wrap">
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="flex-1 min-w-[120px] h-7 px-2 text-xs rounded-[var(--radius-sm)] border"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                placeholder="Nom"
              />
              <input
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                className="w-20 h-7 px-2 text-xs rounded-[var(--radius-sm)] border"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                placeholder="Qté"
              />
              <select
                value={addCat}
                onChange={(e) => setAddCat(e.target.value as ContributionCategory)}
                className="h-7 px-2 text-xs rounded-[var(--radius-sm)] border"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddContrib}
                disabled={isPending || !addName || !addQty}
                className="h-7 px-3 text-xs font-medium rounded-[var(--radius-sm)] border transition-ui disabled:opacity-40"
                style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
              >
                + Ajouter
              </button>
            </div>
          </div>

          {/* Section Rôle — seulement si le participant est authentifié, non-organisateur, et qu'on est l'organisateur principal */}
          {isOrganizer && p.user_id && !isEventOrganizer && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-faint)' }}>
                Rôle
              </p>
              <div className="flex items-center gap-3">
                {p.is_co_organizer && (
                  <span
                    className="text-xs px-2 py-1 rounded-[var(--radius-xs)] font-medium"
                    style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                  >
                    Co-organisateur
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleToggleCoOrg}
                  disabled={isPending}
                  className="h-7 px-3 text-xs font-medium rounded-[var(--radius-sm)] border transition-ui"
                  style={
                    p.is_co_organizer
                      ? { borderColor: '#fecaca', color: '#dc2626', background: '#fef2f2' }
                      : { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }
                  }
                >
                  {p.is_co_organizer ? 'Rétrograder' : 'Promouvoir co-organisateur'}
                </button>
              </div>
            </div>
          )}

          {/* Bouton retirer */}
          <div className="pt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
            {confirmDelete ? (
              <InlineConfirm
                message="Retirer ce participant ? Toutes ses contributions seront supprimées."
                onCancel={() => setConfirmDelete(false)}
                onConfirm={handleRemove}
              />
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="h-7 px-3 text-xs font-medium rounded-[var(--radius-sm)] transition-ui"
                style={{ color: '#dc2626', background: '#fef2f2' }}
              >
                Retirer ce participant
              </button>
            )}
          </div>
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
