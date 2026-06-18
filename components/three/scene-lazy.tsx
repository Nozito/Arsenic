'use client'

import dynamic from 'next/dynamic'

// Chargé seulement côté client, jamais côté serveur
const AmbientScene = dynamic(
  () => import('./scene').then((m) => m.AmbientScene),
  { ssr: false, loading: () => null }
)

export { AmbientScene }
