require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('✅ Conectado a la base de datos\n');

  // Obtener el usuario inspector_lqc
  const [users] = await connection.execute(
    'SELECT username, password_hash FROM usuarios_dms WHERE username = ?',
    ['inspector_lqc']
  );

  if (users.length === 0) {
    console.log('❌ Usuario no encontrado');
    await connection.end();
    return;
  }

  const user = users[0];
  console.log(`Usuario: ${user.username}`);
  console.log(`Password hash en BD: ${user.password_hash}\n`);

  // Probar contraseñas
  const testPasswords = ['test123', 'Test123', 'TEST123', 'admin123'];
  
  for (const pwd of testPasswords) {
    const isMatch = await bcrypt.compare(pwd, user.password_hash);
    console.log(`Probando "${pwd}": ${isMatch ? '✅ CORRECTA' : '❌ Incorrecta'}`);
  }

  // Generar nuevo hash para test123
  console.log('\n📝 Generando nuevo hash para "test123":');
  const newHash = await bcrypt.hash('test123', 10);
  console.log(`Nuevo hash: ${newHash}`);
  
  const testMatch = await bcrypt.compare('test123', newHash);
  console.log(`Verificación del nuevo hash: ${testMatch ? '✅ Funciona' : '❌ No funciona'}`);

  await connection.end();
}

testPassword().catch(console.error);
