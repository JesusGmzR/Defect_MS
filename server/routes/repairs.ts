import express, { Response } from 'express';
import pool from '../database/db';
import { verificarToken, verificarTecnico } from '../middleware/auth';
import {
  AuthenticatedRequest,
  Defecto,
  IniciarReparacionRequest,
  IniciarReparacionResponse,
  ActualizarProgresoRequest,
  FinalizarReparacionRequest,
  ErrorResponse,
  SuccessResponse,
  DBResult
} from '../../types';

const router = express.Router();

/**
 * GET /api/repairs/pendientes
 * Obtener lista de defectos pendientes de reparación
 */
router.get('/pendientes', verificarToken, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const query = 'SELECT * FROM vw_pendientes_reparacion_dms';
    const [rows] = await pool.execute(query);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener pendientes:', error);
    res.status(500).json({ 
      error: 'Error al obtener pendientes', 
      details: (error as Error).message 
    });
  }
});

/**
 * GET /api/repairs/en-proceso
 * Obtener productos en reparación
 */
router.get('/en-proceso', verificarToken, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const query = 'SELECT * FROM vw_en_reparacion_dms';
    const [rows] = await pool.execute(query);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener en proceso:', error);
    res.status(500).json({ 
      error: 'Error al obtener en proceso', 
      details: (error as Error).message 
    });
  }
});

/**
 * POST /api/repairs/iniciar
 * Iniciar reparación de un defecto
 */
router.post('/iniciar', verificarToken, verificarTecnico, async (req: AuthenticatedRequest, res: Response<IniciarReparacionResponse | ErrorResponse>) => {
  try {
    const { defect_id } = req.body as IniciarReparacionRequest;
    const tecnico = req.user?.nombre_completo || req.user?.username || 'Unknown';
    
    if (!defect_id) {
      res.status(400).json({ error: 'defect_id es requerido' });
      return;
    }
    
    // Verificar que el defecto existe y está pendiente
    const [defectRows] = await pool.execute<Defecto[]>(
      'SELECT * FROM defect_data WHERE id = ?',
      [defect_id]
    );
    
    if (defectRows.length === 0) {
      res.status(404).json({ error: 'Defecto no encontrado' });
      return;
    }
    
    if (defectRows[0].status !== 'Pendiente_Reparacion') {
      res.status(400).json({ 
        error: 'El defecto no está en estado Pendiente_Reparacion',
        details: `Estado actual: ${defectRows[0].status}`
      });
      return;
    }
    
    // Llamar al procedimiento almacenado
    const [result] = await pool.execute<any>(
      'CALL sp_iniciar_reparacion(?, ?)',
      [defect_id, tecnico]
    );
    
    res.json({
      success: true,
      message: 'Reparación iniciada correctamente',
      repair_id: result[0][0].repair_id
    });
  } catch (error) {
    console.error('Error al iniciar reparación:', error);
    res.status(500).json({ 
      error: 'Error al iniciar reparación', 
      details: (error as Error).message 
    });
  }
});

/**
 * PUT /api/repairs/:repair_id/progreso
 * Actualizar progreso de reparación
 */
