// Helper pour typer les résultats des requêtes Supabase
// sans avoir les types générés automatiquement
// À remplacer par les types générés (supabase gen types) une fois le projet Supabase créé

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseClient = any

export function typed<T>(data: unknown): T {
  return data as T
}
