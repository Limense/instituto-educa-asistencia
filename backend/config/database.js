// Configuración de Base de Datos MySQL - Instituto Educa
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'instituto_educa_asistencia',
    charset: 'utf8mb4',
    timezone: '+00:00',
    connectionLimit: 10,
    queueLimit: 0,
    // Configuraciones de reconexión y timeout válidas
    idleTimeout: 60000,
    acquireTimeout: 60000
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        console.log(`📊 Base de datos: ${dbConfig.database}`);
        console.log(`🌐 Host: ${dbConfig.host}:${dbConfig.port}`);
        
        // Probar una consulta simple
        const [rows] = await connection.execute('SELECT 1 as test');
        connection.release();
        
        return true;
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        return false;
    }
};

// Función para ejecutar consultas con manejo de errores
const query = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Error en consulta SQL:', error.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        throw error;
    }
};

// Función para transacciones
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Función para obtener estadísticas de la base de datos
const getStats = async () => {
    try {
        const stats = {};
        
        // Contar registros en tablas principales
        stats.users = await query('SELECT COUNT(*) as count FROM users WHERE active = true');
        stats.attendance = await query('SELECT COUNT(*) as count FROM attendance WHERE date >= CURDATE() - INTERVAL 30 DAY');
        stats.departments = await query('SELECT COUNT(*) as count FROM departments WHERE active = true');
        stats.shifts = await query('SELECT COUNT(*) as count FROM shifts WHERE active = true');
        
        // Estadísticas de conexiones
        const [processlist] = await pool.execute('SHOW PROCESSLIST');
        stats.connections = processlist.length;
        
        return {
            users: stats.users[0].count,
            recentAttendance: stats.attendance[0].count,
            departments: stats.departments[0].count,
            shifts: stats.shifts[0].count,
            activeConnections: stats.connections
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error.message);
        return null;
    }
};

// Función para verificar si las tablas existen
const checkTables = async () => {
    try {
        const tables = await query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? 
            ORDER BY TABLE_NAME
        `, [dbConfig.database]);
        
        const requiredTables = ['users', 'departments', 'attendance', 'shifts', 'holidays', 'system_settings', 'audit_log'];
        const existingTables = tables.map(t => t.TABLE_NAME);
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        return {
            existing: existingTables,
            missing: missingTables,
            isComplete: missingTables.length === 0
        };
    } catch (error) {
        console.error('Error verificando tablas:', error.message);
        return null;
    }
};

// Función para obtener información del esquema
const getSchemaInfo = async () => {
    try {
        const info = await query(`
            SELECT 
                TABLE_NAME,
                TABLE_ROWS,
                DATA_LENGTH,
                INDEX_LENGTH,
                CREATE_TIME
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ?
            ORDER BY TABLE_NAME
        `, [dbConfig.database]);
        
        return info;
    } catch (error) {
        console.error('Error obteniendo información del esquema:', error.message);
        return null;
    }
};

// Inicializar conexión al iniciar
testConnection();

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    getStats,
    checkTables,
    getSchemaInfo,
    config: dbConfig
};
