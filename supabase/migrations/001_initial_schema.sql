-- ============================================================
-- Picnic Collectif — Schéma initial
-- ============================================================

-- Extension UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- TYPES ENUM
-- ============================================================

create type event_status as enum ('draft', 'active', 'closed', 'cancelled');
create type response_status as enum ('pending', 'attending', 'not_attending', 'maybe');
create type contribution_category as enum (
  'boissons', 'sale', 'sucre', 'plats', 'snacks',
  'couverts', 'vaisselle', 'deco', 'jeux', 'autre'
);

-- ============================================================
-- PROFILES
-- Étendu depuis auth.users - une entrée par utilisateur
-- ============================================================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  first_name    text,
  last_name     text,
  display_name  text,
  phone         text,
  dietary_restrictions  text[] not null default '{}',
  allergens             text[] not null default '{}',
  notes         text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index pour recherche par email
create index idx_profiles_email on profiles(email);

-- ============================================================
-- EVENTS
-- Créés par un organisateur, accès via token d'invitation
-- ============================================================

create table events (
  id                    uuid primary key default gen_random_uuid(),
  organizer_id          uuid not null references profiles(id) on delete cascade,
  title                 text not null,
  description           text,
  date                  date not null,
  time                  time,
  location              text,
  cover_image_url       text,
  expected_participants integer check (expected_participants > 0),
  status                event_status not null default 'active',
  -- Token unique pour le lien d'invitation - jamais exposé dans les URLs lisibles
  invite_token          text not null unique default encode(extensions.gen_random_bytes(24), 'base64'),
  categories_enabled    contribution_category[] not null default array['boissons', 'sale', 'sucre', 'plats', 'snacks', 'couverts', 'vaisselle', 'autre']::contribution_category[],
  allergens_enabled     boolean not null default true,
  dietary_enabled       boolean not null default true,
  plus_one_enabled      boolean not null default false,
  response_deadline     date,
  organizer_notes       text,
  invitation_message    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Index pour lookup par token (chemin critique des invitations)
create index idx_events_invite_token on events(invite_token);
create index idx_events_organizer on events(organizer_id);
create index idx_events_date on events(date);

-- ============================================================
-- EVENT_PARTICIPANTS
-- Un participant par (event, user) - ou invité sans compte
-- ============================================================

create table event_participants (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  user_id       uuid references profiles(id) on delete set null,
  guest_name    text,  -- pour les invités sans compte
  guest_email   text,
  joined_at     timestamptz not null default now(),
  -- Un utilisateur connecté ne peut rejoindre un événement qu'une fois
  constraint uniq_event_user unique (event_id, user_id)
);

create index idx_event_participants_event on event_participants(event_id);
create index idx_event_participants_user on event_participants(user_id);

-- ============================================================
-- PARTICIPANT_RESPONSES
-- Une réponse par participant (1-to-1 avec event_participants)
-- ============================================================

create table participant_responses (
  id                    uuid primary key default gen_random_uuid(),
  participant_id        uuid not null references event_participants(id) on delete cascade unique,
  event_id              uuid not null references events(id) on delete cascade,
  status                response_status not null default 'pending',
  headcount             integer not null default 1 check (headcount > 0),
  allergens             text[] not null default '{}',
  dietary_restrictions  text[] not null default '{}',
  note                  text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_participant_responses_event on participant_responses(event_id);
create index idx_participant_responses_participant on participant_responses(participant_id);

-- ============================================================
-- CONTRIBUTIONS
-- Ce que chaque participant apporte à l'événement
-- ============================================================

create table contributions (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references event_participants(id) on delete cascade,
  event_id        uuid not null references events(id) on delete cascade,
  category        contribution_category not null,
  name            text not null,
  quantity        text not null,
  detail          text,
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_contributions_event on contributions(event_id);
create index idx_contributions_participant on contributions(participant_id);
create index idx_contributions_category on contributions(event_id, category);

-- ============================================================
-- TRIGGERS — updated_at automatique
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_events_updated_at
  before update on events
  for each row execute function set_updated_at();

create trigger trg_responses_updated_at
  before update on participant_responses
  for each row execute function set_updated_at();

create trigger trg_contributions_updated_at
  before update on contributions
  for each row execute function set_updated_at();

-- ============================================================
-- TRIGGER — Créer le profil automatiquement à l'inscription
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'first_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
