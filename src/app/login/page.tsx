'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al iniciar sesión')
      setLoading(false)
    }
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
        <div className="flex flex-col items-center mb-8">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36" className="mb-4 opacity-60">
            <path d="M245.2 134.289C294.12 73.9855 219.025 82.2174 208.126 76.763C204.296 74.849 200.528 56.3705 192.005 60.6375C178.88 67.2036 179.995 101.383 178.571 112.785C177.798 118.991 169.133 127.877 166.285 134.289C161.739 144.521 156.744 156.692 148.393 169.402C140.043 182.113 122.592 191.967 113.857 201.681C76.682 243.002 92.6204 291.579 133.435 322.992C174.716 354.764 347.131 342.906 298.399 269.769" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M225.903 162.283C238.018 206.627 220.627 252.936 220.627 296.357C220.627 301.354 230.543 296.532 235.401 297.425" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M162.667 208.879C172.419 210.315 181.319 217.474 188.222 224.166C222.582 257.481 178.688 279.87 176.257 291.647C175.708 294.311 187.035 296.145 189.31 296.389" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M211.536 62.994C218.161 56.7795 219.425 67.6568 220.627 73.6378" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="font-playfair text-[#F0EEE9] text-2xl font-semibold tracking-wide opacity-85">
            Balu Board
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
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
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
