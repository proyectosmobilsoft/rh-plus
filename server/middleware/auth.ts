import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../config/jwt';

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Token de autenticación requerido',
        code: 'TOKEN_REQUIRED'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer ' del inicio
    
    // Verificar el token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        message: 'Token inválido o expirado',
        code: 'TOKEN_INVALID'
      });
    }

    // Agregar la información del usuario al request
    req.user = decoded;
    
    console.log('Usuario autenticado:', {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      empresaId: decoded.empresaId
    });

    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware opcional para rutas que pueden ser accedidas con o sin autenticación
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación opcional:', error);
    next();
  }
}; 