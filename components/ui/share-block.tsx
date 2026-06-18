'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { cn } from '@/utils/cn'

interface ShareBlockProps {
  url: string
  title?: string
  compact?: boolean
  className?: string
}

export function ShareBlock({ url, title, compact = false, className }: ShareBlockProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCanShare('share' in navigator)
  }, [])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback: select input
    }
  }, [url])

  const share = useCallback(async () => {
    if (!canShare) return
    try {
      await navigator.share({ title: title ?? 'Rejoindre l\'événement', url })
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      // user cancelled or error
    }
  }, [canShare, title, url])

  const downloadQR = useCallback(() => {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return

    const padding = 16
    const size = canvas.width + padding * 2
    const offscreen = document.createElement('canvas')
    offscreen.width = size
    offscreen.height = size
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(canvas, padding, padding)

    const link = document.createElement('a')
    link.download = 'arsenic-invitation.png'
    link.href = offscreen.toDataURL('image/png')
    link.click()
  }, [])

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div ref={canvasRef} className="shrink-0 rounded-[var(--radius-sm)] overflow-hidden border border-[var(--color-border)] p-1.5 bg-white">
          <QRCodeCanvas
            value={url}
            size={64}
            bgColor="#ffffff"
            fgColor="#1a1e1a"
            level="M"
            marginSize={0}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--color-text-faint)] mb-1">Lien d'invitation</p>
          <code className="block text-xs text-[var(--color-text-muted)] font-mono truncate">{url}</code>
        </div>
        <button
          type="button"
          onClick={copy}
          className={cn(
            'shrink-0 h-8 px-3 text-xs font-medium rounded-[var(--radius-sm)]',
            'border border-[var(--color-border)] bg-[var(--color-surface-elevated)]',
            'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]',
            'transition-ui'
          )}
        >
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
    )
  }

  return (
    <div className={cn('rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden', className)}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
          Partager l'événement
        </p>
      </div>

      {/* QR Code */}
      <div className="px-5 py-6 flex flex-col items-center gap-5">
        <div
          ref={canvasRef}
          className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] p-3 bg-white shadow-sm"
        >
          <QRCodeCanvas
            value={url}
            size={160}
            bgColor="#ffffff"
            fgColor="#1a1e1a"
            level="M"
            marginSize={0}
          />
        </div>
        <p className="text-xs text-[var(--color-text-faint)] text-center leading-relaxed">
          Scannez pour rejoindre l'événement
        </p>
      </div>

      {/* URL copiable */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2.5">
          <code className="flex-1 text-xs text-[var(--color-text-muted)] font-mono truncate min-w-0">
            {url}
          </code>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={copy}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-[var(--radius-sm)]',
            'border transition-ui',
            copied
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
          )}
        >
          {copied ? (
            <>
              <CheckIcon />
              Copié
            </>
          ) : (
            <>
              <CopyIcon />
              Copier le lien
            </>
          )}
        </button>

        {canShare && (
          <button
            type="button"
            onClick={share}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-[var(--radius-sm)]',
              'border border-[var(--color-border)] bg-[var(--color-surface-elevated)]',
              'text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]',
              'transition-ui',
              shared && 'border-[var(--color-accent)] text-[var(--color-accent)]'
            )}
          >
            <ShareIcon />
            Partager
          </button>
        )}

        <button
          type="button"
          onClick={downloadQR}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-[var(--radius-sm)]',
            'border border-[var(--color-border)] bg-[var(--color-surface-elevated)]',
            'text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]',
            'transition-ui'
          )}
        >
          <DownloadIcon />
          Télécharger QR
        </button>
      </div>
    </div>
  )
}

function CopyIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="4" y="4" width="6.5" height="7" rx="1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M8 4V3a1 1 0 00-1-1H2.5a1 1 0 00-1 1v6a1 1 0 001 1H4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 6l2.5 2.5L10 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="9.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="2.5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="9.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M4 6.75L8 8.75M4 5.25L8 3.25" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M6 2v5.5M4 5.5L6 7.5l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 9.5h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
