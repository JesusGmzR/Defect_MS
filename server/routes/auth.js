const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', { username: req.body.username });
    const { username, password } = req.body;
    
    // Validar campos
    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }
    
    console.log('📊 Connecting to database...');
    // Buscar usuario
    const query = 'SELECT * FROM usuarios_dms WHERE username = ? AND activo = TRUE';
    const [rows] = await db.execute(query, [username]);
    
    console.log('📊 Query result:', rows.length, 'users found');
    
    if (rows.length === 0) {
      console.log('❌ User not found or inactive');
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    const user = rows[0];
    console.log('✅ User found:', user.username);
    
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    console.log('🔑 Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    // Actualizar último acceso
    await db.execute(
      'UPDATE usuarios_dms SET ultimo_acceso = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        rol: user.rol,
        area: user.area
      },
      process.env.JWT_SECRET || 'secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre_completo,
        rol: user.rol,
        area: user.area
      }
    });
    console.log('✅ Login successful');
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql
    });
    res.status(500).json({ 
      error: 'Error al iniciar sesión', 
      details: error.message 
    });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'secret-key-change-in-production'
    );
    
    // Verificar que el usuario siga activo
    const query = 'SELECT id, username, nombre_completo, rol, area FROM usuarios_dms WHERE id = ? AND activo = TRUE';
    const [rows] = await db.execute(query, [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no válido' });
    }
    
    res.json({
      success: true,
      user: rows[0]
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    console.error('Error al verificar token:', error);
    res.status(500).json({ 
      error: 'Error al verificar token', 
      details: error.message 
    });
  }
});

// Cambiar contraseña
router.post('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'secret-key-change-in-production'
    );
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }
    
    if (newPassword.length < 5) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 5 caracteres' });
    }
    
    // Obtener usuario
    const [rows] = await db.execute(
      'SELECT password_hash FROM usuarios_dms WHERE id = ?',
      [decoded.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña actual
    const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
    
    // Hash de nueva contraseña
    const newHash = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    await db.execute(
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
      details: error.message 
    });
  }
});

// Obtener perfil de usuario
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'secret-key-change-in-production'
    );
    
    const query = `
      SELECT id, username, nombre_completo, rol, area, fecha_creacion, ultimo_acceso
      FROM usuarios_dms 
      WHERE id = ? AND activo = TRUE
    `;
    const [rows] = await db.execute(query, [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ 
      error: 'Error al obtener perfil', 
      details: error.message 
    });
  }
});

module.exports = router;
