-- Agregar foto de portada a usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_portada TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_portada_pos TEXT DEFAULT '50% 50%';
