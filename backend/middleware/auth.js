import jwt from 'jsonwebtoken';

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
