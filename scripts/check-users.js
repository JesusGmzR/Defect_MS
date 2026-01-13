// Script para verificar usuarios en la base de datos
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkUsers() {
    let connection;
    
    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Conectado a la base de datos\n');

        // Consultar usuarios
        const [users] = await connection.query(
            'SELECT id, username, nombre_completo, rol, area, activo FROM usuarios_dms'
        );

        if (users.length === 0) {
            console.log('⚠️  No hay usuarios en la base de datos\n');
            console.log('💡 Ejecuta: node create-test-users.js para crear usuarios de prueba\n');
        } else {
            console.log('👥 Usuarios encontrados:\n');
            console.log('================================');
            users.forEach((user, index) => {
                console.log(`${index + 1}. Usuario: ${user.username}`);
                console.log(`   Nombre: ${user.nombre_completo}`);
                console.log(`   Rol: ${user.rol}`);
                console.log(`   Área: ${user.area}`);
                console.log(`   Activo: ${user.activo ? 'Sí' : 'No'}`);
                console.log('--------------------------------');
            });
            console.log('================================\n');
            console.log(`Total: ${users.length} usuarios\n`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkUsers();
