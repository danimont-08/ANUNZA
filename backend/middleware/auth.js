import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Middleware para verificar JWT
 * Extrae y valida el token de la cabecera Authorization
 */
export const verifyToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    // El formato es: Bearer <token>
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    return res.status(401).json({ message: 'Token inválido' });
  }
};

/** Rechaza cuentas suspendidas (admins siempre pueden pasar). */
export const verifyActiveAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (user.rol === 'admin') {
      req.userRole = user.rol;
      return next();
    }
    if (user.estado === 'suspendido') {
      return res.status(403).json({
        message: 'Tu cuenta está suspendida. Contacta al administrador.',
      });
    }
    req.userRole = user.rol || 'usuario';
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/** Solo usuarios con rol admin. Usar después de verifyToken. */
export const verifyAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.rol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado: se requiere rol administrador' });
    }
    req.userRole = 'admin';
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
