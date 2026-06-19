-- ============================================================
-- Arsenic — Migration 004 : co-organisateurs
-- ============================================================

-- Ajout du champ co-organisateur sur event_participants
alter table event_participants
  add column if not exists is_co_organizer boolean not null default false;

-- RLS: co-organisateur peut lire les participants
create policy "event_participants_select_co_organizer" on event_participants
  for select using (
    event_id in (
      select ep.event_id from event_participants ep
      where ep.user_id = auth.uid() and ep.is_co_organizer = true
    )
  );

-- RLS: co-organisateur peut modifier les participants
create policy "event_participants_update_co_organizer" on event_participants
  for update using (
    event_id in (
      select ep.event_id from event_participants ep
      where ep.user_id = auth.uid() and ep.is_co_organizer = true
    )
  );

-- RLS: co-organisateur peut modifier les réponses
create policy "responses_update_co_organizer" on participant_responses
  for update using (
    event_id in (
      select ep.event_id from event_participants ep
      where ep.user_id = auth.uid() and ep.is_co_organizer = true
    )
  );

-- RLS: co-organisateur peut insérer des réponses
create policy "responses_insert_co_organizer" on participant_responses
  for insert with check (
    event_id in (
      select ep.event_id from event_participants ep
      where ep.user_id = auth.uid() and ep.is_co_organizer = true
    )
  );

-- RLS: co-organisateur peut modifier les contributions
create policy "contributions_update_co_organizer" on contributions
  for update using (
    event_id in (
      select ep.event_id from event_participants ep
      where ep.user_id = auth.uid() and ep.is_co_organizer = true
    )
  );

-- RLS: co-organisateur peut insérer des contributions
create policy "contributions_insert_co_organizer" on contributions
  for insert with check (
    event_id in (
      select ep.event_id from event_participants ep
      where ep.user_id = auth.uid() and ep.is_co_organizer = true
    )
  );

-- RLS: co-organisateur peut supprimer des contributions
create policy "contributions_delete_co_organizer" on contributions
  for delete using (
    event_id in (
      select ep.event_id from event_participants ep
      where ep.user_id = auth.uid() and ep.is_co_organizer = true
    )
  );
