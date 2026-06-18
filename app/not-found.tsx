import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4">
      <div className="text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-stone-400 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-stone-900 mb-2">Page introuvable</h1>
        <p className="text-sm text-stone-500 mb-8">Cette page n'existe pas ou a été déplacée.</p>
        <Link href="/dashboard">
          <Button variant="outline">Retour au tableau de bord</Button>
        </Link>
      </div>
    </div>
  )
}
