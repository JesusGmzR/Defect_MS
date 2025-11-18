import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JWTPayload } from '../../types';

/**
 * Middleware para verificar el token JWT
 */
export const verificarToken = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'secret-key-change-in-production'
    ) as JWTPayload;
    
    // Añadir usuario al request
    req.user = decoded;
    next();
  } catch (error) {
    if ((error as any).name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expirado' });
      return;
    }
    if ((error as any).name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    
    console.error('Error al verificar token:', error);
    res.status(500).json({ 
      error: 'Error al verificar token', 
      details: (error as Error).message 
    });
  }
};

/**
 * Middleware para verificar que el usuario sea técnico de reparación
 */
export const verificarTecnico = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  
  if (req.user.rol !== 'Tecnico_Reparacion' && req.user.rol !== 'Admin') {
    res.status(403).json({ 
      error: 'Acceso denegado. Se requiere rol de Técnico de Reparación o Admin',
      current_role: req.user.rol
    });
    return;
  }
  
  next();
};

/**
 * Middleware para verificar que el usuario sea inspector QA
 */
export const verificarInspectorQA = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  
  if (req.user.rol !== 'Inspector_QA' && req.user.rol !== 'Admin') {
    res.status(403).json({ 
      error: 'Acceso denegado. Se requiere rol de Inspector QA o Admin',
      current_role: req.user.rol
    });
    return;
  }
  
  next();
};

/**
 * Middleware para verificar que el usuario sea inspector (LQC u OQC)
 */
export const verificarInspector = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  
  const rolesPermitidos = ['Inspector_LQC', 'Inspector_OQC', 'Admin'];
  
  if (!rolesPermitidos.includes(req.user.rol)) {
    res.status(403).json({ 
      error: 'Acceso denegado. Se requiere rol de Inspector o Admin',
      current_role: req.user.rol
    });
    return;
  }
  
  next();
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
export const verificarAdmin = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  
  if (req.user.rol !== 'Admin') {
    res.status(403).json({ 
      error: 'Acceso denegado. Se requiere rol de Administrador',
      current_role: req.user.rol
    });
    return;
  }
  
  next();
};
