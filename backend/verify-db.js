#!/usr/bin/env node

/**
 * Verificación rápida de la base de datos
 */

const { testConnection, checkTables, getStats } = require('./config/database');

async function verifyDatabase() {
    console.log('🔍 Verificando estado de la base de datos...\n');
    
    try {
        // Probar conexión
        const connected = await testConnection();
        if (!connected) {
            console.log('❌ No se pudo conectar a la base de datos');
            return;
        }
        
        // Verificar tablas
        console.log('📋 Verificando tablas...');
        const tableInfo = await checkTables();
        if (tableInfo) {
            console.log('   ✅ Tablas existentes:', tableInfo.existing.length);
            console.log('   📝 Tablas encontradas:', tableInfo.existing.join(', '));
            
            if (tableInfo.missing.length > 0) {
                console.log('   ⚠️  Tablas faltantes:', tableInfo.missing.join(', '));
            }
        }
        
        // Obtener estadísticas
        console.log('\n📊 Estadísticas de la base de datos...');
        const stats = await getStats();
        if (stats) {
            console.log('   👥 Usuarios:', stats.users);
            console.log('   📅 Asistencia reciente:', stats.recentAttendance);
            console.log('   🏢 Departamentos:', stats.departments);
            console.log('   ⏰ Turnos:', stats.shifts);
            console.log('   🔗 Conexiones activas:', stats.activeConnections);
        }
        
        console.log('\n✅ Verificación completada');
        
    } catch (error) {
        console.error('❌ Error durante la verificación:', error.message);
    }
}

// Ejecutar verificación
verifyDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error fatal:', error);
        process.exit(1);
    });
