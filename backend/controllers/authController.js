import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const sanitizeUser = (row) => {
  if (!row) return null;
  const { password: _p, ...rest } = row;
  return rest;
};

/**
 * Registrar nuevo usuario.
 */
export const register = async (req, res) => {
  try {
    const { nombre, correo, telefono, password, cedula, ciudad, latitud, longitud } = req.body;

    if (!nombre || !correo || !telefono || !password || !cedula || !String(ciudad || '').trim()) {
      return res.status(400).json({
        message: 'Nombre, correo, teléfono, cédula, ciudad y contraseña son requeridos',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ message: 'Correo inválido' });
    }

    if (String(cedula).trim().length < 5) {
      return res.status(400).json({ message: 'Cédula inválida' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener mínimo 6 caracteres' });
    }

    const existingEmail = await User.findByEmail(correo);
    if (existingEmail) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const existingCedula = await User.findByCedula(String(cedula).trim());
    if (existingCedula) {
      return res.status(400).json({ message: 'La cédula ya está registrada' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const created = await User.create({
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      telefono: String(telefono).trim(),
      passwordHash,
      cedula: String(cedula).trim(),
      verificado: false,
      ciudad: String(ciudad).trim(),
      latitud: latitud != null && latitud !== '' ? Number(latitud) : null,
      longitud: longitud != null && longitud !== '' ? Number(longitud) : null,
    });

    const token = jwt.sign({ id: created.id, email: created.correo }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: sanitizeUser(created),
      token,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Login con correo y contraseña desde tabla usuarios.
 */
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
