'use client'

import { useState } from 'react'
import { type LocalItem } from './Board'

type Props = {
  item: LocalItem
  onRemove: (id: string) => void
  onOpenDetail: (id: string) => void
  isDragging?: boolean
}

type TNode = {
  type: string
  text?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attrs?: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marks?: { type: string; attrs?: Record<string, any> }[]
  content?: TNode[]
}

// ── Estilo a partir de los marks de Tiptap ───────────────────
function markStyle(marks?: TNode['marks']): React.CSSProperties {
  const style: React.CSSProperties = {}
  const deco: string[] = []

  for (const m of marks ?? []) {
    switch (m.type) {
      case 'bold':      style.fontWeight = 700; break
      case 'italic':    style.fontStyle = 'italic'; break
      case 'underline': deco.push('underline'); break
      case 'strike':    deco.push('line-through'); break
      case 'textStyle':
        if (m.attrs?.color) style.color = m.attrs.color
        if (m.attrs?.fontSize) style.fontSize = m.attrs.fontSize
        break
      case 'highlight':
        style.backgroundColor = m.attrs?.color ?? 'rgba(234,179,8,0.4)'
        style.color = '#0A0A0A'
        style.borderRadius = '2px'
        style.padding = '0 2px'
        break
      case 'code':
        style.fontFamily = 'monospace'
        style.fontSize = '0.85em'
        style.background = 'rgba(255,255,255,0.08)'
        style.padding = '1px 4px'
        style.borderRadius = '3px'
        break
      case 'link':
        style.color = '#7CB7D9'
        deco.push('underline')
        break
    }
  }
  if (deco.length) style.textDecoration = deco.join(' ')
  return style
}

// ── Render inline (text / saltos) ────────────────────────────
function renderInline(nodes: TNode[] | undefined, keyPrefix: string): React.ReactNode[] {
  if (!nodes) return []
  return nodes.flatMap((n, i) => {
    const key = `${keyPrefix}-${i}`
    if (n.type === 'text') {
      return [<span key={key} className="whitespace-pre-wrap" style={markStyle(n.marks)}>{n.text}</span>]
    }
    if (n.type === 'hardBreak') return [<br key={key} />]
    return []
  })
}

// ── Render de bloques (fiel a la estructura del documento) ────
function renderBlocks(nodes: TNode[] | undefined, keyPrefix: string): React.ReactNode[] {
  if (!nodes) return []

  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`

    switch (node.type) {
      case 'paragraph': {
        const inline = renderInline(node.content, key)
        if (inline.length === 0) return null
        return <p key={key} className="mb-1 last:mb-0 leading-snug">{inline}</p>
      }
      case 'heading': {
        const level = (node.attrs?.level ?? 1) as number
        const cls = level <= 1
          ? 'text-base font-bold'
          : level === 2 ? 'text-[15px] font-bold' : 'text-sm font-semibold'
        return <p key={key} className={`mb-1 last:mb-0 leading-snug ${cls}`}>{renderInline(node.content, key)}</p>
      }
      case 'bulletList':
        return <ul key={key} className="svg-bullet mb-1 last:mb-0">{renderBlocks(node.content, key)}</ul>
      case 'orderedList':
        return <ol key={key} className="list-decimal pl-4 mb-1 last:mb-0">{renderBlocks(node.content, key)}</ol>
      case 'listItem':
        return <li key={key} className="leading-snug">{renderBlocks(node.content, key)}</li>
      case 'taskList':
        return <ul key={key} className="mb-1 last:mb-0">{renderBlocks(node.content, key)}</ul>
      case 'taskItem':
        return (
          <li key={key} className="flex gap-1.5 leading-snug">
            <span className="shrink-0">{node.attrs?.checked ? '☑' : '☐'}</span>
            <div className={`min-w-0 ${node.attrs?.checked ? 'line-through opacity-60' : ''}`}>
              {renderBlocks(node.content, key)}
            </div>
          </li>
        )
      case 'blockquote':
        return (
          <blockquote key={key} className="border-l-2 border-white/20 pl-2 italic mb-1 last:mb-0">
            {renderBlocks(node.content, key)}
          </blockquote>
        )
      case 'codeBlock':
        return (
          <pre key={key} className="font-mono text-[0.8em] bg-white/8 rounded p-1.5 mb-1 last:mb-0 whitespace-pre-wrap wrap-break-word">
            {renderInline(node.content, key)}
          </pre>
        )
      case 'horizontalRule':
        return <hr key={key} className="border-white/15 my-1.5" />
      case 'image':
        return null // se muestra como portada
      default:
        return node.content ? <div key={key}>{renderBlocks(node.content, key)}</div> : null
    }
  })
}

function findFirstImage(node: TNode): string | null {
  if (node.type === 'image') return node.attrs?.src ?? null
  for (const child of node.content ?? []) {
    const img = findFirstImage(child)
    if (img) return img
  }
  return null
}

function hasText(node: TNode): boolean {
  if (node.type === 'text') return (node.text ?? '').trim().length > 0
  return (node.content ?? []).some(hasText)
}

function parseContent(content: object | null): {
  blocks: React.ReactNode[]
  firstImage: string | null
  hasText: boolean
} {
  if (!content) return { blocks: [], firstImage: null, hasText: false }

  const doc = content as TNode
  const nodes = doc.content ?? []
  let firstImage: string | null = null
  for (const node of nodes) {
    const img = findFirstImage(node)
    if (img) { firstImage = img; break }
  }

  return {
    blocks: renderBlocks(nodes, 'b'),
    firstImage,
    hasText: nodes.some(hasText),
  }
}

export default function BoardItem({ item, onRemove, onOpenDetail, isDragging = false }: Props) {
  const [hovered, setHovered] = useState(false)
  const { blocks, firstImage, hasText } = parseContent(item.content)

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
                <div className="font-playfair text-[#F0EEE9]/55 text-sm leading-relaxed">
                  {blocks}
                </div>
              </div>
            )}
          </div>
        ) : hasText ? (
          <div className="h-full overflow-hidden px-4 pb-4">
            <div className="font-playfair text-[#F0EEE9]/55 text-sm leading-relaxed">
              {blocks}
            </div>
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
