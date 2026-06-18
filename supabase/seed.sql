-- ============================================================
-- Seed de données de démonstration
-- ============================================================
-- IMPORTANT : À exécuter après avoir créé manuellement les utilisateurs
-- dans l'interface Supabase Auth, puis mettre à jour les UUIDs ci-dessous.
--
-- Utilisateurs de démonstration :
--   organisateur@picnic.test  (mot de passe : demo1234)
--   alice@picnic.test         (mot de passe : demo1234)
--   thomas@picnic.test        (mot de passe : demo1234)
--   sarah@picnic.test         (mot de passe : demo1234)
-- ============================================================

-- Remplacez ces UUIDs par les vrais IDs Supabase Auth après création
do $$
declare
  org_id  uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  alice_id uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
  thomas_id uuid := 'cccccccc-0000-0000-0000-000000000003';
  sarah_id uuid := 'dddddddd-0000-0000-0000-000000000004';
  event_id uuid;
  org_part_id uuid;
  alice_part_id uuid;
  thomas_part_id uuid;
  sarah_part_id uuid;
begin

  -- Profils
  insert into profiles (id, email, first_name, last_name, display_name, dietary_restrictions, allergens)
  values
    (org_id,    'organisateur@picnic.test', 'Marc',   'Dupont',  'Marc',   '{}', '{}'),
    (alice_id,  'alice@picnic.test',        'Alice',  'Martin',  'Alice',  '{"Végétarienne"}', '{"Gluten"}'),
    (thomas_id, 'thomas@picnic.test',       'Thomas', 'Bernard', 'Thomas', '{}', '{}'),
    (sarah_id,  'sarah@picnic.test',        'Sarah',  'Lemaire', 'Sarah',  '{}', '{"Arachides"}')
  on conflict (id) do nothing;

  -- Événement
  insert into events (
    id, organizer_id, title, description, date, time, location,
    expected_participants, status, invite_token,
    categories_enabled, allergens_enabled, dietary_enabled, plus_one_enabled,
    invitation_message
  )
  values (
    gen_random_uuid(), org_id,
    'Pique-nique du parc de la Villette',
    'Notre pique-nique annuel dans le parc. Venez nombreux !',
    current_date + interval '14 days',
    '12:30',
    'Parc de la Villette, Paris 19e — Pelouse Triangle',
    20,
    'active',
    'demo-invite-token-2024',
    array['boissons','sale','sucre','plats','snacks','couverts','vaisselle','autre']::contribution_category[],
    true, true, true,
    'Bonjour ! Je vous invite à notre pique-nique collaboratif. Indiquez ce que vous pouvez apporter.'
  )
  returning id into event_id;

  -- Participants
  insert into event_participants (id, event_id, user_id)
  values
    (gen_random_uuid(), event_id, org_id),
    (gen_random_uuid(), event_id, alice_id),
    (gen_random_uuid(), event_id, thomas_id),
    (gen_random_uuid(), event_id, sarah_id);

  -- Récupérer les IDs participants
  select id into org_part_id    from event_participants where event_id = event_id and user_id = org_id;
  select id into alice_part_id  from event_participants where event_id = event_id and user_id = alice_id;
  select id into thomas_part_id from event_participants where event_id = event_id and user_id = thomas_id;
  select id into sarah_part_id  from event_participants where event_id = event_id and user_id = sarah_id;

  -- Réponses
  insert into participant_responses (participant_id, event_id, status, headcount, allergens, dietary_restrictions)
  values
    (org_part_id,    event_id, 'attending', 2, '{}', '{}'),
    (alice_part_id,  event_id, 'attending', 1, '{"Gluten"}', '{"Végétarienne"}'),
    (thomas_part_id, event_id, 'attending', 3, '{}', '{}'),
    (sarah_part_id,  event_id, 'maybe', 1, '{"Arachides"}', '{}');

  -- Contributions
  insert into contributions (participant_id, event_id, category, name, quantity, detail)
  values
    (org_part_id,    event_id, 'boissons', 'Coca-Cola', '2 bouteilles 1.5L', null),
    (org_part_id,    event_id, 'vaisselle', 'Assiettes carton', '25 pièces', null),
    (alice_part_id,  event_id, 'sucre', 'Tarte aux fruits', '1 grande tarte', 'sans gluten'),
    (alice_part_id,  event_id, 'boissons', 'Jus d''orange', '1 bouteille 1L', 'Pressé frais'),
    (thomas_part_id, event_id, 'plats', 'Quiche lorraine', '2 quiches', null),
    (thomas_part_id, event_id, 'boissons', 'Coke', '1 bouteille 2L', null),  -- doublon intentionnel
    (sarah_part_id,  event_id, 'snacks', 'Chips', '3 sachets', 'sans arachides'),
    (sarah_part_id,  event_id, 'sale', 'Mozzarella tomates', 'pour 8 personnes', null);

end $$;
