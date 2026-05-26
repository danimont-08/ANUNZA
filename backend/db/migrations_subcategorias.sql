-- Migración: tabla subcategorias y columna en publicaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla de subcategorías
CREATE TABLE IF NOT EXISTS subcategorias (
  id   SERIAL PRIMARY KEY,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nombre       VARCHAR(100) NOT NULL
);

-- 2. Columna en publicaciones (por si no existe aún)
ALTER TABLE publicaciones
  ADD COLUMN IF NOT EXISTS subcategoria_id INTEGER REFERENCES subcategorias(id) ON DELETE SET NULL;

-- 3. Índice para filtros por subcategoría
CREATE INDEX IF NOT EXISTS idx_publicaciones_subcategoria ON publicaciones(subcategoria_id);

-- ================================================================
-- 4. Subcategorías de ejemplo — ajusta los nombres de categoría
--    según cómo aparecen en TU tabla categorias.
--    Ejecuta: SELECT id, nombre FROM categorias; para verlas.
-- ================================================================

INSERT INTO subcategorias (categoria_id, nombre)
SELECT c.id, s.nombre
FROM categorias c
JOIN (VALUES
  -- Manualidades (id 1)
  ('Manualidades', 'Crochet y tejido'),
  ('Manualidades', 'Bisutería'),
  ('Manualidades', 'Pintura artística'),
  ('Manualidades', 'Cerámica y arcilla'),
  ('Manualidades', 'Bordado y costura'),
  -- Tecnología (id 2)
  ('Tecnología', 'Desarrollo web'),
  ('Tecnología', 'Diseño UX/UI'),
  ('Tecnología', 'Soporte técnico'),
  ('Tecnología', 'Redes y WiFi'),
  ('Tecnología', 'Edición de video'),
  -- Hogar (id 3)
  ('Hogar', 'Plomería'),
  ('Hogar', 'Electricidad'),
  ('Hogar', 'Pintura'),
  ('Hogar', 'Mudanzas'),
  ('Hogar', 'Limpieza'),
  -- Belleza (id 4)
  ('Belleza', 'Peluquería'),
  ('Belleza', 'Maquillaje'),
  ('Belleza', 'Manicure y pedicure'),
  ('Belleza', 'Depilación'),
  -- Belleza y Cuidado Personal (id 6)
  ('Belleza y Cuidado Personal', 'Peluquería'),
  ('Belleza y Cuidado Personal', 'Maquillaje'),
  ('Belleza y Cuidado Personal', 'Manicure y pedicure'),
  ('Belleza y Cuidado Personal', 'Depilación'),
  ('Belleza y Cuidado Personal', 'Spa y relajación'),
  -- Educación (id 8)
  ('Educación', 'Clases de matemáticas'),
  ('Educación', 'Clases de idiomas'),
  ('Educación', 'Música e instrumentos'),
  ('Educación', 'Refuerzo escolar'),
  ('Educación', 'Arte y creatividad'),
  -- Transporte y Domicilios (id 9)
  ('Transporte y Domicilios', 'Domicilios'),
  ('Transporte y Domicilios', 'Mensajería'),
  ('Transporte y Domicilios', 'Transporte de personas'),
  ('Transporte y Domicilios', 'Mudanzas'),
  -- Mascotas (id 10)
  ('Mascotas', 'Peluquería canina'),
  ('Mascotas', 'Veterinaria a domicilio'),
  ('Mascotas', 'Paseo de mascotas'),
  ('Mascotas', 'Adiestramiento'),
  -- Construcción y Reparaciones (id 11)
  ('Construcción y Reparaciones', 'Plomería'),
  ('Construcción y Reparaciones', 'Electricidad'),
  ('Construcción y Reparaciones', 'Pintura'),
  ('Construcción y Reparaciones', 'Carpintería'),
  ('Construcción y Reparaciones', 'Remodelación'),
  -- Salud y Bienestar (id 12)
  ('Salud y Bienestar', 'Masajes'),
  ('Salud y Bienestar', 'Nutrición'),
  ('Salud y Bienestar', 'Entrenamiento personal'),
  ('Salud y Bienestar', 'Psicología'),
  ('Salud y Bienestar', 'Medicina alternativa'),
  -- Eventos (id 13)
  ('Eventos', 'Fotografía'),
  ('Eventos', 'DJ y música'),
  ('Eventos', 'Decoración'),
  ('Eventos', 'Catering'),
  ('Eventos', 'Animación infantil')
) AS s(cat_nombre, nombre) ON c.nombre = s.cat_nombre;
