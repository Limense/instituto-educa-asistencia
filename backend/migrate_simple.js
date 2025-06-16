#!/usr/bin/env node

/**
 * Script de Migración Simple - Instituto Educa
 * Migración optimizada para MySQL
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

console.log(`
🎓 ======================================================
   INSTITUTO EDUCA - MIGRACIÓN SIMPLIFICADA
   Sistema de Control de Asistencia v2.0
======================================================
`);

async function migrate() {
    let connection;
    
    try {
        console.log('📋 Iniciando migración...\n');
        
        // 1. Configuración de conexión
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '248633'
        };
        
        console.log('1️⃣  Conectando a MySQL...');
        console.log(`   🔗 ${dbConfig.host}:${dbConfig.port} como ${dbConfig.user}`);
        
        // 2. Crear conexión inicial sin base de datos
        let tempConnection = await mysql.createConnection(dbConfig);
        console.log('   ✅ Conexión establecida');
        
        // 3. Crear base de datos
        console.log('\n2️⃣  Creando base de datos...');
        const dbName = process.env.DB_NAME || 'instituto_educa_asistencia';
        
        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`   ✅ Base de datos '${dbName}' creada`);
        
        // Cerrar conexión temporal
        await tempConnection.end();
        
        // 4. Conectar directamente a la base de datos
        dbConfig.database = dbName;
        connection = await mysql.createConnection(dbConfig);
        console.log('   ✅ Conectado a la base de datos');
        
        // 4. Crear tablas
        console.log('\n3️⃣  Creando tablas...');
        
        // Tabla users
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('administrator', 'supervisor', 'employee', 'guest') NOT NULL DEFAULT 'employee',
                active BOOLEAN DEFAULT TRUE,
                profile JSON,
                employment JSON,
                schedule JSON,
                permissions JSON,
                emergency_contact JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla users creada');
        
        // Tabla departments
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS departments (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                manager_id VARCHAR(50),
                budget DECIMAL(12,2),
                location VARCHAR(255),
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla departments creada');
        
        // Tabla attendance
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS attendance (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                clock_in TIMESTAMP NULL,
                clock_out TIMESTAMP NULL,
                break_start TIMESTAMP NULL,
                break_end TIMESTAMP NULL,
                status ENUM('present', 'absent', 'late', 'early_leave', 'sick', 'vacation', 'holiday') DEFAULT 'present',
                type ENUM('manual', 'automatic', 'imported') DEFAULT 'manual',
                location JSON,
                observations TEXT,
                approved_by VARCHAR(50),
                approved_at TIMESTAMP NULL,
                shift_id VARCHAR(50),
                hours_worked DECIMAL(4,2),
                overtime_hours DECIMAL(4,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_date (user_id, date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla attendance creada');
        
        // Tabla system_settings
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id VARCHAR(50) PRIMARY KEY,
                setting_key VARCHAR(255) UNIQUE NOT NULL,
                setting_value JSON,
                description TEXT,
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla system_settings creada');
        
        // 5. Crear usuario administrador
        console.log('\n4️⃣  Creando usuario administrador...');
        
        const adminId = 'admin-001';
        const adminPassword = await bcrypt.hash('admin123', 10);
        
        // Verificar si ya existe
        const [existingAdmin] = await connection.execute(
            'SELECT id FROM users WHERE username = ?',
            ['admin']
        );
        
        if (existingAdmin.length === 0) {
            await connection.execute(`
                INSERT INTO users (
                    id, username, password_hash, role, active,
                    profile, employment, permissions, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                adminId,
                'admin',
                adminPassword,
                'administrator',
                true,
                JSON.stringify({
                    firstName: 'Administrador',
                    lastName: 'Sistema',
                    email: 'admin@institutoeduca.pe',
                    phone: '999-999-999'
                }),
                JSON.stringify({
                    departmentId: 'admin-dept',
                    position: 'Administrador del Sistema',
                    employeeCode: 'ADM001',
                    startDate: new Date().toISOString().split('T')[0]
                }),
                JSON.stringify({
                    canManageUsers: true,
                    canManageAttendance: true,
                    canViewReports: true,
                    canManageSystem: true
                })
            ]);
            console.log('   ✅ Usuario administrador creado');
            console.log('   👤 Usuario: admin');
            console.log('   🔑 Contraseña: admin123');
        } else {
            console.log('   ✅ Usuario administrador ya existe');
        }
        
        // 6. Insertar configuraciones básicas
        console.log('\n5️⃣  Configuraciones del sistema...');
        
        const settings = [
            {
                id: 'set-001',
                key: 'system.name',
                value: JSON.stringify('Instituto Educa - Control de Asistencia'),
                description: 'Nombre del sistema',
                category: 'general'
            },
            {
                id: 'set-002',
                key: 'attendance.tolerance_minutes',
                value: JSON.stringify(15),
                description: 'Minutos de tolerancia para entrada',
                category: 'attendance'
            },
            {
                id: 'set-003',
                key: 'system.timezone',
                value: JSON.stringify('America/Lima'),
                description: 'Zona horaria del sistema',
                category: 'general'
            }
        ];
        
        for (const setting of settings) {
            const [existing] = await connection.execute(
                'SELECT id FROM system_settings WHERE setting_key = ?',
                [setting.key]
            );
            
            if (existing.length === 0) {
                await connection.execute(`
                    INSERT INTO system_settings (id, setting_key, setting_value, description, category, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                `, [setting.id, setting.key, setting.value, setting.description, setting.category]);
            }
        }
        console.log('   ✅ Configuraciones básicas insertadas');
        
        // 7. Verificar instalación
        console.log('\n6️⃣  Verificando instalación...');
        
        const [tables] = await connection.execute('SHOW TABLES');
        const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
        
        console.log(`   📋 Tablas creadas: ${tables.length}`);
        console.log(`   👥 Usuarios registrados: ${userCount[0].count}`);
        
        console.log('\n🎉 ¡Migración completada exitosamente!');
        console.log(`
📋 RESUMEN:
   ✅ Base de datos: ${dbName}
   ✅ Tablas: ${tables.length}
   ✅ Usuario admin creado
   
🚀 PRÓXIMOS PASOS:
   1. Reiniciar el backend: npm run dev
   2. Abrir frontend: http://localhost:9000
   3. Login: admin / admin123
        `);
        
    } catch (error) {
        console.error('\n❌ Error durante la migración:');
        console.error('   Mensaje:', error.message);
        console.error('   Código:', error.code || 'Unknown');
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n🔧 SOLUCIÓN:');
            console.error('   Verifica las credenciales MySQL en .env');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

migrate();
