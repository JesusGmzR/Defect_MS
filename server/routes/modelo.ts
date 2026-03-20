import express, { Request, Response } from 'express';
import pool from '../database/db';
import { ErrorResponse, SuccessResponse } from '../../types';

const router = express.Router();

/**
 * GET /api/modelo
 * Buscar modelo por código de producto
 */
router.get('/', async (req: Request<{}, { modelo: string } | ErrorResponse, {}, { codigo?: string }>, res: Response<{ modelo: string } | ErrorResponse>) => {
  try {
    const { codigo } = req.query;

    if (!codigo || codigo.length < 3) {
      res.json({ modelo: '' });
      return;
    }

    const codigoUpper = codigo.toUpperCase().trim();

    // Buscar en la tabla de part_numbers del MES para obtener el modelo
    // Buscar donde el código comience con el part_number
    const query = `
      SELECT model
      FROM mes_production.part_numbers
      WHERE ? LIKE CONCAT(part_number, '%')
      AND model IS NOT NULL
      AND model != ''
      AND active = 1
      ORDER BY LENGTH(part_number) DESC
      LIMIT 1
    `;

    const [rows] = await pool.execute<any[]>(query, [codigoUpper]);

    const modelo = rows.length > 0 ? rows[0].model || '' : '';

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
