const express = require('express');
const router = express.Router();
const dbModule = require('../database/db'); const pool = dbModule.default || dbModule;

// Registrar nuevo defecto
router.post('/', async (req, res) => {
  try {
    const { 
      fecha,
      linea, 
      codigo, 
      defecto, 
      ubicacion, 
      area, 
      modelo,
      tipo_inspeccion,
      etapa_deteccion,
      registrado_por
    } = req.body;
    
    // Validar campos requeridos
    if (!linea || !codigo || !defecto || !ubicacion || !area || !tipo_inspeccion || !etapa_deteccion || !registrado_por) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos',
        required: ['linea', 'codigo', 'defecto', 'ubicacion', 'area', 'tipo_inspeccion', 'etapa_deteccion', 'registrado_por']
      });
    }
    
    // Validar enums
    const validTipoInspeccion = ['ICT', 'FCT', 'Packing', 'Visual'];
    const validEtapaDeteccion = ['LQC', 'OQC'];
    
    if (!validTipoInspeccion.includes(tipo_inspeccion)) {
      return res.status(400).json({ 
        error: 'tipo_inspeccion inválido',
        valid: validTipoInspeccion
      });
    }
    
    if (!validEtapaDeteccion.includes(etapa_deteccion)) {
      return res.status(400).json({ 
        error: 'etapa_deteccion inválida',
        valid: validEtapaDeteccion
      });
    }
    
    // Generar ID único
    const id = `DEF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Usar la fecha del cliente si se proporciona, de lo contrario usar la del servidor
    const fechaRegistro = fecha || new Date().toISOString();
    
    console.log('📥 Fecha recibida del cliente:', fecha);
    console.log('🕐 Fecha que se registrará:', fechaRegistro);
    
    // Insertar en la base de datos con fecha del cliente
    const query = `
      INSERT INTO defect_data 
      (id, fecha, linea, codigo, defecto, ubicacion, area, modelo, tipo_inspeccion, etapa_deteccion, registrado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.execute(query, [
      id, fechaRegistro, linea, codigo, defecto, ubicacion, area, modelo || '',
      tipo_inspeccion, etapa_deteccion, registrado_por
    ]);
    
    res.status(201).json({ 
      success: true, 
      id: id,
      message: 'Defecto registrado exitosamente' 
    });
  } catch (error) {
    console.error('Error al guardar defecto:', error);
    res.status(500).json({ 
      error: 'Error al guardar el defecto', 
      details: error.message 
    });
  }
});

// Consultar defectos con filtros
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/defectos - Query params:', req.query);
    
    const { 
      fecha, 
      fechaInicio, 
      fechaFin, 
      linea, 
      codigo, 
      defecto, 
      ubicacion, 
      area,
      status,
      tipo_inspeccion,
      etapa_deteccion
    } = req.query;
    
    // Construir query dinámica
    let query = 'SELECT * FROM defect_data WHERE 1=1';
    const params = [];
    
    if (fecha) {
      query += ' AND DATE(fecha) = ?';
      params.push(fecha);
    }
    
    if (fechaInicio && fechaFin) {
      query += ' AND DATE(fecha) BETWEEN ? AND ?';
      params.push(fechaInicio, fechaFin);
    }
    
    if (linea) {
      query += ' AND linea = ?';
      params.push(linea);
    }
    
    if (codigo) {
      query += ' AND codigo LIKE ?';
      params.push(`%${codigo}%`);
    }
    
    if (defecto) {
      query += ' AND defecto LIKE ?';
      params.push(`%${defecto}%`);
    }
    
    if (ubicacion) {
      query += ' AND ubicacion LIKE ?';
      params.push(`%${ubicacion}%`);
    }
    
    if (area) {
      query += ' AND area = ?';
      params.push(area);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (tipo_inspeccion) {
      query += ' AND tipo_inspeccion = ?';
      params.push(tipo_inspeccion);
    }
    
    if (etapa_deteccion) {
      query += ' AND etapa_deteccion = ?';
      params.push(etapa_deteccion);
    }
    
    query += ' ORDER BY fecha DESC LIMIT 1000';
    
    console.log('📝 Query:', query);
    console.log('📝 Params:', params);
    
    const [rows] = await pool.execute(query, params);
    
    console.log('✅ Resultados encontrados:', rows.length);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al consultar defectos:', error);
    res.status(500).json({ 
      error: 'Error al consultar defectos', 
      details: error.message 
    });
  }
});

// Obtener un defecto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT * FROM defect_data WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Defecto no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al consultar defecto:', error);
    res.status(500).json({ 
      error: 'Error al consultar defecto', 
      details: error.message 
    });
  }
});

// Actualizar status de defecto
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatus = ['Pendiente_Reparacion', 'En_Reparacion', 'Reparado', 'Rechazado', 'Aprobado'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const query = 'UPDATE defect_data SET status = ? WHERE id = ?';
    const [result] = await pool.execute(query, [status, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Defecto no encontrado' });
    }
    
    res.json({ 
      success: true, 
      message: 'Status actualizado correctamente' 
    });
  } catch (error) {
    console.error('Error al actualizar status:', error);
    res.status(500).json({ 
      error: 'Error al actualizar status', 
      details: error.message 
    });
  }
});

module.exports = router;
