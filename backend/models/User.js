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

  static async findAll() {
    try {
      const { rows } = await pool.query(
        `SELECT id, nombre, correo, telefono, cedula, foto_perfil, verificado, ciudad, created_at
         FROM usuarios
         ORDER BY nombre`
      );
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
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
    } = userData;

    try {
      const { rows } = await pool.query(
        `INSERT INTO usuarios (nombre, correo, telefono, password, cedula, verificado, ciudad, latitud, longitud)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, false), $7, $8, $9)
         RETURNING id, nombre, correo, telefono, cedula, foto_perfil, verificado, ciudad, latitud, longitud, descripcion, created_at`,
        [
          nombre,
          correo,
          telefono,
          passwordHash,
          cedula,
          userData.verificado ?? false,
          ciudad ?? null,
          latitud != null && !Number.isNaN(Number(latitud)) ? Number(latitud) : null,
          longitud != null && !Number.isNaN(Number(longitud)) ? Number(longitud) : null,
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
           ciudad = $6,
           codigo_postal = $7,
           latitud = $8,
           longitud = $9
         WHERE id = $10`,
        [
          nombre,
          correo,
          telefono,
          descripcion ?? null,
          foto_perfil ?? null,
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
