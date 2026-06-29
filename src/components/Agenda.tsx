'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const ACCENT = '#5A9CBF'

type AgendaEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
}

type ApiResponse = {
  events: AgendaEvent[]
  configured: boolean
  error?: string
}

// Etiqueta del día relativa: "Hoy", "Mañana" o "lun 7 jul".
function dayLabel(d: Date): string {
  const today = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((startOf(d) - startOf(today)) / 86_400_000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

function timeLabel(ev: AgendaEvent): string {
  if (ev.allDay) return 'Todo el día'
  return new Date(ev.start).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

// Agrupa eventos por día (key = YYYY-MM-DD local) preservando el orden.
function groupByDay(events: AgendaEvent[]): { label: string; events: AgendaEvent[] }[] {
  const groups: { key: string; label: string; events: AgendaEvent[] }[] = []
  for (const ev of events) {
    const d = new Date(ev.start)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    let g = groups.find(x => x.key === key)
    if (!g) { g = { key, label: dayLabel(d), events: [] }; groups.push(g) }
    g.events.push(ev)
  }
  return groups
}

export default function Agenda() {
  const [open, setOpen]       = useState(false)
  const [events, setEvents]   = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [errored, setErrored] = useState(false)
  const fetched               = useRef(false)

  // Escape cierra el panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const load = async () => {
    setLoading(true)
    setErrored(false)
    try {
      const res = await fetch('/api/calendar')
      const data: ApiResponse = await res.json()
      setEvents(data.events ?? [])
      setConfigured(data.configured)
      if (!res.ok || data.error) setErrored(true)
    } catch {
      setErrored(true)
    } finally {
      setLoading(false)
    }
  }

  // Cargar al abrir por primera vez; refrescar en cada reapertura.
  useEffect(() => {
    if (!open) return
    if (!fetched.current) fetched.current = true
    load()
  }, [open])

  const groups = groupByDay(events)

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
              Agenda
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={load}
                title="Actualizar"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#F0EEE9]/25 hover:text-[#F0EEE9]/65 hover:bg-white/5 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                  style={{ animation: loading ? 'spin 0.8s linear infinite' : undefined }}>
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#F0EEE9]/25 hover:text-[#F0EEE9]/65 hover:bg-white/5 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            {!configured && (
              <p className="font-inter text-[#F0EEE9]/15 text-[11px] text-center leading-relaxed px-2 mt-6">
                Agenda no configurada.<br />
                Agregá <span className="text-[#F0EEE9]/30">GOOGLE_CALENDAR_ICS_URL</span> con la dirección secreta iCal de tu calendario.
              </p>
            )}

            {configured && errored && (
              <p className="font-inter text-[#BF7068]/60 text-[11px] text-center leading-relaxed px-2 mt-6">
                No se pudo leer el calendario.<br />Revisá la URL iCal.
              </p>
            )}

            {configured && !errored && loading && events.length === 0 && (
              <p className="font-inter text-[#F0EEE9]/15 text-[11px] text-center px-2 mt-6">
                Cargando…
              </p>
            )}

            {configured && !errored && !loading && events.length === 0 && (
              <p className="font-inter text-[#F0EEE9]/15 text-[11px] text-center leading-relaxed px-2 mt-6">
                Sin eventos en los próximos 7 días.
              </p>
            )}

            {groups.map(group => (
              <div key={group.label} className="flex flex-col gap-1.5">
                <span className="font-inter text-[10px] tracking-widest uppercase px-1" style={{ color: ACCENT, opacity: 0.7 }}>
                  {group.label}
                </span>
                {group.events.map(ev => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 pl-3 pr-2 py-2 rounded-xl"
                    style={{ borderLeft: `2px solid ${ACCENT}`, background: `${ACCENT}0D` }}
                  >
                    <span className="font-inter text-[#F0EEE9]/45 text-[11px] tabular-nums shrink-0 mt-0.5 w-14">
                      {timeLabel(ev)}
                    </span>
                    <span className="font-inter text-[#F0EEE9]/75 text-sm leading-snug">
                      {ev.title}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* ── Trigger button ──────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Agenda"
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-inter text-sm tracking-wide transition-all hover:scale-105 active:scale-95"
        style={{
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)'}`,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          color: 'rgba(240,238,233,0.6)',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        Agenda
      </button>
    </>
  )
}
