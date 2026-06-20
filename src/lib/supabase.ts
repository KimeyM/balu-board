import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Types ──────────────────────────────────────────────────────────────────

export type BoardItem = {
  id: string
  board_id: string
  pos_x: number
  pos_y: number
  width: number
  height: number
  color: string
  title: string | null
  content: object | null   // Tiptap JSON
  created_at: string
  updated_at: string
}
