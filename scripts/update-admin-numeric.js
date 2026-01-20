// Script para actualizar el usuario admin a credenciales numéricas
// Ejecutar con: node update-admin-numeric.js

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function updateAdminUser() {
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

        console.log('✅ Conectado a la base de datos');

        // Nuevas credenciales numéricas para el admin
        const newUsername = '2707';
        const newPassword = '2707';

        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Primero verificar si existe el usuario admin
        const [existingAdmin] = await connection.execute(
            'SELECT id, username FROM usuarios_dms WHERE username = ? OR rol = ?',
            ['admin', 'Admin']
        );

        if (existingAdmin.length > 0) {
            // Actualizar el usuario admin existente
            const adminId = existingAdmin[0].id;
            const oldUsername = existingAdmin[0].username;

            await connection.execute(
                `UPDATE usuarios_dms 
                 SET username = ?, password_hash = ?
                 WHERE id = ?`,
                [newUsername, hashedPassword, adminId]
            );

            console.log(`\n✅ Usuario admin actualizado:`);
            console.log(`   Username anterior: ${oldUsername}`);
            console.log(`   Nuevo username: ${newUsername}`);
            console.log(`   Nueva contraseña: ${newPassword}`);
        } else {
            // Crear nuevo usuario admin
            await connection.execute(
                `INSERT INTO usuarios_dms (username, password_hash, nombre_completo, rol, area, activo, fecha_creacion)
                 VALUES (?, ?, 'Administrador', 'Admin', 'Administración', 1, NOW())`,
                [newUsername, hashedPassword]
            );

            console.log(`\n✅ Usuario admin creado:`);
            console.log(`   Username: ${newUsername}`);
            console.log(`   Contraseña: ${newPassword}`);
        }

        console.log('\n================================');
        console.log('📋 CREDENCIALES DE ADMIN:');
        console.log(`   Usuario: ${newUsername}`);
        console.log(`   PIN: ${newPassword}`);
        console.log('================================\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar
updateAdminUser();
