const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Buscar modelo por código
router.get('/', async (req, res) => {
  try {
    const { codigo } = req.query;
    
    if (!codigo || codigo.length < 9) {
      return res.json({ modelo: '' });
    }
    
    const codigoBusqueda = codigo.substring(0, 9);
    
    // Buscar en la tabla de defectos existente para obtener el modelo
    // (asumiendo que hay una tabla de catálogo de modelos o se puede inferir de defectos previos)
    const query = `
      SELECT modelo 
      FROM defect_data 
      WHERE codigo LIKE ? 
      AND modelo IS NOT NULL 
      AND modelo != ''
      LIMIT 1
    `;
    
    const [rows] = await db.execute(query, [`${codigoBusqueda}%`]);
    
    const modelo = rows.length > 0 ? rows[0].modelo : '';
    
    res.json({ modelo });
  } catch (error) {
    console.error('Error al buscar modelo:', error);
    res.status(500).json({ 
      error: 'Error al buscar modelo', 
      details: error.message 
    });
  }
});

// Crear o actualizar modelo (para catálogo)
router.post('/', async (req, res) => {
  try {
    const { codigo, modelo } = req.body;
    
    if (!codigo || !modelo) {
      return res.status(400).json({ error: 'Código y modelo son requeridos' });
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
      details: error.message 
    });
  }
});

module.exports = router;