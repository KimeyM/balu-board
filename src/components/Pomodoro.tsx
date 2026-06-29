'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const PHASES = {
  work:      { label: 'Trabajo',        duration: 25 * 60, color: '#BF7898' },
  break:     { label: 'Descanso',       duration:  5 * 60, color: '#6AAF8C' },
  longBreak: { label: 'Descanso largo', duration: 15 * 60, color: '#5A9CBF' },
} as const

type Phase = keyof typeof PHASES

const RADIUS = 76
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const STORAGE_KEY = 'balu-pomodoro'

type Persisted = {
  phase: Phase
  cycles: number
  running: boolean
  // Si running: instante (epoch ms) en que la fase llega a cero.
  // Si pausado: segundos restantes congelados.
  targetEpoch: number | null
  seconds: number
}

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 520
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch { /* silencioso si el browser bloquea */ }
}

export default function Pomodoro() {
  const [open, setOpen]       = useState(false)
  const [phase, setPhase]     = useState<Phase>('work')
  const [seconds, setSeconds] = useState(PHASES.work.duration)
  const [running, setRunning] = useState(false)
  const [cycles, setCycles]   = useState(0)
  // Instante (epoch ms) en que la fase actual llega a cero. Solo válido mientras running.
  const targetRef             = useRef<number | null>(null)
  const loaded                = useRef(false)

  // Avanza a la próxima fase de forma plana (sin setState anidados).
  const advancePhase = () => {
    if (phase === 'work') {
      const next = cycles + 1
      setCycles(next)
      const nextPhase: Phase = next % 4 === 0 ? 'longBreak' : 'break'
      setPhase(nextPhase)
      setSeconds(PHASES[nextPhase].duration)
    } else {
      setPhase('work')
      setSeconds(PHASES.work.duration)
    }
  }

  // Restaurar de localStorage al montar.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const p = JSON.parse(raw) as Persisted
        setPhase(p.phase)
        setCycles(p.cycles)
        if (p.running && p.targetEpoch) {
          // Recalcular cuánto queda según el reloj real.
          const remaining = Math.round((p.targetEpoch - Date.now()) / 1000)
          if (remaining > 0) {
            targetRef.current = p.targetEpoch
            setSeconds(remaining)
            setRunning(true)
          } else {
            // La fase ya terminó mientras estaba cerrado: dejar en cero, pausado.
            setSeconds(0)
          }
        } else {
          setSeconds(p.seconds)
        }
      }
    } catch { /* ignora datos corruptos */ }
    loaded.current = true
  }, [])

  // Persistir en cada cambio relevante.
  useEffect(() => {
    if (!loaded.current) return
    const payload: Persisted = {
      phase, cycles, running, seconds,
      targetEpoch: running ? targetRef.current : null,
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)) } catch { /* sin espacio */ }
  }, [phase, cycles, running, seconds])

  // Escape key closes panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Tick: el valor real se deriva del reloj, así que volver de una pestaña en
  // segundo plano muestra el tiempo correcto sin drift.
  useEffect(() => {
    if (!running) return
    if (targetRef.current == null) targetRef.current = Date.now() + seconds * 1000
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((targetRef.current! - Date.now()) / 1000))
      setSeconds(remaining)
      if (remaining <= 0) {
        clearInterval(id)
        targetRef.current = null
        beep()
        setRunning(false)
        advancePhase()
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const toggle = () => {
    setRunning(r => {
      const next = !r
      if (next) targetRef.current = Date.now() + seconds * 1000
      else targetRef.current = null   // pausar: congelar segundos actuales
      return next
    })
  }

  const reset = () => {
    setRunning(false)
    targetRef.current = null
    setSeconds(PHASES[phase].duration)
  }

  const totalDuration = PHASES[phase].duration
  const dashOffset    = (seconds / totalDuration) * CIRCUMFERENCE
  const accent        = PHASES[phase].color
  const min           = String(Math.floor(seconds / 60)).padStart(2, '0')
  const sec           = String(seconds % 60).padStart(2, '0')

  return (
    <>
      {/* ── Side panel — portal para escapar del transform del padre ── */}
      {open && createPortal(
        <div
          className="panel-slide-in fixed right-0 top-0 h-full z-50 flex flex-col"
          style={{
            width: 288,
            background: 'rgba(10,10,10,0.94)',
            backdropFilter: 'blur(24px)',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '-12px 0 60px rgba(0,0,0,0.55)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="font-inter text-[#F0EEE9]/45 text-[11px] tracking-widest uppercase">
              Pomodoro
            </span>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#F0EEE9]/25 hover:text-[#F0EEE9]/65 hover:bg-white/5 transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col items-center justify-center gap-7 px-6">

            {/* Phase label */}
            <span
              className="font-inter text-[11px] tracking-widest uppercase font-medium"
              style={{ color: accent, opacity: 0.85 }}
            >
              {PHASES[phase].label}
            </span>

            {/* Progress ring + countdown */}
            <div className="relative flex items-center justify-center">
              <svg width="192" height="192" viewBox="0 0 192 192">
                {/* Track */}
                <circle
                  cx="96" cy="96" r={RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="2.5"
                />
                {/* Progress */}
                <circle
                  cx="96" cy="96" r={RADIUS}
                  fill="none"
                  stroke={accent}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                    transition: running ? 'stroke-dashoffset 0.9s linear, stroke 0.6s ease' : 'stroke 0.6s ease',
                    opacity: 0.75,
                    filter: `drop-shadow(0 0 6px ${accent}60)`,
                  }}
                />
              </svg>
              <span
                className="absolute font-playfair text-[2.6rem] font-semibold tabular-nums"
                style={{ color: accent, letterSpacing: '0.02em' }}
              >
                {min}:{sec}
              </span>
            </div>

            {/* Cycle dots */}
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map(i => {
                const filled = i < cycles % 4
                return (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: filled ? 8 : 6,
                      height: filled ? 8 : 6,
                      background: filled ? accent : 'rgba(255,255,255,0.12)',
                    }}
                  />
                )
              })}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Play / Pause */}
              <button
                onClick={toggle}
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `${accent}20`,
                  border: `1px solid ${accent}50`,
                  color: accent,
                  boxShadow: running ? `0 0 20px ${accent}30` : 'none',
                }}
              >
                {running ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="5" y="4" width="4" height="16" rx="1"/>
                    <rect x="15" y="4" width="4" height="16" rx="1"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6,3 20,12 6,21"/>
                  </svg>
                )}
              </button>

              {/* Reset */}
              <button
                onClick={reset}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(240,238,233,0.3)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
              </button>
            </div>

            {/* Cycle count */}
            <p className="font-inter text-[#F0EEE9]/20 text-xs">
              {cycles} {cycles === 1 ? 'pomodoro' : 'pomodoros'} completados
            </p>

            <p className="font-inter text-[#F0EEE9]/15 text-[10px] text-center leading-relaxed px-2">
              Los sets se activan manualmente.
            </p>

          </div>
        </div>,
        document.body
      )}

      {/* ── Trigger button ──────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Pomodoro"
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-inter text-sm tracking-wide transition-all hover:scale-105 active:scale-95"
        style={{
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)'}`,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          color: running ? accent : 'rgba(240,238,233,0.6)',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <polyline points="12 7 12 12 15 15"/>
        </svg>
        {running ? `${min}:${sec}` : 'Pomodoro'}
      </button>
    </>
  )
}
