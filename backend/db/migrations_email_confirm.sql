-- Migración: confirmación de correo electrónico
-- Ejecutar en Supabase SQL Editor

-- DEFAULT true para que usuarios existentes no queden bloqueados
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS correo_confirmado BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS token_confirmacion TEXT,
  ADD COLUMN IF NOT EXISTS token_confirmacion_exp TIMESTAMP;
