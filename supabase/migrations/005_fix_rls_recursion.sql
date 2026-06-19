-- ============================================================
-- Migration 005 : Correction récursion infinie RLS
-- ============================================================
-- Problème : des policies sur event_participants contenaient des
-- sous-requêtes sur event_participants → récursion infinie (42P17).
-- Fix : fonctions SECURITY DEFINER qui bypassent le RLS pour les
-- lookups internes, puis réécriture des policies concernées.
-- ============================================================

-- Fonctions helper (SECURITY DEFINER = pas de RLS sur l'accès interne)

create or replace function get_my_event_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select event_id from event_participants
  where user_id = auth.uid()
$$;

create or replace function get_my_participant_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from event_participants
  where user_id = auth.uid()
$$;

create or replace function get_co_organizer_event_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select event_id from event_participants
  where user_id = auth.uid() and is_co_organizer = true
$$;

-- ----------------------------------------------------------------
-- EVENT_PARTICIPANTS : corriger les policies auto-référençantes
-- ----------------------------------------------------------------

drop policy if exists "event_participants_select_co_participant" on event_participants;
create policy "event_participants_select_co_participant" on event_participants
  for select using (event_id in (select get_my_event_ids()));

drop policy if exists "event_participants_select_co_organizer" on event_participants;
create policy "event_participants_select_co_organizer" on event_participants
  for select using (event_id in (select get_co_organizer_event_ids()));

drop policy if exists "event_participants_update_co_organizer" on event_participants;
create policy "event_participants_update_co_organizer" on event_participants
  for update using (event_id in (select get_co_organizer_event_ids()));

-- ----------------------------------------------------------------
-- PARTICIPANT_RESPONSES : utiliser les fonctions helper
-- ----------------------------------------------------------------

drop policy if exists "responses_select_own" on participant_responses;
create policy "responses_select_own" on participant_responses
  for select using (participant_id in (select get_my_participant_ids()));

drop policy if exists "responses_select_co_participant" on participant_responses;
create policy "responses_select_co_participant" on participant_responses
  for select using (event_id in (select get_my_event_ids()));

drop policy if exists "responses_insert_own" on participant_responses;
create policy "responses_insert_own" on participant_responses
  for insert with check (participant_id in (select get_my_participant_ids()));

drop policy if exists "responses_update_own" on participant_responses;
create policy "responses_update_own" on participant_responses
  for update using (participant_id in (select get_my_participant_ids()))
  with check (participant_id in (select get_my_participant_ids()));

drop policy if exists "responses_update_co_organizer" on participant_responses;
create policy "responses_update_co_organizer" on participant_responses
  for update using (event_id in (select get_co_organizer_event_ids()));

drop policy if exists "responses_insert_co_organizer" on participant_responses;
create policy "responses_insert_co_organizer" on participant_responses
  for insert with check (event_id in (select get_co_organizer_event_ids()));

-- ----------------------------------------------------------------
-- CONTRIBUTIONS : utiliser les fonctions helper
-- ----------------------------------------------------------------

drop policy if exists "contributions_select_co_participant" on contributions;
create policy "contributions_select_co_participant" on contributions
  for select using (event_id in (select get_my_event_ids()));

drop policy if exists "contributions_insert_own" on contributions;
create policy "contributions_insert_own" on contributions
  for insert with check (participant_id in (select get_my_participant_ids()));

drop policy if exists "contributions_update_own" on contributions;
create policy "contributions_update_own" on contributions
  for update using (participant_id in (select get_my_participant_ids()));

drop policy if exists "contributions_delete_own" on contributions;
create policy "contributions_delete_own" on contributions
  for delete using (
    participant_id in (select get_my_participant_ids())
    or event_id in (select id from events where organizer_id = auth.uid())
  );

drop policy if exists "contributions_update_co_organizer" on contributions;
create policy "contributions_update_co_organizer" on contributions
  for update using (event_id in (select get_co_organizer_event_ids()));

drop policy if exists "contributions_insert_co_organizer" on contributions;
create policy "contributions_insert_co_organizer" on contributions
  for insert with check (event_id in (select get_co_organizer_event_ids()));

drop policy if exists "contributions_delete_co_organizer" on contributions;
create policy "contributions_delete_co_organizer" on contributions
  for delete using (event_id in (select get_co_organizer_event_ids()));

-- ----------------------------------------------------------------
-- PROFILES : utiliser les fonctions helper
-- ----------------------------------------------------------------

drop policy if exists "profiles_select_co_participants" on profiles;
create policy "profiles_select_co_participants" on profiles
  for select using (
    id in (
      select ep.user_id
      from event_participants ep
      where ep.event_id in (select get_my_event_ids())
      and ep.user_id is not null
    )
  );
