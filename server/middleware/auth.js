const jwt = require('jsonwebtoken');

// Middleware para verificar JWT
const verificarToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret-key-change-in-production'
    );
    
    // Agregar información del usuario a la request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    return res.status(500).json({ 
      error: 'Error al verificar token', 
      details: error.message 
    });
  }
};

// Middleware para verificar roles específicos
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'Acceso denegado', 
        message: `Esta acción requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}` 
      });
    }
    
    next();
  };
};

// Middleware para verificar que sea inspector LQC u OQC
const verificarInspector = (req, res, next) => {
  return verificarRol('Inspector_LQC', 'Inspector_OQC', 'Admin')(req, res, next);
};

// Middleware para verificar que sea técnico de reparación
const verificarTecnico = (req, res, next) => {
  return verificarRol('Tecnico_Reparacion', 'Admin')(req, res, next);
};

// Middleware para verificar que sea inspector QA
const verificarInspectorQA = (req, res, next) => {
  return verificarRol('Inspector_QA', 'Admin')(req, res, next);
};

// Middleware para verificar que sea administrador
const verificarAdmin = (req, res, next) => {
  return verificarRol('Admin')(req, res, next);
};

module.exports = {
  verificarToken,
  verificarRol,
  verificarInspector,
  verificarTecnico,
  verificarInspectorQA,
  verificarAdmin
};
