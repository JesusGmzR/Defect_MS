const express = require('express');
const router = express.Router();
const dbModule = require('../database/db'); const pool = dbModule.default || dbModule;
const { verificarToken, verificarInspectorQA } = require('../middleware/auth');

// Obtener productos pendientes de validación QA
router.get('/pendientes', verificarToken, verificarInspectorQA, async (req, res) => {
  try {
    const query = 'SELECT * FROM vw_pendientes_validacion_qa_dms';
    const [rows] = await pool.execute(query);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener pendientes QA:', error);
    res.status(500).json({ 
      error: 'Error al obtener pendientes QA', 
      details: error.message 
    });
  }
});

// Aprobar reparación
router.post('/:repair_id/aprobar', verificarToken, verificarInspectorQA, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { repair_id } = req.params;
    const { observaciones_qa } = req.body;
    const inspector = req.user.nombre_completo || req.user.username;
    
    // Iniciar transacción
    await connection.beginTransaction();
    
    // Verificar que la reparación existe y está en estado correcto
    const [repairRows] = await connection.execute(
      `SELECT r.*, d.status, d.id as defect_id
       FROM repair_data r 
       JOIN defect_data d ON r.defect_id = d.id 
       WHERE r.id = ?`,
      [repair_id]
    );
    
    if (repairRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Reparación no encontrada' });
    }
    
    const repair = repairRows[0];
    
    if (repair.status !== 'Reparado') {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'El defecto no está en estado Reparado',
        current_status: repair.status
      });
    }
    
    if (repair.inspeccionado_por_qa) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Esta reparación ya fue inspeccionada',
        resultado: repair.resultado_inspeccion_qa
      });
    }
    
    // Actualizar repair_data con aprobación
    await connection.execute(
      `UPDATE repair_data 
       SET inspeccionado_por_qa = TRUE,
           inspector_qa = ?,
           fecha_inspeccion_qa = NOW(),
           resultado_inspeccion_qa = 'Aprobado',
           observaciones_qa = ?
       WHERE id = ?`,
      [inspector, observaciones_qa || '', repair_id]
    );
    
    // Actualizar defect_data a Aprobado
    await connection.execute(
      'UPDATE defect_data SET status = ? WHERE id = ?',
      ['Aprobado', repair.defect_id]
    );
    
    // Registrar en audit_log
    await connection.execute(
      `INSERT INTO audit_log_dms (tabla, registro_id, accion, campo_modificado, valor_anterior, valor_nuevo, usuario)
       VALUES ('defect_data', ?, 'UPDATE', 'status', 'Reparado', 'Aprobado', ?)`,
      [repair.defect_id, inspector]
    );
    
    // Commit de la transacción
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Reparación aprobada correctamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al aprobar reparación:', error);
    res.status(500).json({ 
      error: 'Error al aprobar reparación', 
      details: error.message 
    });
  } finally {
    connection.release();
  }
});

// Rechazar reparación
router.post('/:repair_id/rechazar', verificarToken, verificarInspectorQA, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { repair_id } = req.params;
    const { observaciones_qa } = req.body;
    const inspector = req.user.nombre_completo || req.user.username;
    
    if (!observaciones_qa) {
      return res.status(400).json({ 
        error: 'Las observaciones son requeridas al rechazar una reparación' 
      });
    }
    
    // Iniciar transacción
    await connection.beginTransaction();
    
    // Verificar que la reparación existe y está en estado correcto
    const [repairRows] = await connection.execute(
      `SELECT r.*, d.status, d.id as defect_id
       FROM repair_data r 
       JOIN defect_data d ON r.defect_id = d.id 
       WHERE r.id = ?`,
      [repair_id]
    );
    
    if (repairRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Reparación no encontrada' });
    }
    
    const repair = repairRows[0];
    
    if (repair.status !== 'Reparado') {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'El defecto no está en estado Reparado',
        current_status: repair.status
      });
    }
    
    if (repair.inspeccionado_por_qa) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Esta reparación ya fue inspeccionada',
        resultado: repair.resultado_inspeccion_qa
      });
    }
    
    // Actualizar repair_data con rechazo
    await connection.execute(
      `UPDATE repair_data 
       SET inspeccionado_por_qa = TRUE,
           inspector_qa = ?,
           fecha_inspeccion_qa = NOW(),
           resultado_inspeccion_qa = 'Rechazado',
           observaciones_qa = ?
       WHERE id = ?`,
      [inspector, observaciones_qa, repair_id]
    );
    
    // Actualizar defect_data a Rechazado (vuelve a reparación)
    await connection.execute(
      'UPDATE defect_data SET status = ? WHERE id = ?',
      ['Rechazado', repair.defect_id]
    );
    
    // Registrar en audit_log
    await connection.execute(
      `INSERT INTO audit_log_dms (tabla, registro_id, accion, campo_modificado, valor_anterior, valor_nuevo, usuario)
       VALUES ('defect_data', ?, 'UPDATE', 'status', 'Reparado', 'Rechazado', ?)`,
      [repair.defect_id, inspector]
    );
    
    // Commit de la transacción
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Reparación rechazada. El producto regresa a reparación.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al rechazar reparación:', error);
    res.status(500).json({ 
      error: 'Error al rechazar reparación', 
      details: error.message 
    });
  } finally {
    connection.release();
  }
});

// Obtener historial de validaciones QA
router.get('/historial', verificarToken, async (req, res) => {
  try {
    const { dias = 30, inspector } = req.query;
    
    let query = `
      SELECT 
        r.*,
        d.codigo,
        d.defecto,
        d.modelo,
        d.linea,
        u.nombre_completo as inspector_nombre
      FROM repair_data r
      JOIN defect_data d ON r.defect_id = d.id
      LEFT JOIN usuarios_dms u ON r.inspector_qa = u.username OR r.inspector_qa = u.nombre_completo
      WHERE r.inspeccionado_por_qa = TRUE
        AND r.fecha_inspeccion_qa >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const params = [parseInt(dias)];
    
    if (inspector) {
      query += ' AND r.inspector_qa = ?';
      params.push(inspector);
    }
    
    query += ' ORDER BY r.fecha_inspeccion_qa DESC';
    
    const [rows] = await pool.execute(query, params);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ 
      error: 'Error al obtener historial', 
      details: error.message 
    });
  }
});

// Estadísticas de validación QA
router.get('/estadisticas', verificarToken, async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const query = `
      SELECT 
        inspector_qa,
        COUNT(*) as total_inspecciones,
        SUM(CASE WHEN resultado_inspeccion_qa = 'Aprobado' THEN 1 ELSE 0 END) as aprobadas,
        SUM(CASE WHEN resultado_inspeccion_qa = 'Rechazado' THEN 1 ELSE 0 END) as rechazadas,
        ROUND(SUM(CASE WHEN resultado_inspeccion_qa = 'Aprobado' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as tasa_aprobacion
      FROM repair_data
      WHERE inspeccionado_por_qa = TRUE
        AND fecha_inspeccion_qa >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY inspector_qa
      ORDER BY total_inspecciones DESC
    `;
    
    const [rows] = await pool.execute(query, [parseInt(dias)]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener estadísticas QA:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas QA', 
      details: error.message 
    });
  }
});

module.exports = router;

