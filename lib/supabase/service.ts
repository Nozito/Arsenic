import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec service role — bypass RLS complet.
 * Réservé aux opérations serveur critiques (invités sans compte).
 * NE JAMAIS exposer côté client.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant — vérifiez vos variables d'environnement.")
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
