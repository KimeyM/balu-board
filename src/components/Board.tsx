'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Rnd } from 'react-rnd'
import BoardItem from './BoardItem'
import AddItemButton from './AddItemButton'
import ItemModal from './ItemModal'
import { fetchItems, insertItem, deleteItem, patchItem } from '@/lib/db'

export type LocalItem = {
  id: string
  pos_x: number
  pos_y: number
  width: number
  height: number
  color: string
  title: string
  content: object | null
  zIndex: number
}

const COLORS = ['#C4A644', '#6AAF8C', '#5A9CBF', '#BF7068', '#9678BF', '#BF7A38']

export default function Board() {
  const [items, setItems] = useState<LocalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const zCounter = useRef(1)

  const activeItem = items.find(i => i.id === activeItemId) ?? null

  // ── Load from DB on mount ────────────────────────────────
  useEffect(() => {
    fetchItems()
      .then(rows => {
        const mapped: LocalItem[] = rows.map((row, i) => ({
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
        zCounter.current = rows.length + 1
        setItems(mapped)
      })
      .catch(err => console.error('[Board] fetchItems:', err))
      .finally(() => setLoading(false))
  }, [])

  // ── Local state helpers ──────────────────────────────────
  const updateItem = useCallback((id: string, patch: Partial<LocalItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))
  }, [])

  const bringToFront = useCallback((id: string) => {
    zCounter.current += 1
    const z = zCounter.current
    setItems(prev => prev.map(item => item.id === id ? { ...item, zIndex: z } : item))
  }, [])

  // ── CRUD ─────────────────────────────────────────────────
  const addItem = useCallback((color?: string) => {
    zCounter.current += 1
    const newItem: LocalItem = {
      id: crypto.randomUUID(),
      pos_x: 80 + Math.random() * 400,
      pos_y: 80 + Math.random() * 300,
      width: 280,
      height: 200,
      color: color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
      title: 'Nuevo post-it',
      content: null,
      zIndex: zCounter.current,
    }
    setItems(prev => [...prev, newItem])
    insertItem(newItem)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
    deleteItem(id)
  }, [])

  // ── Drag / resize → persist position & size ──────────────
  const handleDragStop = useCallback((id: string, x: number, y: number) => {
    updateItem(id, { pos_x: x, pos_y: y })
    patchItem(id, { pos_x: x, pos_y: y })
  }, [updateItem])

  const handleResizeStop = useCallback((
    id: string,
    width: number,
    height: number,
    x: number,
    y: number,
  ) => {
    updateItem(id, { width, height, pos_x: x, pos_y: y })
    patchItem(id, { width, height, pos_x: x, pos_y: y })
  }, [updateItem])

  // ── Modal ─────────────────────────────────────────────────
  const openDetail  = useCallback((id: string) => setActiveItemId(id), [])
  const closeDetail = useCallback(() => setActiveItemId(null), [])

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse 100% 70% at 50% 0%, #161616 0%, #0A0A0A 65%)',
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-zinc-600 text-sm animate-pulse">Cargando board…</span>
        </div>
      )}

      {items.map(item => (
        <Rnd
          key={item.id}
          position={{ x: item.pos_x, y: item.pos_y }}
          size={{ width: item.width, height: item.height }}
          onMouseDown={() => bringToFront(item.id)}
          onDragStart={() => setDraggingId(item.id)}
          onDragStop={(_, d) => { setDraggingId(null); handleDragStop(item.id, d.x, d.y) }}
          onResizeStop={(_, __, ref, ___, pos) =>
            handleResizeStop(item.id, ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)
          }
          bounds="parent"
          minWidth={180}
          minHeight={120}
          dragHandleClassName="drag-handle"
          style={{ zIndex: item.zIndex }}
        >
          <BoardItem
            item={item}
            onRemove={removeItem}
            onOpenDetail={openDetail}
            isDragging={draggingId === item.id}
          />
        </Rnd>
      ))}

      <AddItemButton onAdd={addItem} />

      {activeItem && (
        <ItemModal
          item={activeItem}
          onClose={closeDetail}
          onUpdate={updateItem}
        />
      )}
    </div>
  )
}
