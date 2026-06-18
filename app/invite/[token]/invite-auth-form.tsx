'use client'

import { useActionState, useState } from 'react'
import { signUpAndJoinEvent, signInAndJoinEvent } from '@/features/auth/invite-actions'

interface Props {
  inviteToken: string
}

type Mode = 'signup' | 'signin'

export function InviteAuthForm({ inviteToken }: Props) {
  const [mode, setMode] = useState<Mode>('signup')
  const [sharedEmail, setSharedEmail] = useState('')

  const [signUpState, signUpAction, signUpPending] = useActionState(signUpAndJoinEvent, {})
  const [signInState, signInAction, signInPending] = useActionState(signInAndJoinEvent, {})

  const state = mode === 'signup' ? signUpState : signInState
  const pending = mode === 'signup' ? signUpPending : signInPending

  return (
    <div
      className="rounded-[var(--radius-xl)] border overflow-hidden"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
    >
      {/* Mode tabs */}
      <div
        className="grid grid-cols-2 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}
      >
        <TabButton active={mode === 'signup'} onClick={() => setMode('signup')}>
          Créer un compte
        </TabButton>
        <TabButton active={mode === 'signin'} onClick={() => setMode('signin')}>
          Se connecter
        </TabButton>
      </div>

      <div className="p-5">
        {/* Error banner (champ non spécifique) */}
        {state.error && !state.field && (
          <div
            className="mb-4 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm"
            style={{ borderColor: '#fca5a5', background: '#fef2f2', color: '#b91c1c' }}
          >
            {state.error}
          </div>
        )}

        {mode === 'signup' ? (
          <form key="signup" action={signUpAction} className="space-y-3">
            <input type="hidden" name="invite_token" value={inviteToken} />

            <AuthField
              label="Prénom"
              name="first_name"
              type="text"
              placeholder="Alice"
              autoFocus
              error={signUpState.field === 'first_name' ? signUpState.error : undefined}
            />
            <AuthField
              label="Email"
              name="email"
              type="email"
              placeholder="alice@exemple.fr"
              value={sharedEmail}
              onChange={(e) => setSharedEmail(e.target.value)}
              error={signUpState.field === 'email' ? signUpState.error : undefined}
            />
            <AuthField
              label="Mot de passe"
              name="password"
              type="password"
              placeholder="8 caractères minimum"
              error={signUpState.field === 'password' ? signUpState.error : undefined}
            />

            <SubmitButton pending={signUpPending} label="Rejoindre l'événement" pendingLabel="Création…" />
            <p className="text-center text-xs pt-1" style={{ color: 'var(--color-text-faint)' }}>
              Gratuit. Sans carte. Modifiable à tout moment.
            </p>
            <p className="text-center text-xs" style={{ color: 'var(--color-text-faint)' }}>
              La prochaine fois, vos infos seront déjà là.
            </p>
          </form>
        ) : (
          <form key="signin" action={signInAction} className="space-y-3">
            <input type="hidden" name="invite_token" value={inviteToken} />

            <AuthField
              label="Email"
              name="email"
              type="email"
              placeholder="alice@exemple.fr"
              autoFocus
              value={sharedEmail}
              onChange={(e) => setSharedEmail(e.target.value)}
              error={signInState.field === 'email' ? signInState.error : undefined}
            />
            <AuthField
              label="Mot de passe"
              name="password"
              type="password"
              placeholder="••••••••"
              error={signInState.field === 'password' ? signInState.error : undefined}
            />

            <SubmitButton pending={signInPending} label="Se connecter" pendingLabel="Connexion…" />
          </form>
        )}
      </div>
    </div>
  )
}

// ---- Primitives ----

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 text-sm font-medium transition-ui"
      style={{
        color: active ? 'var(--color-text)' : 'var(--color-text-faint)',
        borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
        background: active ? 'var(--color-surface-elevated)' : 'transparent',
      }}
    >
      {children}
    </button>
  )
}

function AuthField({
  label,
  name,
  error,
  ...props
}: {
  label: string
  name: string
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-xs font-medium mb-1.5"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="w-full h-10 rounded-[var(--radius-md)] border px-3 text-sm outline-none transition-ui"
        style={{
          borderColor: error ? '#fca5a5' : 'var(--color-border)',
          background: 'var(--color-surface-elevated)',
          color: 'var(--color-text)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? '#f87171' : 'var(--color-accent)'
          e.target.style.boxShadow = error
            ? '0 0 0 3px #fee2e2'
            : '0 0 0 3px var(--color-accent-muted)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#fca5a5' : 'var(--color-border)'
          e.target.style.boxShadow = 'none'
        }}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean
  label: string
  pendingLabel: string
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-11 text-sm font-medium rounded-[var(--radius-md)] transition-ui disabled:opacity-50"
      style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {pendingLabel}
        </span>
      ) : label}
    </button>
  )
}
