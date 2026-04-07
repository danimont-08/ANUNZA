import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Registrar nuevo usuario
 * POST /api/register
 */
export const register = async (req, res) => {
  try {
    const { nombre, correo, telefono, password } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !correo || !telefono || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ message: 'Correo inválido' });
    }

    // Validar contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener mínimo 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(correo);
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario
    const userId = await User.create({
      nombre,
      correo,
      telefono,
      passwordHash,
    });

    // Crear JWT
    const token = jwt.sign({ id: userId, email: correo }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: userId,
        nombre,
        correo,
        telefono,
      },
      token,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Login de usuario
 * POST /api/login
 */
export const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    // Validar campos
    if (!correo || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    }

    // Buscar usuario
    const user = await User.findByEmail(correo);
    if (!user) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    // Comparar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    // Crear JWT
    const token = jwt.sign({ id: user.id, email: user.correo }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        telefono: user.telefono,
      },
      token,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: error.message });
  }
};
