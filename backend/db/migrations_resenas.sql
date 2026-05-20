-- Módulo de reseñas sobre tabla existente calificaciones (ejecutar en Supabase)

ALTER TABLE calificaciones
  ADD COLUMN IF NOT EXISTS imagen_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Una reseña por evaluador por trabajo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'calificaciones_trabajo_evaluador_unique'
  ) THEN
    ALTER TABLE calificaciones
      ADD CONSTRAINT calificaciones_trabajo_evaluador_unique
      UNIQUE (trabajo_id, evaluador_id);
  END IF;
END $$;
