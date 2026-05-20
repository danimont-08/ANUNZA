-- ============================================================
-- Migración: Módulo de Moderación
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1. Rol de usuario (usuario | moderador | admin)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'usuario';

-- 2. Suspensión temporal de usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS suspendido_hasta TIMESTAMPTZ;

-- 3. Columnas extra en reportes
ALTER TABLE reportes
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'pendiente';
  -- valores posibles: pendiente | resuelto | descartado

ALTER TABLE reportes
  ADD COLUMN IF NOT EXISTS moderador_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE reportes
  ADD COLUMN IF NOT EXISTS conversacion_id UUID REFERENCES conversaciones(id) ON DELETE SET NULL;

-- publicacion_id pasa a ser opcional (para reportes de chat sin publicación)
ALTER TABLE reportes
  ALTER COLUMN publicacion_id DROP NOT NULL;

-- ============================================================
-- Para asignar rol de moderador a un usuario existente:
--   UPDATE usuarios SET rol = 'moderador' WHERE correo = 'email@ejemplo.com';
-- ============================================================
