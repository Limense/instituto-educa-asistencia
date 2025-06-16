#!/usr/bin/env node

/**
 * Script mejorado de migración - Instituto Educa
 * Ejecuta el script SQL completo desde Node.js
 */

const fs = require('fs');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

console.log(`
🎓 ======================================================
   INSTITUTO EDUCA - MIGRACIÓN COMPLETA v2.0
   Sistema de Control de Asistencia
======================================================
`);

async function executeSQL(connection, sql, description) {
    try {
        console.log(`📋 ${description}...`);
        const [result] = await connection.execute(sql);
        console.log(`   ✅ ${description} - Completado`);
        return result;
    } catch (error) {
        console.error(`   ❌ Error en ${description}:`, error.message);
        return null;
    }
}

async function migrateComplete() {
    let connection;
    
    try {
        console.log('🔧 Configurando migración completa...\n');
        
        // Configuración de conexión
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '248633',
            multipleStatements: true
        };
        
        console.log('1️⃣  Conectando a MySQL...');
        console.log(`   🔗 ${dbConfig.host}:${dbConfig.port} como ${dbConfig.user}`);
        
        // Conectar a MySQL
        connection = await mysql.createConnection(dbConfig);
        console.log('   ✅ Conexión establecida');
        
        // Crear base de datos
        console.log('\n2️⃣  Creando/actualizando base de datos...');
        const dbName = process.env.DB_NAME || 'instituto_educa_asistencia';
        
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.execute(`USE \`${dbName}\``);
        console.log(`   ✅ Base de datos '${dbName}' lista`);
        
        // Crear tablas principales
        console.log('\n3️⃣  Creando estructura de tablas...');
        
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
                last_login TIMESTAMP NULL,
                
                INDEX idx_username (username),
                INDEX idx_role (role),
                INDEX idx_active (active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla users');
        
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_name (name),
                INDEX idx_manager_id (manager_id),
                INDEX idx_active (active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla departments');
        
        // Tabla shifts
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS shifts (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                break_start TIME,
                break_end TIME,
                break_duration INT DEFAULT 0,
                tolerance_minutes INT DEFAULT 15,
                description TEXT,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_name (name),
                INDEX idx_active (active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla shifts');
        
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
                
                UNIQUE KEY unique_user_date (user_id, date),
                INDEX idx_user_id (user_id),
                INDEX idx_date (date),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla attendance');
        
        // Tabla holidays
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS holidays (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                type ENUM('national', 'local', 'company') DEFAULT 'national',
                description TEXT,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_date (date),
                INDEX idx_type (type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla holidays');
        
        // Tabla system_settings
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id VARCHAR(50) PRIMARY KEY,
                setting_key VARCHAR(255) UNIQUE NOT NULL,
                setting_value JSON,
                description TEXT,
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_setting_key (setting_key),
                INDEX idx_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla system_settings');
        
        // Tabla audit_log
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50),
                action VARCHAR(100) NOT NULL,
                table_name VARCHAR(100),
                record_id VARCHAR(50),
                old_values JSON,
                new_values JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_user_id (user_id),
                INDEX idx_action (action),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla audit_log');
        
        // Insertar usuarios de prueba
        console.log('\n4️⃣  Insertando datos de prueba...');
        
        // Hash de contraseñas
        const adminPassword = await bcrypt.hash('admin123', 10);
        const userPassword = await bcrypt.hash('123456', 10);
        
        // Usuarios
        await connection.execute(`
            INSERT IGNORE INTO users (id, username, password_hash, role, active, profile, employment, permissions) VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'admin-001',
            'admin',
            adminPassword,
            'administrator',
            true,
            JSON.stringify({
                firstName: 'Administrador',
                lastName: 'Sistema',
                email: 'admin@institutoeduca.pe',
                phone: '+51-999-999-999'
            }),
            JSON.stringify({
                departmentId: 'dept-admin',
                position: 'Administrador del Sistema',
                employeeCode: 'ADM001',
                startDate: '2025-01-01'
            }),
            JSON.stringify({
                canManageUsers: true,
                canManageAttendance: true,
                canViewReports: true,
                canManageSystem: true
            })
        ]);
        
        await connection.execute(`
            INSERT IGNORE INTO users (id, username, password_hash, role, active, profile, employment, permissions) VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'emp-001',
            'juan.perez',
            userPassword,
            'employee',
            true,
            JSON.stringify({
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@institutoeduca.pe',
                phone: '+51-987-654-321'
            }),
            JSON.stringify({
                departmentId: 'dept-education',
                position: 'Docente de Matemáticas',
                employeeCode: 'DOC001',
                startDate: '2025-02-01'
            }),
            JSON.stringify({
                canManageUsers: false,
                canManageAttendance: false,
                canViewReports: false,
                canManageSystem: false
            })
        ]);
        
        console.log('   ✅ Usuarios insertados');
        
        // Departamentos
        await connection.execute(`
            INSERT IGNORE INTO departments (id, name, description, manager_id, location, active) VALUES
            ('dept-admin', 'Administración', 'Departamento administrativo', 'admin-001', 'Oficina Principal', true),
            ('dept-education', 'Educación', 'Departamento académico', null, 'Aulas Piso 2', true)
        `);
        console.log('   ✅ Departamentos insertados');
        
        // Turnos
        await connection.execute(`
            INSERT IGNORE INTO shifts (id, name, start_time, end_time, break_start, break_end, break_duration, tolerance_minutes, active) VALUES
            ('shift-morning', 'Turno Mañana', '08:00:00', '16:00:00', '12:00:00', '13:00:00', 60, 15, true),
            ('shift-afternoon', 'Turno Tarde', '14:00:00', '22:00:00', '18:00:00', '19:00:00', 60, 15, true)
        `);
        console.log('   ✅ Turnos insertados');
        
        // Configuraciones del sistema
        await connection.execute(`
            INSERT IGNORE INTO system_settings (id, setting_key, setting_value, description, category) VALUES
            ('set-001', 'system.name', '"Instituto Educa - Control de Asistencia"', 'Nombre del sistema', 'general'),
            ('set-002', 'attendance.tolerance_minutes', '15', 'Minutos de tolerancia', 'attendance'),
            ('set-003', 'system.version', '"2.0.0"', 'Versión del sistema', 'general')
        `);
        console.log('   ✅ Configuraciones insertadas');
        
        // Verificar instalación
        console.log('\n5️⃣  Verificando instalación...');
        
        const [tables] = await connection.execute("SHOW TABLES");
        const [userCount] = await connection.execute("SELECT COUNT(*) as count FROM users");
        const [deptCount] = await connection.execute("SELECT COUNT(*) as count FROM departments");
        
        console.log(`   📋 Tablas creadas: ${tables.length}`);
        console.log(`   👥 Usuarios: ${userCount[0].count}`);
        console.log(`   🏢 Departamentos: ${deptCount[0].count}`);
        
        console.log('\n🎉 ¡Migración completa exitosa!');
        console.log('\n📋 CREDENCIALES DE ACCESO:');
        console.log('   👤 Admin: admin / admin123');
        console.log('   👤 Empleado: juan.perez / 123456');
        console.log('\n🚀 SERVIDORES:');
        console.log('   🖥️  Backend: http://localhost:3003');
        console.log('   🌐 Frontend: http://localhost:8888');
        console.log('   🏥 Health: http://localhost:3003/api/health');
        
    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar migración
migrateComplete().catch(console.error);
