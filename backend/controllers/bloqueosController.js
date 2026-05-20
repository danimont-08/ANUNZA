import { pool } from '../config/database.js';

/**
 * Bloquear un usuario dentro de una conversación
 */
export const bloquearUsuario = async (req, res) => {
  const userId = req.userId;
  const { conversacion_id, usuario_a_bloquear_id, motivo } = req.body;

  if (!conversacion_id || !usuario_a_bloquear_id || !motivo) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  if (usuario_a_bloquear_id === userId) {
    return res.status(400).json({ message: 'No puedes bloquearte a ti mismo' });
  }

  try {
    // Verificar que el usuario está en la conversación
    const participant = await pool.query(
      `SELECT 1 FROM participantes_conversacion 
       WHERE conversacion_id = $1 AND usuario_id = $2`,
      [conversacion_id, userId]
    );

    if (!participant.rows.length) {
      return res.status(403).json({ message: 'No estás en esta conversación' });
    }

    // Verificar que el usuario a bloquear también está en la conversación
    const blocked = await pool.query(
      `SELECT 1 FROM participantes_conversacion 
       WHERE conversacion_id = $1 AND usuario_id = $2`,
      [conversacion_id, usuario_a_bloquear_id]
    );

    if (!blocked.rows.length) {
      return res.status(404).json({ message: 'Usuario no encontrado en esta conversación' });
    }

    // Crear o actualizar el bloqueo
    const result = await pool.query(
      `INSERT INTO bloqueos_usuarios (usuario_que_bloquea, usuario_bloqueado, conversacion_id, motivo)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (usuario_que_bloquea, usuario_bloqueado) 
       DO UPDATE SET motivo = $4, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, usuario_a_bloquear_id, conversacion_id, motivo]
    );

    res.json({ bloqueo: result.rows[0] });
  } catch (error) {
    console.error('bloquearUsuario:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Desbloquear un usuario
 */
export const desbloquearUsuario = async (req, res) => {
  const userId = req.userId;
  const { usuario_a_desbloquear_id } = req.body;

  if (!usuario_a_desbloquear_id) {
    return res.status(400).json({ message: 'Usuario a desbloquear requerido' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM bloqueos_usuarios 
       WHERE usuario_que_bloquea = $1 AND usuario_bloqueado = $2
       RETURNING *`,
      [userId, usuario_a_desbloquear_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Bloqueo no encontrado' });
    }

    res.json({ mensaje: 'Usuario desbloqueado', bloqueo: result.rows[0] });
  } catch (error) {
    console.error('desbloquearUsuario:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtener lista de usuarios bloqueados
 */
export const obtenerBloqueados = async (req, res) => {
  const userId = req.userId;

  try {
    const { rows } = await pool.query(
      `SELECT bu.id, bu.usuario_bloqueado, bu.motivo, bu.created_at,
              u.nombre, u.foto_perfil, u.correo
       FROM bloqueos_usuarios bu
       INNER JOIN usuarios u ON u.id = bu.usuario_bloqueado
       WHERE bu.usuario_que_bloquea = $1
       ORDER BY bu.created_at DESC`,
      [userId]
    );

    res.json({ bloqueados: rows });
  } catch (error) {
    console.error('obtenerBloqueados:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Verificar si un usuario está bloqueado en una conversación
 */
export const verificarBloqueo = async (req, res) => {
  const userId = req.userId;
  const { otro_usuario_id } = req.query;

  if (!otro_usuario_id) {
    return res.status(400).json({ message: 'otro_usuario_id requerido' });
  }

  try {
    const bloqueado = await pool.query(
      `SELECT 1 FROM bloqueos_usuarios 
       WHERE usuario_que_bloquea = $1 AND usuario_bloqueado = $2`,
      [userId, otro_usuario_id]
    );

    const te_bloqueo = await pool.query(
      `SELECT 1 FROM bloqueos_usuarios 
       WHERE usuario_que_bloquea = $1 AND usuario_bloqueado = $2`,
      [otro_usuario_id, userId]
    );

    res.json({
      estaBloqueado: bloqueado.rows.length > 0,
      teHaBloqueado: te_bloqueo.rows.length > 0,
    });
  } catch (error) {
    console.error('verificarBloqueo:', error);
    res.status(500).json({ message: error.message });
  }
};
