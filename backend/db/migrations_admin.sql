-- Migración módulo admin (ejecutar en Supabase si aún no aplicaste los cambios)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'usuario',
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'activo';

CREATE TABLE IF NOT EXISTS reportes (
  id SERIAL PRIMARY KEY,
  publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  motivo VARCHAR(30) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Primer admin: UPDATE usuarios SET rol = 'admin' WHERE correo = 'tu@correo.com';
