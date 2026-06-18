export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: Partial<ProfileInsert>
      }
      events: {
        Row: Event
        Insert: EventInsert
        Update: Partial<EventInsert>
      }
      event_participants: {
        Row: EventParticipant
        Insert: EventParticipantInsert
        Update: Partial<EventParticipantInsert>
      }
      participant_responses: {
        Row: ParticipantResponse
        Insert: ParticipantResponseInsert
        Update: Partial<ParticipantResponseInsert>
      }
      contributions: {
        Row: Contribution
        Insert: ContributionInsert
        Update: Partial<ContributionInsert>
      }
    }
  }
}

// --- Profiles ---

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  phone: string | null
  dietary_restrictions: string[]
  allergens: string[]
  notes: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  phone?: string | null
  dietary_restrictions?: string[]
  allergens?: string[]
  notes?: string | null
  avatar_url?: string | null
}

// --- Events ---

export type EventStatus = 'draft' | 'active' | 'closed' | 'cancelled'

export interface Event {
  id: string
  organizer_id: string
  title: string
  description: string | null
  date: string
  time: string | null
  location: string | null
  cover_image_url: string | null
  expected_participants: number | null
  status: EventStatus
  invite_token: string
  categories_enabled: ContributionCategory[]
  allergens_enabled: boolean
  dietary_enabled: boolean
  plus_one_enabled: boolean
  response_deadline: string | null
  organizer_notes: string | null
  invitation_message: string | null
  created_at: string
  updated_at: string
}

export interface EventInsert {
  organizer_id: string
  title: string
  description?: string | null
  date: string
  time?: string | null
  location?: string | null
  cover_image_url?: string | null
  expected_participants?: number | null
  status?: EventStatus
  invite_token?: string
  categories_enabled?: ContributionCategory[]
  allergens_enabled?: boolean
  dietary_enabled?: boolean
  plus_one_enabled?: boolean
  response_deadline?: string | null
  organizer_notes?: string | null
  invitation_message?: string | null
}

// --- Participants ---

export type ResponseStatus = 'pending' | 'attending' | 'not_attending' | 'maybe'

export interface EventParticipant {
  id: string
  event_id: string
  user_id: string | null
  guest_name: string | null
  guest_email: string | null
  joined_at: string
}

export interface EventParticipantInsert {
  event_id: string
  user_id?: string | null
  guest_name?: string | null
  guest_email?: string | null
}

export interface ParticipantResponse {
  id: string
  participant_id: string
  event_id: string
  status: ResponseStatus
  headcount: number
  allergens: string[]
  dietary_restrictions: string[]
  note: string | null
  created_at: string
  updated_at: string
}

export interface ParticipantResponseInsert {
  participant_id: string
  event_id: string
  status: ResponseStatus
  headcount?: number
  allergens?: string[]
  dietary_restrictions?: string[]
  note?: string | null
}

// --- Contributions ---

export type ContributionCategory =
  | 'boissons'
  | 'sale'
  | 'sucre'
  | 'plats'
  | 'snacks'
  | 'couverts'
  | 'vaisselle'
  | 'deco'
  | 'jeux'
  | 'autre'

export const CONTRIBUTION_CATEGORIES: { value: ContributionCategory; label: string }[] = [
  { value: 'boissons', label: 'Boissons' },
  { value: 'sale', label: 'Salé' },
  { value: 'sucre', label: 'Sucré' },
  { value: 'plats', label: 'Plats' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'couverts', label: 'Couverts & Ustensiles' },
  { value: 'vaisselle', label: 'Assiettes & Gobelets' },
  { value: 'deco', label: 'Déco' },
  { value: 'jeux', label: 'Jeux & Activités' },
  { value: 'autre', label: 'Autre' },
]

export const DIETARY_OPTIONS = [
  'Végétarien',
  'Végétalien',
  'Sans gluten',
  'Sans lactose',
  'Halal',
  'Casher',
  'Sans porc',
  'Diabétique',
]

export const ALLERGEN_OPTIONS = [
  'Gluten',
  'Crustacés',
  'Oeufs',
  'Poisson',
  'Arachides',
  'Soja',
  'Lait',
  'Fruits à coque',
  'Céleri',
  'Moutarde',
  'Sésame',
  'Sulfites',
  'Lupin',
  'Mollusques',
]

export interface Contribution {
  id: string
  participant_id: string
  event_id: string
  category: ContributionCategory
  name: string
  quantity: string
  detail: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface ContributionInsert {
  participant_id: string
  event_id: string
  category: ContributionCategory
  name: string
  quantity: string
  detail?: string | null
  note?: string | null
}

// --- Comments ---

export interface EventComment {
  id: string
  event_id: string
  user_id: string | null
  guest_name: string | null
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  profile?: { display_name?: string | null; first_name?: string | null } | null
}

// --- Reactions ---

export interface ContributionReaction {
  id: string
  contribution_id: string
  user_id: string
  reaction_type: 'like'
  created_at: string
}

// --- Dashboard ---

export interface DashboardStats {
  totalInvited: number
  totalResponses: number
  attending: number
  notAttending: number
  maybe: number
  pending: number
  totalHeadcount: number
}

export interface CategoryCoverage {
  category: ContributionCategory
  label: string
  count: number
  items: string[]
  score: number // 0-5
}

export interface ReadinessScore {
  boissons: number
  sucre: number
  vaisselle: number
  sale: number
  overall: number
}

export interface DuplicateWarning {
  name: string
  normalized: string
  contributors: string[]
  category: ContributionCategory
}

// --- Extended types with joins ---

export interface EventWithOrganizer extends Event {
  organizer: Profile | null
}

export interface ParticipantWithProfile extends EventParticipant {
  profile: Profile | null
}

export interface ParticipantWithResponseAndContributions extends EventParticipant {
  profile: Profile | null
  response: ParticipantResponse | null
  contributions: Contribution[]
}

export interface EventFull extends Event {
  organizer: Profile | null
  participants: ParticipantWithResponseAndContributions[]
}
