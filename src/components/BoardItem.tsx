'use client'

import { useState } from 'react'
import { type LocalItem } from './Board'

type Props = {
  item: LocalItem
  onRemove: (id: string) => void
  onOpenDetail: (id: string) => void
  isDragging?: boolean
}

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

function renderSegments(segments: Segment[]) {
  return segments.map((seg, i) => {
    if (seg.text === '\n') return <br key={i} />
    return seg.color
      ? <span key={i} style={{ color: seg.color }}>{seg.text}</span>
      : <span key={i}>{seg.text}</span>
  })
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

  while (segments.length > 0 && segments[segments.length - 1].text === '\n') {
    segments.pop()
  }

  return { segments, firstImage }
}

export default function BoardItem({ item, onRemove, onOpenDetail, isDragging = false }: Props) {
  const [hovered, setHovered] = useState(false)
  const { segments, firstImage } = parseContent(item.content)
  const hasText = segments.some(s => s.text.trim().length > 0)

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden rounded-2xl"
      style={{
        background: isDragging ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: isDragging
          ? `0 8px 16px rgba(0,0,0,0.55), 0 28px 72px rgba(0,0,0,0.55), 0 0 0 1px ${item.color}80, 0 0 48px ${item.color}28`
          : `0 2px 4px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5), 0 20px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${item.color}45`,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease, background 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Franja de color */}
      <div style={{ height: 3, background: item.color, opacity: 0.8, flexShrink: 0, boxShadow: `0 0 8px ${item.color}60` }} />

      {/* Header — drag handle */}
      <div className="drag-handle px-4 pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing relative">
        <h3 className="font-playfair font-semibold text-sm leading-snug pr-10 truncate" style={{ color: item.color }}>
          {item.title}
        </h3>

        {hovered && (
          <div
            className="absolute top-2 right-2 flex items-center gap-0.5"
            onMouseDown={e => e.stopPropagation()}
          >
            <button
              onClick={() => onOpenDetail(item.id)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[#F0EEE9]/25 hover:text-[#F0EEE9]/70 hover:bg-white/6 transition-colors"
              title="Abrir"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
            <button
              onClick={() => onRemove(item.id)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[#F0EEE9]/25 hover:text-[#F0EEE9]/70 hover:bg-white/6 transition-colors"
              title="Eliminar"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Cuerpo */}
      <div
        className="flex-1 min-h-0 overflow-hidden cursor-pointer relative"
        onDoubleClick={() => onOpenDetail(item.id)}
      >
        {firstImage ? (
          <div className="flex flex-col h-full min-h-0">
            <div className="overflow-hidden shrink-0" style={{ flex: hasText ? '0 0 58%' : '1 1 auto' }}>
              <img
                src={firstImage}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            {hasText && (
              <div className="flex-1 min-h-0 overflow-hidden px-4 py-2">
                <p className="font-playfair text-[#F0EEE9]/45 text-sm leading-relaxed line-clamp-3">
                  {renderSegments(segments)}
                </p>
              </div>
            )}
          </div>
        ) : hasText ? (
          <div className="px-4 pb-4 overflow-hidden" style={{ maxHeight: '100%' }}>
            <p className="font-playfair text-[#F0EEE9]/45 text-sm leading-relaxed line-clamp-6">
              {renderSegments(segments)}
            </p>
          </div>
        ) : (
          <div className="px-4 pb-4">
            <p className="font-inter text-[#F0EEE9]/15 text-xs italic">Doble clic para editar…</p>
          </div>
        )}
      </div>
    </div>
  )
}
