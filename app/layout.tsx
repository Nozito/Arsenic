import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ToastProvider } from '@/components/ui/toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: { default: 'Arsenic', template: '%s · Arsenic' },
  description: 'Organisez votre pique-nique collaboratif.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
