-- ============================================================
-- Arsenic — Migration 003 : nouvelles tables + ajustements
-- ============================================================

-- ============================================================
-- ALTERATIONS TABLES EXISTANTES
-- ============================================================

-- Participants ajoutés manuellement par l'organisateur
alter table event_participants
  add column if not exists added_by_organizer boolean not null default false;

-- Réponses créées manuellement par l'organisateur
alter table participant_responses
  add column if not exists is_manual boolean not null default false;

-- ============================================================
-- EVENT_COMMENTS
-- Fil de discussion par événement, accessible à tous les participants
-- ============================================================

create table if not exists event_comments (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,
  guest_name  text,                          -- réservé pour usage futur
  content     text not null check (char_length(content) between 1 and 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz                    -- soft delete
);

create index if not exists idx_event_comments_event
  on event_comments(event_id, created_at);

create trigger trg_event_comments_updated_at
  before update on event_comments
  for each row execute function set_updated_at();

alter table event_comments enable row level security;

-- Lecture : tous les participants de l'événement
create policy "comments_select_participants" on event_comments
  for select using (
    deleted_at is null
    and event_id in (
      select event_id from event_participants where user_id = auth.uid()
      union
      select id from events where organizer_id = auth.uid()
    )
  );

-- Insertion : participants authentifiés de l'événement
create policy "comments_insert_participant" on event_comments
  for insert with check (
    user_id = auth.uid()
    and event_id in (
      select event_id from event_participants where user_id = auth.uid()
      union
      select id from events where organizer_id = auth.uid()
    )
  );

-- Soft-delete : auteur ou organisateur
create policy "comments_delete_own_or_organizer" on event_comments
  for update using (
    user_id = auth.uid()
    or event_id in (select id from events where organizer_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or event_id in (select id from events where organizer_id = auth.uid())
  );

-- ============================================================
-- CONTRIBUTION_REACTIONS
-- Un like par (contribution, user) — simple et sans ambiguité
-- ============================================================

create table if not exists contribution_reactions (
  id               uuid primary key default gen_random_uuid(),
  contribution_id  uuid not null references contributions(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,
  reaction_type    text not null default 'like' check (reaction_type = 'like'),
  created_at       timestamptz not null default now(),
  unique (contribution_id, user_id)
);

create index if not exists idx_contribution_reactions_contribution
  on contribution_reactions(contribution_id);

alter table contribution_reactions enable row level security;

-- Lecture : co-participants de l'événement
create policy "reactions_select_participants" on contribution_reactions
  for select using (
    contribution_id in (
      select id from contributions
      where event_id in (
        select event_id from event_participants where user_id = auth.uid()
        union
        select id from events where organizer_id = auth.uid()
      )
    )
  );

-- Insertion : participants authentifiés
create policy "reactions_insert_own" on contribution_reactions
  for insert with check (user_id = auth.uid());

-- Suppression : uniquement son propre like
create policy "reactions_delete_own" on contribution_reactions
  for delete using (user_id = auth.uid());

-- ============================================================
-- ACCÈS ORGANISATEUR ÉTENDU
-- L'organisateur peut gérer les participants et contributions
-- ============================================================

-- Organisateur peut insérer des participants manuellement
create policy "event_participants_insert_organizer" on event_participants
  for insert with check (
    event_id in (select id from events where organizer_id = auth.uid())
    and added_by_organizer = true
  );

-- Organisateur peut modifier n'importe quel participant de ses événements
create policy "event_participants_update_organizer" on event_participants
  for update using (
    event_id in (select id from events where organizer_id = auth.uid())
  );

-- Organisateur peut supprimer n'importe quel participant de ses événements
create policy "event_participants_delete_organizer" on event_participants
  for delete using (
    event_id in (select id from events where organizer_id = auth.uid())
  );

-- Organisateur peut insérer des réponses pour ses participants
create policy "responses_insert_organizer" on participant_responses
  for insert with check (
    event_id in (select id from events where organizer_id = auth.uid())
  );

-- Organisateur peut modifier toutes les réponses de ses événements
create policy "responses_update_organizer" on participant_responses
  for update using (
    event_id in (select id from events where organizer_id = auth.uid())
  );

-- Organisateur peut insérer des contributions pour n'importe quel participant
create policy "contributions_insert_organizer" on contributions
  for insert with check (
    event_id in (select id from events where organizer_id = auth.uid())
  );

-- Organisateur peut modifier n'importe quelle contribution de ses événements
create policy "contributions_update_organizer" on contributions
  for update using (
    event_id in (select id from events where organizer_id = auth.uid())
  );
