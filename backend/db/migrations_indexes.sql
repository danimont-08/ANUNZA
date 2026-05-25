-- Índices para mejorar rendimiento de queries frecuentes

-- Publicaciones
CREATE INDEX IF NOT EXISTS idx_pub_usuario    ON publicaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pub_estado     ON publicaciones(estado);
CREATE INDEX IF NOT EXISTS idx_pub_categoria  ON publicaciones(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pub_created    ON publicaciones(created_at DESC);

-- Interacciones (likes)
CREATE INDEX IF NOT EXISTS idx_inter_pub      ON interacciones(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_inter_user_pub ON interacciones(usuario_id, publicacion_id);

-- Comentarios
CREATE INDEX IF NOT EXISTS idx_com_pub        ON comentarios(publicacion_id);

-- Reportes
CREATE INDEX IF NOT EXISTS idx_rep_estado     ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_rep_tipo       ON reportes(tipo);

-- Notificaciones
CREATE INDEX IF NOT EXISTS idx_notif_user     ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notif_leida    ON notificaciones(usuario_id, leida);

-- Mensajes / chat
CREATE INDEX IF NOT EXISTS idx_msg_conv       ON mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_msg_created    ON mensajes(conversacion_id, created_at DESC);

-- Participantes de conversaciones
CREATE INDEX IF NOT EXISTS idx_part_conv      ON participantes_conversacion(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_part_user      ON participantes_conversacion(usuario_id);
