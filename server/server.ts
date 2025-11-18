import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';

// Cargar variables de entorno
dotenv.config();

// Importar rutas
import authRoutes from './routes/auth';
import defectosRoutes from './routes/defectos';
import modeloRoutes from './routes/modelo';
import repairsRoutes from './routes/repairs';
import qaRoutes from './routes/qa';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/defectos', defectosRoutes);
app.use('/api/modelo', modeloRoutes);
app.use('/api/repairs', repairsRoutes);
app.use('/api/qa', qaRoutes);

// Ruta de health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Manejo de errores
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Error del servidor:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor (solo en desarrollo, no en Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`✅ Base de datos: MySQL`);
    console.log(`✅ Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ TypeScript: Compilado correctamente`);
  });
}

// Exportar para Vercel
export default app;
