-- ============================================================
-- balu-board: Supabase Schema
-- Run this in the Supabase SQL Editor to initialize the DB.
-- ============================================================

-- Table: boards
-- A single global board (personal use, no auth)
CREATE TABLE IF NOT EXISTS boards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT 'Mi Corcho',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert a single global board row on first run
INSERT INTO boards (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Mi Corcho')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Table: items
-- Each post-it / card living on the board.
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE
               DEFAULT '00000000-0000-0000-0000-000000000001',

  -- Position & size on canvas (pixels)
  pos_x      INTEGER NOT NULL DEFAULT 100,
  pos_y      INTEGER NOT NULL DEFAULT 100,
  width      INTEGER NOT NULL DEFAULT 300,
  height     INTEGER NOT NULL DEFAULT 200,

  -- Visual
  color      TEXT NOT NULL DEFAULT '#fef08a',  -- tailwind yellow-200 equiv
  title      TEXT,

  -- Rich-text content stored as Tiptap JSON
  content    JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index for fast board queries (all items on a board ordered by creation)
CREATE INDEX IF NOT EXISTS items_board_id_idx ON items(board_id, created_at);

-- ============================================================
-- RLS: enabled — solo usuarios autenticados pueden operar
-- Ejecutar esto en Supabase SQL Editor después de habilitar Auth
-- ============================================================
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE items  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_boards" ON boards FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "auth_items" ON items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
