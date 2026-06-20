'use client'

import { useEffect, useRef, useState } from 'react'
import { type LocalItem } from './Board'
import TiptapEditor from './TiptapEditor'
import { patchItem } from '@/lib/db'

type Props = {
  item: LocalItem
  onClose: () => void
  onUpdate: (id: string, patch: Partial<LocalItem>) => void
}

const COLORS = [
  '#C4A644',
  '#6AAF8C',
  '#5A9CBF',
  '#BF7068',
  '#9678BF',
  '#BF7A38',
  '#BF7898',
  '#3AAFA8',
]

export default function ItemModal({ item, onClose, onUpdate }: Props) {
  const [title, setTitle] = useState(item.title)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setTitle(item.title) }, [item.id, item.title])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => { titleRef.current?.focus() }, [item.id])

  useEffect(() => {
    return () => { if (contentSaveTimer.current) clearTimeout(contentSaveTimer.current) }
  }, [])

  const saveTitle = () => {
    const trimmed = title.trim() || 'Sin título'
    setTitle(trimmed)
    onUpdate(item.id, { title: trimmed })
    patchItem(item.id, { title: trimmed })
  }

  const changeColor = (color: string) => {
    onUpdate(item.id, { color })
    patchItem(item.id, { color })
  }

  const handleContentChange = (json: object) => {
    onUpdate(item.id, { content: json })
    if (contentSaveTimer.current) clearTimeout(contentSaveTimer.current)
    contentSaveTimer.current = setTimeout(() => {
      patchItem(item.id, { content: json })
    }, 800)
  }

  return (
    <div
      className="overlay-appear fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="modal-appear flex flex-col overflow-hidden w-full lg:w-[680px] rounded-t-[20px] lg:rounded-[18px]"
        style={{
          height: 'min(90dvh, 100%)',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ['--lg-height' as any]: '540px',
          background: 'rgba(14,14,14,0.96)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderTop: `1px solid rgba(255,255,255,0.13)`,
          boxShadow: `0 32px 100px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${item.color}20`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Pill handle — solo visible en mobile */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Franja de color */}
        <div style={{ height: 3, background: item.color, opacity: 0.8, flexShrink: 0, boxShadow: `0 0 10px ${item.color}60` }} />

        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 lg:px-6 py-3 lg:py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') { saveTitle(); e.currentTarget.blur() } }}
            className="flex-1 bg-transparent font-playfair font-semibold text-lg outline-none placeholder:text-[#F0EEE9]/20 min-w-0"
            style={{ color: item.color }}
            placeholder="Título de la nota"
          />

          {/* Color swatches */}
          <div className="flex items-center gap-1.5 shrink-0">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => changeColor(c)}
                className="rounded-full transition-transform hover:scale-110 active:scale-110"
                style={{
                  width: 13,
                  height: 13,
                  background: c,
                  outline: item.color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 2,
                  opacity: item.color === c ? 1 : 0.45,
                }}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#F0EEE9]/25 hover:text-[#F0EEE9]/65 transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-3 lg:p-4 min-h-0 flex flex-col overflow-hidden">
          <TiptapEditor
            key={item.id}
            itemId={item.id}
            initialContent={item.content}
            onChange={handleContentChange}
          />
        </div>
      </div>
    </div>
  )
}
