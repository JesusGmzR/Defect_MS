const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear pool de conexiones
const resolvedHost = process.env.DB_HOST || 'localhost';
const resolvedPort = Number(process.env.DB_PORT) || 3306;

console.log('[DB] host:', resolvedHost);
console.log('[DB] port:', resolvedPort);
console.log('[DB] user:', process.env.DB_USER ? `${process.env.DB_USER}` : 'not-set');

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

// Verificar conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a MySQL');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error.message);
    return false;
  }
};

// Ejecutar test de conexión al iniciar
testConnection();

module.exports = pool;
