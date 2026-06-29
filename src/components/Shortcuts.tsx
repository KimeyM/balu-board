'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Mismos colores elegibles que las cards
const CARD_COLORS = [
  '#C4A644',
  '#6AAF8C',
  '#5A9CBF',
  '#BF7068',
  '#9678BF',
  '#BF7A38',
  '#BF7898',
  '#3AAFA8',
]

const STORAGE_KEY = 'balu-shortcuts'

type Shortcut = {
  id: string
  label: string
  url: string
  color: string
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export default function Shortcuts() {
  const [open, setOpen]           = useState(false)
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [adding, setAdding]       = useState(false)
  const [label, setLabel]         = useState('')
  const [url, setUrl]             = useState('')
  const [color, setColor]         = useState(CARD_COLORS[0])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const loaded                    = useRef(false)

  // Escape cierra el panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Cargar de localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setShortcuts(JSON.parse(raw))
    } catch { /* ignora datos corruptos */ }
    loaded.current = true
  }, [])

  // Persistir cuando cambian
  useEffect(() => {
    if (!loaded.current) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts)) } catch { /* sin espacio */ }
  }, [shortcuts])

  const addShortcut = () => {
    const finalUrl = normalizeUrl(url)
    if (!finalUrl) return
    const finalLabel = label.trim() || finalUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
    setShortcuts(prev => [...prev, { id: crypto.randomUUID(), label: finalLabel, url: finalUrl, color }])
    setLabel('')
    setUrl('')
    setColor(CARD_COLORS[0])
    setAdding(false)
  }

  const removeShortcut = (id: string) =>
    setShortcuts(prev => prev.filter(s => s.id !== id))

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
              Accesos directos
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

          {/* Body — listado */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-1.5">
            {shortcuts.length === 0 && !adding && (
              <p className="font-inter text-[#F0EEE9]/15 text-[11px] text-center leading-relaxed px-2 mt-6">
                Sin accesos todavía.<br />Agregá tus links favoritos.
              </p>
            )}

            {shortcuts.map(s => (
              <div
                key={s.id}
                className="group relative"
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 pl-3 pr-9 py-2.5 rounded-xl transition-all hover:bg-white/5"
                  style={{ borderLeft: `2px solid ${s.color}`, background: `${s.color}0D` }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-playfair text-sm font-semibold shrink-0"
                    style={{ background: `${s.color}22`, border: `1px solid ${s.color}50`, color: s.color }}
                  >
                    {s.label.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-inter text-[#F0EEE9]/70 text-sm truncate">
                    {s.label}
                  </span>
                </a>

                {hoveredId === s.id && (
                  <button
                    onClick={() => removeShortcut(s.id)}
                    title="Eliminar"
                    className="absolute top-1/2 -translate-y-1/2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-[#F0EEE9]/25 hover:text-[#F0EEE9]/70 hover:bg-white/8 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {/* Form de alta */}
            {adding ? (
              <div
                className="flex flex-col gap-2.5 p-3 mt-1 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <input
                  autoFocus
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addShortcut() }}
                  placeholder="Nombre"
                  className="bg-transparent font-inter text-[#F0EEE9]/80 text-sm outline-none placeholder:text-[#F0EEE9]/20 px-2 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                />
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addShortcut() }}
                  placeholder="https://…"
                  className="bg-transparent font-inter text-[#F0EEE9]/80 text-sm outline-none placeholder:text-[#F0EEE9]/20 px-2 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                />

                {/* Selector de color (paleta de las cards) */}
                <div className="flex items-center gap-1.5 flex-wrap px-0.5">
                  {CARD_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="rounded-full transition-transform hover:scale-110"
                      style={{
                        width: 14,
                        height: 14,
                        background: c,
                        outline: color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: 2,
                        opacity: color === c ? 1 : 0.45,
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    onClick={addShortcut}
                    className="flex-1 py-1.5 rounded-lg font-inter text-xs transition-all hover:brightness-110"
                    style={{ background: `${color}22`, border: `1px solid ${color}50`, color }}
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => { setAdding(false); setLabel(''); setUrl('') }}
                    className="px-3 py-1.5 rounded-lg font-inter text-xs text-[#F0EEE9]/35 hover:text-[#F0EEE9]/70 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center justify-center gap-2 py-2.5 mt-1 rounded-xl font-inter text-xs text-[#F0EEE9]/35 hover:text-[#F0EEE9]/70 transition-all hover:bg-white/4"
                style={{ border: '1px dashed rgba(255,255,255,0.12)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Agregar acceso
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── Trigger button ──────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Accesos directos"
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
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        Accesos
      </button>
    </>
  )
}
