-- Migración: likes y respuestas en comentarios
-- Ejecutar en Supabase → SQL Editor

-- 1. Replies en comentarios (parent_id) — id de comentarios es INTEGER
ALTER TABLE comentarios
  ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comentarios(id) ON DELETE CASCADE;

-- 2. Tabla de likes por comentario
CREATE TABLE IF NOT EXISTS comentario_likes (
  id            SERIAL PRIMARY KEY,
  comentario_id INTEGER NOT NULL REFERENCES comentarios(id) ON DELETE CASCADE,
  usuario_id    UUID    NOT NULL REFERENCES usuarios(id)    ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comentario_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_comentario_likes_comentario ON comentario_likes(comentario_id);
