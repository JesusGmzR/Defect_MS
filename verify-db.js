require('dotenv').config();
const db = require('./server/database/db');

async function verificarTablas() {
  try {
    console.log('🔍 Verificando estructura de base de datos...\n');
    
    // Verificar tablas
    const [tables] = await db.query('SHOW TABLES');
    console.log('📋 Tablas encontradas:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`   ${index + 1}. ${tableName}`);
    });
    
    console.log('\n✅ Verificación completada');
    
    // Cerrar conexión
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarTablas();
