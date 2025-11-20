// Vercel Serverless Function Handler
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Crear app de Express
const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas desde archivos .js compilados
const authRoutes = require('../server/routes/auth.js');
const defectosRoutes = require('../server/routes/defectos.js');
const modeloRoutes = require('../server/routes/modelo.js');
const repairsRoutes = require('../server/routes/repairs.js');
const qaRoutes = require('../server/routes/qa.js');

// Montar rutas con prefijo /api
app.use('/api/auth', authRoutes);
app.use('/api/defectos', defectosRoutes);
app.use('/api/modelo', modeloRoutes);
app.use('/api/repairs', repairsRoutes);
app.use('/api/qa', qaRoutes);

// Ruta de health check
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Defect Management System API',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Exportar como handler de Vercel
module.exports = app;
