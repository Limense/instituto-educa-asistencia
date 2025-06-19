const database = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
    try {
        console.log('🔄 Inicializando base de datos...');
        
        // Conectar a la base de datos
        await database.connect();
        
        // Crear tablas
        await database.initTables();
        
        const db = database.getDatabase();
        
        // Verificar si ya existe un administrador
        const admin = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM empleados WHERE es_admin = 1', (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (admin) {
            console.log('✅ Ya existe un usuario administrador');
            console.log(`👤 Admin: ${admin.nombre} (${admin.email})`);
        } else {
            // Crear usuario administrador por defecto
            console.log('🔧 Creando usuario administrador por defecto...');
            
            const adminData = {
                nombre: 'Administrador',
                email: 'admin@instituto.edu',
                password: await bcrypt.hash('admin123', 10),
                es_admin: 1
            };

            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO empleados (nombre, email, password, es_admin) VALUES (?, ?, ?, ?)',
                    [adminData.nombre, adminData.email, adminData.password, adminData.es_admin],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            console.log('✅ Usuario administrador creado');
            console.log('📧 Email: admin@instituto.edu');
            console.log('🔑 Contraseña: admin123');
            console.log('⚠️  Recuerda cambiar la contraseña después del primer login');
        }

        // Crear algunos empleados de ejemplo si no existen
        const employeeCount = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM empleados WHERE es_admin = 0', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (employeeCount === 0) {
            console.log('🔧 Creando empleados de ejemplo...');
            
            const empleadosEjemplo = [
                { nombre: 'María García', email: 'maria@instituto.edu', password: 'empleado123' },
                { nombre: 'Juan Pérez', email: 'juan@instituto.edu', password: 'empleado123' },
                { nombre: 'Ana López', email: 'ana@instituto.edu', password: 'empleado123' }
            ];

            for (const emp of empleadosEjemplo) {
                const hashedPassword = await bcrypt.hash(emp.password, 10);
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT INTO empleados (nombre, email, password, es_admin) VALUES (?, ?, ?, 0)',
                        [emp.nombre, emp.email, hashedPassword],
                        function(err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                });
                console.log(`👤 Empleado creado: ${emp.nombre} (${emp.email})`);
            }
            
            console.log('🔑 Contraseña para todos los empleados: empleado123');
        }

        console.log('\\n✅ Base de datos inicializada correctamente');
        console.log('🗃️  Ubicación: database/database.sqlite');
        
    } catch (error) {
        console.error('❌ Error inicializando la base de datos:', error);
        process.exit(1);
    } finally {
        await database.close();
    }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
