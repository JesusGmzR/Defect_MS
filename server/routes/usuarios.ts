import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../database/db';
import { verificarToken, verificarAdmin } from '../middleware/auth';
import { 
  AuthenticatedRequest,
  Usuario,
  UserRole,
  Area
} from '../../types';

const router = express.Router();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(verificarToken);
router.use(verificarAdmin);

// Definición de grupos de roles por tipo de administrador
const ROLES_CALIDAD: UserRole[] = ['Inspector_LQC', 'Inspector_OQC', 'Inspector_QA', 'Admin_Calidad'];
const ROLES_REPARACION: UserRole[] = ['Tecnico_Reparacion', 'Admin_Reparacion'];
const TODOS_LOS_ROLES: UserRole[] = [...ROLES_CALIDAD, ...ROLES_REPARACION, 'Admin'];

/**
 * Obtiene los roles que un usuario puede gestionar según su propio rol
 */
const getRolesGestionables = (userRol: string): UserRole[] => {
  if (userRol === 'Admin') return TODOS_LOS_ROLES;
  if (userRol === 'Admin_Calidad') return ROLES_CALIDAD;
  if (userRol === 'Admin_Reparacion') return ROLES_REPARACION;
  return [];
};

/**
 * GET /api/usuarios
 * Obtener todos los usuarios
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRol = req.user?.rol || '';
    const rolesPermitidos = getRolesGestionables(userRol);

    let query = `
      SELECT id, username, nombre_completo, rol, area, activo, fecha_creacion, ultimo_acceso 
      FROM usuarios_dms 
    `;
    
    const params: any[] = [];
    
    // Si no es super admin, filtrar por los roles que puede gestionar
    if (userRol !== 'Admin') {
      query += ` WHERE rol IN (${rolesPermitidos.map(() => '?').join(',')}) `;
      params.push(...rolesPermitidos);

      // Filtrar por área si el admin tiene una asignada (excepto si es del área Administración)
      const userArea = req.user?.area;
      if (userArea && userArea !== 'Administracion') {
        query += ` AND area = ? `;
        params.push(userArea);
      }
    }
    
    query += ` ORDER BY fecha_creacion DESC `;
    
    const [rows] = await pool.execute<Usuario[]>(query, params);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      error: 'Error al obtener usuarios',
      details: (error as Error).message 
    });
  }
});

/**
 * GET /api/usuarios/:id
 * Obtener un usuario por ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRol = req.user?.rol || '';
    const rolesPermitidos = getRolesGestionables(userRol);
    
    let query = `
      SELECT id, username, nombre_completo, rol, area, activo, fecha_creacion, ultimo_acceso 
      FROM usuarios_dms 
      WHERE id = ?
    `;
    const params: any[] = [id];

    if (userRol !== 'Admin') {
      query += ` AND rol IN (${rolesPermitidos.map(() => '?').join(',')}) `;
      params.push(...rolesPermitidos);

      // Filtrar por área si el admin tiene una asignada
      const userArea = req.user?.area;
      if (userArea && userArea !== 'Administracion') {
        query += ` AND area = ? `;
        params.push(userArea);
      }
    }
    
    const [rows] = await pool.execute<Usuario[]>(query, params);
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado o sin permisos para verlo' });
      return;
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ 
      error: 'Error al obtener usuario',
      details: (error as Error).message 
    });
  }
});

/**
 * POST /api/usuarios
 * Crear nuevo usuario
 */
