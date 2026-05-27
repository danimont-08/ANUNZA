import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { User } from '../models/User.js';
import { sendConfirmacionCorreo } from '../utils/mailer.js';

const sanitizeUser = (row) => {
  if (!row) return null;
  const { password: _p, token_confirmacion: _t, token_confirmacion_exp: _e, ...rest } = row;
  return rest;
};

export const register = async (req, res) => {
  try {
    const { nombre, correo, telefono, password, cedula, ciudad, latitud, longitud } = req.body;

    if (!nombre || !correo || !telefono || !password || !cedula || !String(ciudad || '').trim()) {
      return res.status(400).json({ message: 'Nombre, correo, teléfono, cédula, ciudad y contraseña son requeridos' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ message: 'Correo inválido' });
    }

    if (String(cedula).trim().length < 5) {
      return res.status(400).json({ message: 'Cédula inválida' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres' });
    }

    const existingEmail = await User.findByEmail(correo.trim().toLowerCase());
    if (existingEmail) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const existingCedula = await User.findByCedula(String(cedula).trim());
    if (existingCedula) {
      return res.status(400).json({ message: 'La cédula ya está registrada' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const tokenConfirmacion = crypto.randomBytes(32).toString('hex');
    const tokenConfirmacionExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await User.create({
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      telefono: String(telefono).trim(),
      passwordHash,
      cedula: String(cedula).trim(),
      ciudad: String(ciudad).trim(),
      latitud: latitud != null && latitud !== '' ? Number(latitud) : null,
      longitud: longitud != null && longitud !== '' ? Number(longitud) : null,
      tokenConfirmacion,
      tokenConfirmacionExp,
    });

    try {
      await sendConfirmacionCorreo({
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        token: tokenConfirmacion,
      });
      console.log('Correo de confirmación enviado a:', correo.trim().toLowerCase());
    } catch (mailErr) {
      console.error('Error enviando correo de confirmación:', mailErr);
      return res.status(201).json({
        needs_confirmation: true,
        mail_error: mailErr.message,
        message: 'Cuenta creada, pero no se pudo enviar el correo de confirmación. Contacta al administrador.',
      });
    }

    res.status(201).json({
      needs_confirmation: true,
      message: 'Cuenta creada. Revisa tu correo y haz clic en el enlace para activarla.',
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: error.message });
  }
};

export const confirmarCorreo = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: 'Token inválido.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, correo_confirmado, token_confirmacion_exp
       FROM usuarios WHERE token_confirmacion = $1`,
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({ message: 'El enlace no es válido o ya fue usado.' });
    }

    const user = rows[0];

    if (user.correo_confirmado) {
      return res.json({ ok: true, message: 'Tu correo ya estaba confirmado. Puedes iniciar sesión.' });
    }

    if (user.token_confirmacion_exp && new Date(user.token_confirmacion_exp) < new Date()) {
      return res.status(400).json({
        message: 'El enlace ha expirado. Solicita uno nuevo.',
        expired: true,
      });
    }

    await pool.query(
      `UPDATE usuarios
       SET correo_confirmado = true, token_confirmacion = NULL, token_confirmacion_exp = NULL
       WHERE id = $1`,
      [user.id]
    );

    res.json({ ok: true, message: '¡Correo confirmado! Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('confirmarCorreo:', error);
    res.status(500).json({ message: error.message });
  }
};

export const reenviarConfirmacion = async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ message: 'Correo requerido.' });

  try {
    const user = await User.findByEmail(correo.trim().toLowerCase());
    if (!user) return res.status(404).json({ message: 'No existe una cuenta con ese correo.' });
    if (user.correo_confirmado) return res.status(400).json({ message: 'Este correo ya está confirmado.' });

    const tokenConfirmacion = crypto.randomBytes(32).toString('hex');
    const tokenConfirmacionExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE usuarios SET token_confirmacion = $1, token_confirmacion_exp = $2 WHERE id = $3`,
      [tokenConfirmacion, tokenConfirmacionExp, user.id]
    );

    await sendConfirmacionCorreo({ nombre: user.nombre, correo: user.correo, token: tokenConfirmacion });

    res.json({ ok: true, message: 'Correo de confirmación reenviado.' });
  } catch (error) {
    console.error('reenviarConfirmacion:', error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    }

    const user = await User.findByEmail(correo.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    if (user.estado === 'suspendido') {
      return res.status(403).json({ message: 'Tu cuenta está suspendida. Contacta al administrador.' });
    }

    if (user.correo_confirmado === false) {
      return res.status(403).json({
        message: 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
        correo_no_confirmado: true,
        correo: user.correo,
      });
    }

    const token = jwt.sign({ id: user.id, email: user.correo }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      message: 'Login exitoso',
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: error.message });
  }
};
