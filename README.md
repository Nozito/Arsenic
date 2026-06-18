# Picnic Collectif

Application web de pique-nique collaboratif. Organisez, partagez, coordonnez.

## Stack

- Next.js 16 (App Router)
- TypeScript strict
- Tailwind CSS v4
- Supabase (auth, PostgreSQL, storage)
- Three.js / React Three Fiber (couche visuelle discrète)

---

## Setup local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Remplissez `.env.local` avec vos clés Supabase.

### 3. Configurer Supabase

#### a. Créer un projet sur supabase.com

#### b. Appliquer les migrations

Dans l'éditeur SQL Supabase, exécutez dans l'ordre :
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

#### c. Configurer l'auth Supabase

Dans Supabase > Authentication > Settings :
- **Site URL** : `http://localhost:3000`
- **Redirect URLs** : `http://localhost:3000/auth/callback`

#### d. Seed de données (optionnel)

Créez 4 utilisateurs dans Supabase Auth, récupérez leurs UUIDs,
mettez-les à jour dans `supabase/seed.sql`, puis exécutez-le dans l'éditeur SQL.

### 4. Lancer le projet

```bash
npm run dev
```

Ouvrir http://localhost:3000

---

## Structure du projet

```
picnic-collab/
app/
  (auth)/              Layout auth (sign-in, sign-up)
  (app)/               Layout app avec navigation
    dashboard/
    events/new/
    events/[eventId]/respond/   Vue participant
    events/[eventId]/manage/    Dashboard organisateur
    profile/
  auth/callback/       Route OAuth callback
  invite/[token]/      Entrée par lien d'invitation
components/
  ui/                  Button, Input, Card, Badge, Stars...
  auth/                SignInForm, SignUpForm
  events/              CreateEventForm, RespondForm
  contributions/       ContributionForm, ContributionsList
  dashboard/           StatsBar, ReadinessPanel, ParticipantsList...
  layout/              Nav, PageWrapper
  three/               AmbientScene (lazy-loaded WebGL)
features/
  auth/actions.ts      Server Actions auth
  events/actions.ts    Server Actions mutations
lib/supabase/          Clients browser/server
types/index.ts         Types TypeScript
utils/                 cn, duplicates, invite, readiness
supabase/
  migrations/          Schema SQL + RLS
  seed.sql
middleware.ts          Auth + redirection
```

---

## Architecture technique

### Next.js 16 - points importants

- params et searchParams sont des Promises : await params
- cookies() et headers() sont async : await cookies()
- Server Components par defaut, Client Components si necessaire

### Supabase

- Auth email/password avec sessions SSR via @supabase/ssr
- RLS strictes par table (voir 002_rls_policies.sql)
- Trigger automatique de creation de profil a l'inscription

### Three.js

- Charge uniquement cote client (ssr: false, dynamic import)
- Desactive sur appareils modestes (hardwareConcurrency <= 2)
- Respecte prefers-reduced-motion
- Scene minimaliste : 1 mesh icosaedre, 2 lumieres

---

## Variables d'environnement

NEXT_PUBLIC_SUPABASE_URL          URL de votre projet Supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   Cle anon publique
SUPABASE_SERVICE_ROLE_KEY         Cle service role (serveur uniquement)
NEXT_PUBLIC_APP_URL               URL publique de l'app (liens d'invitation)
