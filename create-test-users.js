// Script para crear usuarios de prueba en la base de datos
// Ejecutar con: node create-test-users.js

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createTestUsers() {
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

        // Usuarios de prueba con sus roles
        const testUsers = [
            {
                username: 'inspector_lqc',
                nombre_completo: 'Inspector LQC Test',
                contrasena: 'test123',
                rol: 'Inspector_LQC',
                area: 'LQC'
            },
            {
                username: 'inspector_oqc',
                nombre_completo: 'Inspector OQC Test',
                contrasena: 'test123',
                rol: 'Inspector_OQC',
                area: 'OQC'
            },
            {
                username: 'tecnico',
                nombre_completo: 'Técnico Reparación Test',
                contrasena: 'test123',
                rol: 'Tecnico_Reparacion',
                area: 'Reparación'
            },
            {
                username: 'inspector_qa',
                nombre_completo: 'Inspector QA Test',
                contrasena: 'test123',
                rol: 'Inspector_QA',
                area: 'QA'
            },
            {
                username: 'admin',
                nombre_completo: 'Administrador',
                contrasena: 'admin123',
                rol: 'Admin',
                area: 'Administración'
            }
        ];

        console.log('\n📝 Creando usuarios de prueba...\n');

        for (const user of testUsers) {
            try {
                // Hashear la contraseña
                const hashedPassword = await bcrypt.hash(user.contrasena, 10);

                // Insertar usuario (o actualizar si ya existe)
                const query = `
                    INSERT INTO usuarios_dms (username, password_hash, nombre_completo, rol, area, activo, fecha_creacion)
                    VALUES (?, ?, ?, ?, ?, 1, NOW())
                    ON DUPLICATE KEY UPDATE
                        password_hash = VALUES(password_hash),
                        nombre_completo = VALUES(nombre_completo),
                        rol = VALUES(rol),
                        area = VALUES(area),
                        activo = 1
                `;

                await connection.execute(query, [
                    user.username,
                    hashedPassword,
                    user.nombre_completo,
                    user.rol,
                    user.area
                ]);

                console.log(`✅ Usuario creado/actualizado: ${user.username} (${user.rol})`);
                console.log(`   Contraseña: ${user.contrasena}`);
                console.log(`   Nombre: ${user.nombre_completo}\n`);

            } catch (error) {
                console.error(`❌ Error creando usuario ${user.usuario}:`, error.message);
            }
        }

        console.log('\n✅ Proceso completado');
        console.log('\n📋 RESUMEN DE USUARIOS:');
        console.log('================================');
        testUsers.forEach(user => {
            console.log(`Usuario: ${user.username} | Contraseña: ${user.contrasena} | Rol: ${user.rol}`);
        });
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
createTestUsers();
