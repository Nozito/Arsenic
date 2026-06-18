'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { cn } from '@/utils/cn'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  toast: (msg: string, type?: Toast['type']) => void
}

export const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  )
}

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-center gap-3 px-4 py-3 text-sm',
        'rounded-[var(--radius-md)] border shadow-sm',
        'bg-[var(--color-surface-elevated)]',
        'animate-fade-in',
        t.type === 'success' && 'border-[var(--color-accent)] text-[var(--color-text)]',
        t.type === 'error'   && 'border-red-300 text-red-700',
        t.type === 'info'    && 'border-[var(--color-border)] text-[var(--color-text)]',
      )}
    >
      {t.type === 'success' && (
        <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {t.type === 'error' && (
        <svg className="h-3.5 w-3.5 shrink-0 text-red-500" viewBox="0 0 14 14" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 4.5v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
      <span className="flex-1">{t.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Fermer"
      >
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
