'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUnauthorized(params.get('error') === 'unauthorized')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div
      className="h-screen w-screen flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 100% 80% at 50% 0%, #161616 0%, #0A0A0A 65%)',
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          padding: '48px',
          width: '360px',
        }}
      >
        <h1 className="font-playfair text-[#F0EEE9] text-2xl font-semibold mb-1.5 text-center tracking-wide">
          Balu Board
        </h1>
        <p className="font-inter text-[#F0EEE9]/30 text-xs text-center mb-8 tracking-widest uppercase">
          Espacio personal
        </p>

        {unauthorized && !sent && (
          <div
            className="mb-5 px-3 py-2.5 rounded-xl text-xs font-inter text-center"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.18)',
              color: 'rgba(252,165,165,0.9)',
            }}
          >
            Este email no tiene acceso al board.
          </div>
        )}

        {sent ? (
          <div className="text-center py-2">
            <div
              className="mb-4 mx-auto w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F0EEE9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="font-inter text-[#F0EEE9]/60 text-sm leading-relaxed">
              Revisá tu bandeja de entrada.
            </p>
            <p className="font-inter text-[#F0EEE9]/25 text-xs mt-2">
              El enlace expira en 1 hora.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl font-inter text-sm text-[#F0EEE9] placeholder:text-[#F0EEE9]/20 outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            {error && (
              <p className="text-xs font-inter" style={{ color: 'rgba(252,165,165,0.9)' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-inter text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.11)',
                color: 'rgba(240,238,233,0.65)',
              }}
            >
              {loading ? 'Enviando…' : 'Enviar enlace mágico'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