interface CreateUserRequest {
  username: string;
  password: string;
  nombre_completo: string;
  rol: UserRole;
  area?: Area;
}

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, password, nombre_completo, rol, area }: CreateUserRequest = req.body;
    
    // Validaciones
    if (!username || !password || !nombre_completo || !rol) {
      res.status(400).json({ 
        error: 'Campos requeridos: username, password, nombre_completo, rol' 
      });
      return;
    }

    // Validar rol
    const rolesPermitidos = getRolesGestionables(req.user?.rol || '');
    
    if (!rolesPermitidos.includes(rol)) {
      res.status(403).json({ 
        error: `No tienes permisos para crear usuarios con el rol: ${rol}. Roles permitidos: ${rolesPermitidos.join(', ')}` 
      });
      return;
    }

    // Verificar si el username ya existe
    const [existingUsers] = await pool.execute<Usuario[]>(
      'SELECT id FROM usuarios_dms WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      res.status(409).json({ error: 'El nombre de usuario ya existe' });
      return;
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insertar usuario
    const insertQuery = `
      INSERT INTO usuarios_dms (username, password_hash, nombre_completo, rol, area, activo, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, TRUE, NOW())
    `;
    
    const [result] = await pool.execute(insertQuery, [
      username,
      password_hash,
      nombre_completo,
      rol,
      area || null
    ]);

    const insertResult = result as any;

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: insertResult.insertId,
        username,
        nombre_completo,
        rol,
        area
      }
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ 
      error: 'Error al crear usuario',
      details: (error as Error).message 
    });
  }
});

/**
 * PUT /api/usuarios/:id
 * Actualizar usuario
 */
interface UpdateUserRequest {
  nombre_completo?: string;
  rol?: UserRole;
  area?: Area;
  activo?: boolean;
}

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre_completo, rol, area, activo }: UpdateUserRequest = req.body;
    const userRol = req.user?.rol || '';
    const rolesPermitidos = getRolesGestionables(userRol);

    // Verificar que el usuario existe y que el admin tiene permiso sobre él
    let checkQuery = 'SELECT id, rol FROM usuarios_dms WHERE id = ?';
    const checkParams: any[] = [id];

    if (userRol !== 'Admin') {
      checkQuery += ` AND rol IN (${rolesPermitidos.map(() => '?').join(',')}) `;
      checkParams.push(...rolesPermitidos);

      // Filtrar por área si el admin tiene una asignada
      const userArea = req.user?.area;
      if (userArea && userArea !== 'Administracion') {
        checkQuery += ` AND area = ? `;
        checkParams.push(userArea);
      }
    }

    const [existingUsers] = await pool.execute<Usuario[]>(checkQuery, checkParams);
    
    if (existingUsers.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado o sin permisos para editarlo' });
      return;
    }

    // Validar nuevo rol si se proporciona
    if (rol) {
      if (!rolesPermitidos.includes(rol)) {
        res.status(403).json({ 
          error: `No tienes permisos para asignar el rol: ${rol}. Roles permitidos: ${rolesPermitidos.join(', ')}` 
        });
        return;
      }
    }

    // Construir query dinámico
    const updates: string[] = [];
    const values: any[] = [];

    if (nombre_completo !== undefined) {
      updates.push('nombre_completo = ?');
      values.push(nombre_completo);
    }
    if (rol !== undefined) {
      updates.push('rol = ?');
      values.push(rol);
    }
    if (area !== undefined) {
      updates.push('area = ?');
      values.push(area);
    }
    if (activo !== undefined) {
      updates.push('activo = ?');
      values.push(activo);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
      return;
    }

    values.push(id);

    const updateQuery = `UPDATE usuarios_dms SET ${updates.join(', ')} WHERE id = ?`;
    await pool.execute(updateQuery, values);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ 
      error: 'Error al actualizar usuario',
      details: (error as Error).message 
    });
  }
});

/**
 * PUT /api/usuarios/:id/password
 * Cambiar contraseña de usuario (solo admin)
 */
