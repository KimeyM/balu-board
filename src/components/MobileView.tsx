'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchItems } from '@/lib/db'
import { type LocalItem } from './Board'
import ItemModal from './ItemModal'

type Segment = { text: string; color?: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walkNode(node: any, segments: Segment[]): string | null {
  if (node.type === 'image') return node.attrs?.src ?? null
  if (node.type === 'text') {
    const color = node.marks
      ?.find((m: { type: string; attrs?: { color?: string } }) => m.type === 'textStyle')
      ?.attrs?.color as string | undefined
    segments.push({ text: node.text ?? '', color })
    return null
  }
  if (!node.content) return null
  const isBlock = ['paragraph', 'heading', 'listItem', 'taskItem', 'blockquote'].includes(node.type)
  let firstImage: string | null = null
  for (const child of node.content) {
    const img = walkNode(child, segments)
    if (!firstImage && img) firstImage = img
  }
  if (isBlock) segments.push({ text: '\n' })
  return firstImage
}

function parseContent(content: object | null): { segments: Segment[]; firstImage: string | null } {
  if (!content) return { segments: [], firstImage: null }
  const doc = content as { content?: object[] }
  const segments: Segment[] = []
  let firstImage: string | null = null
  for (const node of doc.content ?? []) {
    const img = walkNode(node, segments)
    if (!firstImage && img) firstImage = img
  }
  while (segments.length > 0 && segments[segments.length - 1].text === '\n') segments.pop()
  return { segments, firstImage }
}

function renderSegments(segments: Segment[]) {
  return segments.map((seg, i) => {
    if (seg.text === '\n') return <br key={i} />
    return seg.color
      ? <span key={i} style={{ color: seg.color }}>{seg.text}</span>
      : <span key={i}>{seg.text}</span>
  })
}

export default function MobileView() {
  const [items, setItems] = useState<LocalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)

  const activeItem = items.find(i => i.id === activeItemId) ?? null

  useEffect(() => {
    fetchItems()
      .then(rows => {
        const mapped: LocalItem[] = [...rows]
          .sort((a, b) => a.pos_y !== b.pos_y ? a.pos_y - b.pos_y : a.pos_x - b.pos_x)
          .map((row, i) => ({
            id: row.id,
            pos_x: row.pos_x,
            pos_y: row.pos_y,
            width: row.width,
            height: row.height,
            color: row.color,
            title: row.title ?? 'Sin título',
            content: row.content,
            zIndex: i + 1,
          }))
        setItems(mapped)
      })
      .finally(() => setLoading(false))
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<LocalItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))
  }, [])

  return (
    <div
      className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse 100% 50% at 50% 0%, #161616 0%, #0A0A0A 60%)' }}
    >
      {/* Header sticky */}
      <header
        className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
        style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22" className="opacity-60">
            <path d="M245.2 134.289C294.12 73.9855 219.025 82.2174 208.126 76.763C204.296 74.849 200.528 56.3705 192.005 60.6375C178.88 67.2036 179.995 101.383 178.571 112.785C177.798 118.991 169.133 127.877 166.285 134.289C161.739 144.521 156.744 156.692 148.393 169.402C140.043 182.113 122.592 191.967 113.857 201.681C76.682 243.002 92.6204 291.579 133.435 322.992C174.716 354.764 347.131 342.906 298.399 269.769" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M225.903 162.283C238.018 206.627 220.627 252.936 220.627 296.357C220.627 301.354 230.543 296.532 235.401 297.425" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M162.667 208.879C172.419 210.315 181.319 217.474 188.222 224.166C222.582 257.481 178.688 279.87 176.257 291.647C175.708 294.311 187.035 296.145 189.31 296.389" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M211.536 62.994C218.161 56.7795 219.425 67.6568 220.627 73.6378" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-playfair text-[#F0EEE9] text-base font-semibold opacity-75 tracking-wide">
            Balu Board
          </span>
        </div>
        <a
          href="/api/auth/logout"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#F0EEE9]/25 hover:text-[#F0EEE9]/65 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </a>
      </header>

      {/* Lista */}
      <div className="px-4 py-4 flex flex-col gap-3 pb-10">
        {loading && (
          <p className="text-center text-[#F0EEE9]/25 text-sm font-inter animate-pulse mt-12">
            Cargando…
          </p>
        )}

        {!loading && items.length === 0 && (
          <p className="text-center text-[#F0EEE9]/20 text-sm font-inter mt-12">
            No hay notas todavía.
          </p>
        )}

        {items.map(item => {
          const { segments, firstImage } = parseContent(item.content)
          const hasText = segments.some(s => s.text.trim().length > 0)
          const isEmpty = !hasText && !firstImage

          return (
            <button
              key={item.id}
              className="text-left w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${item.color}40`,
              }}
              onClick={() => setActiveItemId(item.id)}
            >
              {/* Franja */}
              <div style={{ height: 3, background: item.color, opacity: 0.8, boxShadow: `0 0 8px ${item.color}60` }} />

              <div className="px-4 py-3">
                <h2 className="font-playfair font-semibold text-base mb-2 text-left" style={{ color: item.color }}>
                  {item.title}
                </h2>

                {firstImage && (
                  <img
                    src={firstImage}
                    alt=""
                    className="w-full rounded-xl object-cover mb-3"
                    style={{ maxHeight: 200 }}
                  />
                )}

                {hasText && (
                  <p className="font-playfair text-[#F0EEE9]/50 text-sm leading-relaxed line-clamp-5 text-left">
                    {renderSegments(segments)}
                  </p>
                )}

                {isEmpty && (
                  <p className="font-inter text-[#F0EEE9]/20 text-xs italic">Tocar para editar…</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Modal editor */}
      {activeItem && (
        <ItemModal
          item={activeItem}
          onClose={() => setActiveItemId(null)}
          onUpdate={updateItem}
        />
      )}
    </div>
  )
}
