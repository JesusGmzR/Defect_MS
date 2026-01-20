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
      process.env.JWT_SECRET!
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
      ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
    });
  }
};

/**
 * Middleware para verificar que el usuario sea Reparador
 */
export const verificarReparador = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  if (req.user.rol !== 'Reparador' && req.user.rol !== 'Supervisor_Produccion' && req.user.rol !== 'Admin') {
    res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de Reparador o Supervisor',
      current_role: req.user.rol
    });
    return;
  }

  next();
};

/**
 * Middleware para verificar que el usuario sea Supervisor de Calidad
 */
export const verificarSupervisorCalidad = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  if (req.user.rol !== 'Supervisor_Calidad' && req.user.rol !== 'Admin') {
    res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de Supervisor Calidad o Admin',
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

  const rolesPermitidos = ['Inspector_LQC', 'Inspector_OQC', 'Admin_Calidad', 'Admin'];

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
 * Middleware para verificar que el usuario sea administrador o supervisor
 * Permite acceso al panel de administración de usuarios
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

  // Roles que pueden acceder al panel de administración de usuarios
  const adminRoles = ['Admin', 'Supervisor_Calidad', 'Supervisor_Produccion'];

  if (!adminRoles.includes(req.user.rol)) {
    res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de Administrador o Supervisor',
      current_role: req.user.rol
    });
    return;
  }

  next();
};

// Alias para compatibilidad con código existente
export const verificarTecnico = verificarReparador;
export const verificarInspectorQA = verificarSupervisorCalidad;