router.put('/:id/password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    const userRol = req.user?.rol || '';
    const rolesPermitidos = getRolesGestionables(userRol);

    if (!new_password || new_password.length < 6) {
      res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
      return;
    }

    // Verificar que el usuario existe y permisos
    let checkQuery = 'SELECT id FROM usuarios_dms WHERE id = ?';
    const checkParams: any[] = [id];

    if (userRol !== 'Admin') {
      checkQuery += ` AND rol IN (${rolesPermitidos.map(() => '?').join(',')}) `;
      checkParams.push(...rolesPermitidos);

      // Filtrar por área si el admin tiene una asignada
      const userArea = req.user?.area;
      if (userArea && userArea !== 'Administracion') {
        checkQuery += ` AND area = ? `;
        checkParams.push(userArea);
      }
    }

    const [existingUsers] = await pool.execute<Usuario[]>(checkQuery, checkParams);
    
    if (existingUsers.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado o sin permisos' });
      return;
    }

    // Hash de la nueva contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(new_password, saltRounds);

    await pool.execute(
      'UPDATE usuarios_dms SET password_hash = ? WHERE id = ?',
      [password_hash, id]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ 
      error: 'Error al cambiar contraseña',
      details: (error as Error).message 
    });
  }
});

/**
 * DELETE /api/usuarios/:id
 * Eliminar usuario (soft delete - solo desactiva)
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRol = req.user?.rol || '';
    const rolesPermitidos = getRolesGestionables(userRol);

    // No permitir eliminarse a sí mismo
    if (req.user?.id === parseInt(id)) {
      res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
      return;
    }

    // Verificar que el usuario existe y permisos
    let checkQuery = 'SELECT id, username FROM usuarios_dms WHERE id = ?';
    const checkParams: any[] = [id];

    if (userRol !== 'Admin') {
      checkQuery += ` AND rol IN (${rolesPermitidos.map(() => '?').join(',')}) `;
      checkParams.push(...rolesPermitidos);

      // Filtrar por área si el admin tiene una asignada
      const userArea = req.user?.area;
      if (userArea && userArea !== 'Administracion') {
        checkQuery += ` AND area = ? `;
        checkParams.push(userArea);
      }
    }

    const [existingUsers] = await pool.execute<Usuario[]>(checkQuery, checkParams);
    
    if (existingUsers.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado o sin permisos' });
      return;
    }

    // Soft delete - solo desactivar
    await pool.execute(
      'UPDATE usuarios_dms SET activo = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `Usuario ${existingUsers[0].username} desactivado exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ 
      error: 'Error al eliminar usuario',
      details: (error as Error).message 
    });
  }
});

/**
 * GET /api/usuarios/roles/list
 * Obtener lista de roles disponibles según el nivel de admin
 */
router.get('/roles/list', async (req: AuthenticatedRequest, res: Response) => {
  const userRol = req.user?.rol || '';
  
  const allRoles = [
    { value: 'Inspector_LQC', label: 'Inspector LQC', description: 'Inspección en línea de producción' },
    { value: 'Inspector_OQC', label: 'Inspector OQC', description: 'Inspección de calidad final' },
    { value: 'Tecnico_Reparacion', label: 'Técnico de Reparación', description: 'Reparación de defectos' },
    { value: 'Inspector_QA', label: 'Inspector QA', description: 'Verificación post-reparación' },
    { value: 'Admin_Calidad', label: 'Admin Calidad', description: 'Administrador de inspectores' },
    { value: 'Admin_Reparacion', label: 'Admin Reparación', description: 'Administrador de técnicos' },
    { value: 'Admin', label: 'Super Administrador', description: 'Acceso completo al sistema' }
  ];

  const rolesPermitidos = getRolesGestionables(userRol);
  const filteredRoles = allRoles.filter(r => rolesPermitidos.includes(r.value as UserRole));

  res.json({
    success: true,
    data: filteredRoles
  });
});

/**
 * GET /api/usuarios/areas/list
 * Obtener lista de áreas/departamentos funcionales para usuarios
 */
router.get('/areas/list', async (_req: AuthenticatedRequest, res: Response) => {
  const areas = [
    { value: 'LQC', label: 'LQC' },
    { value: 'OQC', label: 'OQC' },
    { value: 'Reparacion', label: 'Reparación' },
    { value: 'QA', label: 'QA' },
    { value: 'Administracion', label: 'Administración' }
  ];

  res.json({
    success: true,
    data: areas
  });
});

export default router;
