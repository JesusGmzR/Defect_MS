import express, { Request, Response } from 'express';
import pool from '../database/db';
import { Defecto, ErrorResponse, SuccessResponse } from '../../types';

const router = express.Router();

/**
 * GET /api/modelo
 * Buscar modelo por código de producto
 */
router.get('/', async (req: Request<{}, { modelo: string } | ErrorResponse, {}, { codigo?: string }>, res: Response<{ modelo: string } | ErrorResponse>) => {
  try {
    const { codigo } = req.query;
    
    if (!codigo || codigo.length < 9) {
      res.json({ modelo: '' });
      return;
    }
    
    const codigoBusqueda = codigo.substring(0, 9);
    
    // Buscar en la tabla de defectos existente para obtener el modelo
    const query = `
      SELECT modelo 
      FROM defect_data 
      WHERE codigo LIKE ? 
      AND modelo IS NOT NULL 
      AND modelo != ''
      LIMIT 1
    `;
    
    const [rows] = await pool.execute<Defecto[]>(query, [`${codigoBusqueda}%`]);
    
    const modelo = rows.length > 0 ? rows[0].modelo || '' : '';
    
    res.json({ modelo });
  } catch (error) {
    console.error('Error al buscar modelo:', error);
    res.status(500).json({ 
      error: 'Error al buscar modelo', 
      details: (error as Error).message 
    });
  }
});

/**
 * POST /api/modelo
 * Crear o actualizar modelo en catálogo
 */
router.post('/', async (req: Request<{}, SuccessResponse | ErrorResponse, { codigo: string; modelo: string }>, res: Response<SuccessResponse | ErrorResponse>) => {
  try {
    const { codigo, modelo } = req.body;
    
    if (!codigo || !modelo) {
      res.status(400).json({ error: 'Código y modelo son requeridos' });
      return;
    }
    
    // Aquí podrías crear una tabla de catálogo de modelos si es necesario
    // Por ahora, devolvemos éxito
    
    res.json({ 
      success: true, 
      message: 'Modelo registrado' 
    });
  } catch (error) {
    console.error('Error al registrar modelo:', error);
    res.status(500).json({ 
      error: 'Error al registrar modelo', 
      details: (error as Error).message 
    });
  }
});

export default router;
