// Entry point para Vercel Serverless Functions
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Crear instancia de Express
const app = express();

// Configuración CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const authRoutes = require('../server/routes/auth');
const defectosRoutes = require('../server/routes/defectos');
const modeloRoutes = require('../server/routes/modelo');
const repairsRoutes = require('../server/routes/repairs');
const qaRoutes = require('../server/routes/qa');

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/defectos', defectosRoutes);
app.use('/api/modelo', modeloRoutes);
app.use('/api/repairs', repairsRoutes);
app.use('/api/qa', qaRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    details: err.message 
  });
});

// Exportar para Vercel
module.exports = app;
