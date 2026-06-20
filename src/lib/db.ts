import { supabase } from './supabase'

const BOARD_ID = '00000000-0000-0000-0000-000000000001'

export type DbItemPatch = {
  pos_x?: number
  pos_y?: number
  width?: number
  height?: number
  color?: string
  title?: string | null
  content?: object | null
}

export async function fetchItems() {
  const { data, error } = await supabase
    .from('items')
    .select('id, pos_x, pos_y, width, height, color, title, content')
    .eq('board_id', BOARD_ID)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function insertItem(item: {
  id: string
  pos_x: number
  pos_y: number
  width: number
  height: number
  color: string
  title: string
  content: object | null
}) {
  const { error } = await supabase.from('items').insert({
    id:       item.id,
    board_id: BOARD_ID,
    pos_x:    Math.round(item.pos_x),
    pos_y:    Math.round(item.pos_y),
    width:    Math.round(item.width),
    height:   Math.round(item.height),
    color:    item.color,
    title:    item.title,
    content:  item.content,
  })
  if (error) console.error('[db] insertItem:', error.message)
}

export async function patchItem(id: string, patch: DbItemPatch) {
  const sanitized: DbItemPatch = { ...patch }
  if (sanitized.pos_x  != null) sanitized.pos_x  = Math.round(sanitized.pos_x)
  if (sanitized.pos_y  != null) sanitized.pos_y  = Math.round(sanitized.pos_y)
  if (sanitized.width  != null) sanitized.width  = Math.round(sanitized.width)
  if (sanitized.height != null) sanitized.height = Math.round(sanitized.height)
  const { error } = await supabase.from('items').update(sanitized).eq('id', id)
  if (error) console.error('[db] patchItem:', error.message)
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) console.error('[db] deleteItem:', error.message)
}

// Sube a Supabase Storage (bucket "board-images" público).
// Si falla, devuelve null y el caller usa fallback base64.
export async function uploadImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('board-images')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) return null

  const { data } = supabase.storage.from('board-images').getPublicUrl(path)
  return data.publicUrl
}