router.put('/:repair_id/progreso', verificarToken, verificarTecnico, async (req: AuthenticatedRequest, res: Response<SuccessResponse | ErrorResponse>) => {
  try {
    const { repair_id } = req.params;
    const { accion_correctiva, materiales_usados, observaciones } = req.body as ActualizarProgresoRequest;
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (accion_correctiva !== undefined) {
      updates.push('accion_correctiva = ?');
      params.push(accion_correctiva);
    }
    
    if (materiales_usados !== undefined) {
      updates.push('materiales_usados = ?');
      params.push(materiales_usados);
    }
    
    if (observaciones !== undefined) {
      updates.push('observaciones = ?');
      params.push(observaciones);
    }
    
    if (updates.length === 0) {
      res.status(400).json({ error: 'No hay campos para actualizar' });
      return;
    }
    
    params.push(repair_id);
    
    const query = `UPDATE repair_data SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute<DBResult>(query, params);
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Reparación no encontrada' });
      return;
    }
    
    res.json({
      success: true,
      message: 'Progreso actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    res.status(500).json({ 
      error: 'Error al actualizar progreso', 
      details: (error as Error).message 
    });
  }
});

/**
 * POST /api/repairs/:repair_id/finalizar
 * Finalizar reparación
 */
router.post('/:repair_id/finalizar', verificarToken, verificarTecnico, async (req: AuthenticatedRequest, res: Response<SuccessResponse | ErrorResponse>) => {
  try {
    const { repair_id } = req.params;
    const { accion_correctiva, materiales_usados, observaciones } = req.body as FinalizarReparacionRequest;
    
    if (!accion_correctiva) {
      res.status(400).json({ error: 'accion_correctiva es requerida' });
      return;
    }
    
    // Verificar que la reparación existe y está en proceso
    const [repairRows] = await pool.execute<any>(
      `SELECT r.*, d.status 
       FROM repair_data r 
       JOIN defect_data d ON r.defect_id = d.id 
       WHERE r.id = ?`,
      [repair_id]
    );
    
    if (repairRows.length === 0) {
      res.status(404).json({ error: 'Reparación no encontrada' });
      return;
    }
    
    if (repairRows[0].status !== 'En_Reparacion') {
      res.status(400).json({ 
        error: 'El defecto no está en reparación',
        details: `Estado actual: ${repairRows[0].status}`
      });
      return;
    }
    
    // Llamar al procedimiento almacenado
    await pool.execute(
      'CALL sp_finalizar_reparacion(?, ?, ?, ?)',
      [repair_id, accion_correctiva, materiales_usados || null, observaciones || null]
    );
    
    res.json({
      success: true,
      message: 'Reparación finalizada correctamente'
    });
  } catch (error) {
    console.error('Error al finalizar reparación:', error);
    res.status(500).json({ 
      error: 'Error al finalizar reparación', 
      details: (error as Error).message 
    });
  }
});

/**
 * GET /api/repairs/defecto/:defect_id
 * Obtener historial de reparaciones de un defecto
 */
router.get('/defecto/:defect_id', verificarToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { defect_id } = req.params;
    
    const query = `
      SELECT r.*, u.nombre_completo as tecnico_nombre
      FROM repair_data r
      LEFT JOIN usuarios_dms u ON r.tecnico = u.username OR r.tecnico = u.nombre_completo
      WHERE r.defect_id = ?
      ORDER BY r.fecha_recepcion DESC
    `;
    
    const [rows] = await pool.execute(query, [defect_id]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ 
      error: 'Error al obtener historial', 
      details: (error as Error).message 
    });
  }
});

/**
 * GET /api/repairs/estadisticas/tecnicos
 * Obtener estadísticas de reparaciones por técnico
 */
router.get('/estadisticas/tecnicos', verificarToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dias = '30' } = req.query as { dias?: string };
    
    const query = `
      SELECT 
        tecnico,
        COUNT(*) as reparaciones_realizadas,
        AVG(TIMESTAMPDIFF(HOUR, fecha_inicio, fecha_fin)) as promedio_horas_reparacion,
        SUM(CASE WHEN resultado_inspeccion_qa = 'Aprobado' THEN 1 ELSE 0 END) as aprobadas,
        SUM(CASE WHEN resultado_inspeccion_qa = 'Rechazado' THEN 1 ELSE 0 END) as rechazadas,
        SUM(CASE WHEN resultado_inspeccion_qa IS NULL THEN 1 ELSE 0 END) as pendientes_qa
      FROM repair_data
      WHERE fecha_recepcion >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY tecnico
      ORDER BY reparaciones_realizadas DESC
    `;
    
    const [rows] = await pool.execute(query, [parseInt(dias)]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas', 
      details: (error as Error).message 
    });
  }
});

export default router;
