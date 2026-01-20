import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/db';
import {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  UsuarioPublico,
  Usuario,
  SuccessResponse,
  ErrorResponse
} from '../../types';

const router = express.Router();

/**
 * POST /api/auth/login
 * Autenticar usuario y generar token JWT
 */
router.post('/login', async (req: express.Request<{}, LoginResponse | ErrorResponse, LoginRequest>, res: Response<LoginResponse | ErrorResponse>) => {
  try {
    const { username, password } = req.body;

    // Validar campos
    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
      return;
    }

    // Buscar usuario
    const query = 'SELECT * FROM usuarios_dms WHERE username = ? AND activo = TRUE';
    const [rows] = await pool.execute<Usuario[]>(query, [username]);

    if (rows.length === 0) {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      return;
    }

    const user = rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      return;
    }

    // Actualizar último acceso
    await pool.execute(
      'UPDATE usuarios_dms SET ultimo_acceso = NOW() WHERE id = ?',
      [user.id]
    );

    // Generar token JWT
    const jwtSecret = process.env.JWT_SECRET!;
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        rol: user.rol,
        area: user.area
      },
      jwtSecret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
    );

    // Preparar datos públicos del usuario
    const publicUser: UsuarioPublico = {
      id: user.id,
      username: user.username,
      nombre_completo: user.nombre_completo,
      rol: user.rol,
      area: user.area
    };

    res.json({
      success: true,
      token,
      user: publicUser
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión',
      ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
    });
  }
});

/**
 * GET /api/auth/verify
 * Verificar validez del token JWT
 */
router.get('/verify', async (req: express.Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number };

    // Verificar que el usuario siga activo
    const query = 'SELECT id, username, nombre_completo, rol, area FROM usuarios_dms WHERE id = ? AND activo = TRUE';
    const [rows] = await pool.execute<Usuario[]>(query, [decoded.id]);

    if (rows.length === 0) {
      res.status(401).json({ error: 'Usuario no válido' });
      return;
    }

    const user: UsuarioPublico = {
      id: rows[0].id,
      username: rows[0].username,
      nombre_completo: rows[0].nombre_completo,
      rol: rows[0].rol,
      area: rows[0].area
    };

    res.json({
      success: true,
      user
    });
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
});

/**
 * POST /api/auth/change-password
 * Cambiar contraseña del usuario autenticado
 */
router.post('/change-password', async (req: express.Request<{}, SuccessResponse | ErrorResponse, ChangePasswordRequest>, res: Response<SuccessResponse | ErrorResponse>) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number };

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
      return;
    }

    if (newPassword.length < 4) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres' });
      return;
    }

    // Obtener usuario
    const [rows] = await pool.execute<Usuario[]>(
      'SELECT password_hash FROM usuarios_dms WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);

    if (!isValid) {
      res.status(401).json({ error: 'Contraseña actual incorrecta' });
      return;
    }

    // Hash de nueva contraseña
    const newHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await pool.execute(
      'UPDATE usuarios_dms SET password_hash = ? WHERE id = ?',
      [newHash, decoded.id]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error al cambiar contraseña',
      ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
    });
  }
});

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', async (req: express.Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number };

    const query = `
      SELECT id, username, nombre_completo, rol, area, fecha_creacion, ultimo_acceso
      FROM usuarios_dms 
      WHERE id = ? AND activo = TRUE
    `;
    const [rows] = await pool.execute<Usuario[]>(query, [decoded.id]);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      error: 'Error al obtener perfil',
      ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
    });
  }
});

export default router;
