-- Agrega soporte para editar y eliminar mensajes
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS editado BOOLEAN DEFAULT false;
