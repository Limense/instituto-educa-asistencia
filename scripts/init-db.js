const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Conectar a la base de datos
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log('Conectado a la base de datos SQLite');
    }
});

async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            // Crear tablas
            db.run(`CREATE TABLE IF NOT EXISTS empleados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                es_admin BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS asistencias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                empleado_id INTEGER NOT NULL,
                fecha DATE NOT NULL,
                hora_entrada TEXT,
                hora_salida TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (empleado_id) REFERENCES empleados (id),
                UNIQUE(empleado_id, fecha)
            )`);

            console.log('✅ Tablas creadas exitosamente');

            // Verificar si ya existe un administrador
            db.get('SELECT * FROM empleados WHERE es_admin = 1', async (err, admin) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (admin) {
                    console.log('✅ Ya existe un usuario administrador');
                    resolve();
                    return;
                }

                // Crear usuario administrador por defecto
                try {
                    const hashedPassword = await bcrypt.hash('admin123', 10);
                    
                    db.run('INSERT INTO empleados (nombre, email, password, es_admin) VALUES (?, ?, ?, ?)',
                        ['Administrador', 'admin@instituto.edu', hashedPassword, 1], 
                        function(err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            
                            console.log('✅ Usuario administrador creado:');
                            console.log('   Email: admin@instituto.edu');
                            console.log('   Contraseña: admin123');
                            console.log('   ⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');
                            
                            resolve();
                        });
                } catch (error) {
                    reject(error);
                }
            });
        });
    });
}

async function createSampleEmployee() {
    return new Promise(async (resolve, reject) => {
        // Verificar si ya existe empleado de prueba
        db.get('SELECT * FROM empleados WHERE email = ?', ['empleado@instituto.edu'], async (err, existing) => {
            if (err) {
                reject(err);
                return;
            }

            if (existing) {
                console.log('✅ Ya existe empleado de prueba');
                resolve();
                return;
            }

            // Crear empleado de prueba
            try {
                const hashedPassword = await bcrypt.hash('empleado123', 10);
                
                db.run('INSERT INTO empleados (nombre, email, password, es_admin) VALUES (?, ?, ?, ?)',
                    ['Juan Pérez', 'empleado@instituto.edu', hashedPassword, 0], 
                    function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        console.log('✅ Empleado de prueba creado:');
                        console.log('   Email: empleado@instituto.edu');
                        console.log('   Contraseña: empleado123');
                        
                        resolve();
                    });
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Ejecutar inicialización
async function main() {
    try {
        console.log('🚀 Inicializando base de datos...');
        
        await initializeDatabase();
        await createSampleEmployee();
        
        console.log('\n✅ Base de datos inicializada correctamente');
        console.log('\n📋 Cuentas disponibles:');
        console.log('   👨‍💼 Admin: admin@instituto.edu / admin123');
        console.log('   👤 Empleado: empleado@instituto.edu / empleado123');
        console.log('\n🎯 Puedes ejecutar: npm start');
        
        db.close((err) => {
            if (err) {
                console.error('Error al cerrar la base de datos:', err.message);
            }
            process.exit(0);
        });
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        process.exit(1);
    }
}

main();
