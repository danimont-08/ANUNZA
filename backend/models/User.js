import { pool } from '../config/database.js';

export class User {
  static async findById(id) {
    try {
      const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const { rows } = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  static async findByCedula(cedula) {
    try {
      const { rows } = await pool.query('SELECT id FROM usuarios WHERE cedula = $1', [cedula]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al buscar por cédula: ${error.message}`);
    }
  }

  static async findAll({ estado, q } = {}) {
    try {
      const params = [];
      const conditions = [];
      if (estado) {
        params.push(estado);
        conditions.push(`estado = $${params.length}`);
      }
      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        const i = params.length;
        conditions.push(
          `(nombre ILIKE $${i} OR correo ILIKE $${i} OR cedula ILIKE $${i})`
        );
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const { rows } = await pool.query(
        `SELECT id, nombre, correo, telefono, cedula, foto_perfil, verificado, ciudad,
                rol, estado, created_at
         FROM usuarios
         ${where}
         ORDER BY created_at DESC`,
        params
      );
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  static async updateEstado(id, estado) {
    const allowed = ['activo', 'suspendido'];
    if (!allowed.includes(estado)) {
      throw new Error('Estado inválido');
    }
    try {
      const { rowCount, rows } = await pool.query(
        `UPDATE usuarios SET estado = $1 WHERE id = $2
         RETURNING id, nombre, correo, telefono, cedula, foto_perfil, verificado, ciudad, rol, estado, created_at`,
        [estado, id]
      );
      if (!rowCount) return null;
      return rows[0];
    } catch (error) {
      throw new Error(`Error al actualizar estado: ${error.message}`);
    }
  }

  static async toggleVerificado(id) {
    const { rowCount, rows } = await pool.query(
      `UPDATE usuarios SET verificado = NOT verificado WHERE id = $1
       RETURNING id, nombre, verificado`,
      [id]
    );
    if (!rowCount) return null;
    return rows[0];
  }

  /**
   * Crea usuario; id lo genera la BD (gen_random_uuid() por defecto en la tabla).
   */
  static async create(userData) {
    const {
      nombre,
      correo,
      telefono,
      passwordHash,
      cedula,
      ciudad,
      latitud,
      longitud,
      tokenConfirmacion = null,
      tokenConfirmacionExp = null,
    } = userData;

    try {
      const { rows } = await pool.query(
        `INSERT INTO usuarios
           (nombre, correo, telefono, password, cedula, verificado, ciudad, latitud, longitud,
            correo_confirmado, token_confirmacion, token_confirmacion_exp)
         VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8, false, $9, $10)
         RETURNING id, nombre, correo, telefono, cedula, foto_perfil, verificado,
                   correo_confirmado, ciudad, latitud, longitud, descripcion, created_at`,
        [
          nombre,
          correo,
          telefono,
          passwordHash,
          cedula,
          ciudad ?? null,
          latitud != null && !Number.isNaN(Number(latitud)) ? Number(latitud) : null,
          longitud != null && !Number.isNaN(Number(longitud)) ? Number(longitud) : null,
          tokenConfirmacion,
          tokenConfirmacionExp,
        ]
      );
      return rows[0];
    } catch (error) {
      if (error.code === '23505') {
        const detail = (error.detail || '').toLowerCase();
        if (detail.includes('correo') || detail.includes('usuarios_correo')) {
          throw new Error('El correo ya está registrado');
        }
        if (detail.includes('cedula')) {
          throw new Error('La cédula ya está registrada');
        }
        throw new Error('Datos duplicados: correo o cédula ya existen');
      }
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  static async update(id, updateData) {
    const {
      nombre,
      correo,
      telefono,
      descripcion,
      foto_perfil,
      foto_portada,
      foto_portada_pos,
      ciudad,
      codigo_postal,
      latitud,
      longitud,
    } = updateData;
    try {
      const { rowCount } = await pool.query(
        `UPDATE usuarios SET
           nombre = $1,
           correo = $2,
           telefono = $3,
           descripcion = $4,
           foto_perfil = $5,
           foto_portada = $6,
           foto_portada_pos = $7,
           ciudad = $8,
           codigo_postal = $9,
           latitud = $10,
           longitud = $11
         WHERE id = $12`,
        [
          nombre,
          correo,
          telefono,
          descripcion ?? null,
          foto_perfil ?? null,
          foto_portada ?? null,
          foto_portada_pos ?? '50% 50%',
          ciudad ?? null,
          codigo_postal ?? null,
          latitud != null && !Number.isNaN(Number(latitud)) ? Number(latitud) : null,
          longitud != null && !Number.isNaN(Number(longitud)) ? Number(longitud) : null,
          id,
        ]
      );
      return rowCount > 0;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El correo ya está en uso');
      }
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const { rowCount } = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
      return rowCount > 0;
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }
}
