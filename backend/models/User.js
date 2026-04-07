import { pool } from '../config/database.js';

export class User {
  /**
   * Buscar usuario por ID
   */
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  /**
   * Buscar usuario por correo
   */
  static async findByEmail(email) {
    try {
      const [rows] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [email]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }
  }

  /**
   * Obtener todos los usuarios (sin contraseña)
   */
  static async findAll() {
    try {
      const [rows] = await pool.query(
        'SELECT id, nombre, correo, telefono, created_at FROM usuarios'
      );
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  /**
   * Crear nuevo usuario
   */
  static async create(userData) {
    const { nombre, correo, telefono, passwordHash } = userData;
    try {
      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, correo, telefono, password) VALUES (?, ?, ?, ?)',
        [nombre, correo, telefono, passwordHash]
      );
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El correo ya está registrado');
      }
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  /**
   * Actualizar usuario
   */
  static async update(id, updateData) {
    const { nombre, correo, telefono } = updateData;
    try {
      const [result] = await pool.query(
        'UPDATE usuarios SET nombre = ?, correo = ?, telefono = ? WHERE id = ?',
        [nombre, correo, telefono, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El correo ya está en uso');
      }
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  /**
   * Eliminar usuario
   */
  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }
}
