import { Nav } from '@/components/layout/nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <Nav />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
