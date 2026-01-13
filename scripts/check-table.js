// Verificar estructura de la tabla usuarios_dms
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    
    const [rows] = await conn.query('DESCRIBE usuarios_dms');
    console.log('Estructura de usuarios_dms:');
    console.log('==========================');
    rows.forEach(r => {
        console.log(`${r.Field.padEnd(20)} ${r.Type.padEnd(20)} ${r.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${r.Key}`);
    });
    
    await conn.end();
})();
