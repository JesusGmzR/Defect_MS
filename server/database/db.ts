import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la base de datos
const resolvedHost: string = process.env.DB_HOST || 'localhost';
const resolvedPort: number = Number(process.env.DB_PORT) || 3306;

console.log('[DB] host:', resolvedHost);
console.log('[DB] port:', resolvedPort);
console.log('[DB] user:', process.env.DB_USER ? `${process.env.DB_USER}` : 'not-set');

// Crear pool de conexiones con tipado
const pool = mysql.createPool({
  host: resolvedHost,
  port: resolvedPort,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'defect_ms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Verifica la conexión a la base de datos
 * @returns Promise<boolean> - true si la conexión es exitosa
 */
const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a MySQL');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', (error as Error).message);
    return false;
  }
};

// Ejecutar test de conexión al iniciar
testConnection();

export default pool;
