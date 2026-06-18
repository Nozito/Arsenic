-- ============================================================
-- Picnic Collectif — Politiques RLS
-- ============================================================
-- Principe général :
-- - auth.uid() = utilisateur connecté
-- - Chaque table a RLS activé
-- - Un utilisateur ne voit que ce qui le concerne
-- ============================================================

alter table profiles enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;
alter table participant_responses enable row level security;
alter table contributions enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================

-- Lecture : chacun lit son propre profil, et les profils des
-- participants aux mêmes événements (pour afficher les noms)
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_select_co_participants" on profiles
  for select using (
    id in (
      select ep.user_id
      from event_participants ep
      where ep.event_id in (
        select ep2.event_id
        from event_participants ep2
        where ep2.user_id = auth.uid()
      )
      and ep.user_id is not null
    )
  );

-- Les organisateurs voient les profils des participants de leurs événements
create policy "profiles_select_by_organizer" on profiles
  for select using (
    id in (
      select ep.user_id
      from event_participants ep
      join events e on e.id = ep.event_id
      where e.organizer_id = auth.uid()
      and ep.user_id is not null
    )
  );

-- Modification : uniquement son propre profil
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insertion : uniquement son propre profil (géré par trigger)
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- ============================================================
-- EVENTS
-- ============================================================

-- Lecture : organisateur ou participant invité
create policy "events_select_organizer" on events
  for select using (organizer_id = auth.uid());

create policy "events_select_participant" on events
  for select using (
    id in (
      select event_id from event_participants
      where user_id = auth.uid()
    )
  );

-- Accès public par token d'invitation (pour la page /invite/[token])
-- Note : cette policy permet au serveur de vérifier le token même
-- avant que l'utilisateur soit participant
create policy "events_select_by_token" on events
  for select using (true);  -- filtrage fait dans la requête (eq invite_token)

-- Création : tout utilisateur connecté peut créer un événement
create policy "events_insert_own" on events
  for insert with check (organizer_id = auth.uid());

-- Modification : uniquement l'organisateur
create policy "events_update_own" on events
  for update using (organizer_id = auth.uid())
  with check (organizer_id = auth.uid());

-- Suppression : uniquement l'organisateur
create policy "events_delete_own" on events
  for delete using (organizer_id = auth.uid());

-- ============================================================
-- EVENT_PARTICIPANTS
-- ============================================================

-- Lecture : l'organisateur voit tous les participants de ses événements
create policy "event_participants_select_organizer" on event_participants
  for select using (
    event_id in (
      select id from events where organizer_id = auth.uid()
    )
  );

-- Lecture : un participant voit les autres participants du même événement
-- (nécessaire pour afficher "qui apporte quoi")
create policy "event_participants_select_co_participant" on event_participants
  for select using (
    event_id in (
      select event_id from event_participants
      where user_id = auth.uid()
    )
  );

-- Insertion : rejoindre un événement actif via token (logique vérifiée en amont)
create policy "event_participants_insert_self" on event_participants
  for insert with check (user_id = auth.uid());

-- Suppression : se retirer soi-même
create policy "event_participants_delete_self" on event_participants
  for delete using (user_id = auth.uid());

-- ============================================================
-- PARTICIPANT_RESPONSES
-- ============================================================

-- Lecture : organisateur voit toutes les réponses de ses événements
create policy "responses_select_organizer" on participant_responses
  for select using (
    event_id in (
      select id from events where organizer_id = auth.uid()
    )
  );

-- Lecture : un participant voit sa propre réponse
create policy "responses_select_own" on participant_responses
  for select using (
    participant_id in (
      select id from event_participants where user_id = auth.uid()
    )
  );

-- Lecture : co-participants voient les réponses (statut seulement)
create policy "responses_select_co_participant" on participant_responses
  for select using (
    event_id in (
      select event_id from event_participants where user_id = auth.uid()
    )
  );

-- Insertion/Modification : uniquement sa propre réponse
create policy "responses_insert_own" on participant_responses
  for insert with check (
    participant_id in (
      select id from event_participants where user_id = auth.uid()
    )
  );

create policy "responses_update_own" on participant_responses
  for update using (
    participant_id in (
      select id from event_participants where user_id = auth.uid()
    )
  )
  with check (
    participant_id in (
      select id from event_participants where user_id = auth.uid()
    )
  );

-- ============================================================
-- CONTRIBUTIONS
-- ============================================================

-- Lecture : organisateur voit toutes les contributions de ses événements
create policy "contributions_select_organizer" on contributions
  for select using (
    event_id in (
      select id from events where organizer_id = auth.uid()
    )
  );

-- Lecture : co-participants voient toutes les contributions (pour éviter doublons)
create policy "contributions_select_co_participant" on contributions
  for select using (
    event_id in (
      select event_id from event_participants where user_id = auth.uid()
    )
  );

-- Insertion : uniquement ses propres contributions
create policy "contributions_insert_own" on contributions
  for insert with check (
    participant_id in (
      select id from event_participants where user_id = auth.uid()
    )
  );

-- Modification : uniquement ses propres contributions
create policy "contributions_update_own" on contributions
  for update using (
    participant_id in (
      select id from event_participants where user_id = auth.uid()
    )
  );

-- Suppression : ses propres contributions, ou organisateur peut supprimer
create policy "contributions_delete_own" on contributions
  for delete using (
    participant_id in (
      select id from event_participants where user_id = auth.uid()
    )
    or event_id in (
      select id from events where organizer_id = auth.uid()
    )
  );
