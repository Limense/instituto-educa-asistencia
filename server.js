const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'clave_temporal_desarrollo',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Cambiar a true en producción con HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Conexión a la base de datos
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite');
    }
});

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Middleware para verificar si es admin
const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado' });
    }
};

// Rutas principales
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    if (req.session.userId) {
        res.redirect('/');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

app.get('/admin', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API - Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    db.get('SELECT * FROM empleados WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        req.session.userId = user.id;
        req.session.userName = user.nombre;
        req.session.isAdmin = user.es_admin;

        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                nombre: user.nombre, 
                email: user.email,
                es_admin: user.es_admin 
            } 
        });
    });
});

// API - Obtener estadísticas del usuario
app.get('/api/mis-estadisticas', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const hoy = new Date().toISOString().split('T')[0];
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    const inicioMes = new Date();
    inicioMes.setDate(1);
    
    // Consultas paralelas para obtener estadísticas
    const queries = {
        hoy: new Promise((resolve) => {
            db.get(`SELECT 
                        CASE 
                            WHEN hora_entrada IS NOT NULL AND hora_salida IS NOT NULL THEN 'Completo'
                            WHEN hora_entrada IS NOT NULL THEN 'Trabajando'
                            ELSE 'Sin marcar'
                        END as estado
                    FROM asistencias 
                    WHERE empleado_id = ? AND fecha = ?`, 
                [userId, hoy], (err, row) => {
                    resolve(row ? row.estado : 'Sin marcar');
                });
        }),
        
        semana: new Promise((resolve) => {
            db.get(`SELECT COUNT(*) as dias 
                    FROM asistencias 
                    WHERE empleado_id = ? 
                    AND fecha >= ? 
                    AND hora_entrada IS NOT NULL`, 
                [userId, inicioSemana.toISOString().split('T')[0]], (err, row) => {
                    resolve(row ? row.dias : 0);
                });
        }),
        
        mes: new Promise((resolve) => {
            db.get(`SELECT COUNT(*) as dias 
                    FROM asistencias 
                    WHERE empleado_id = ? 
                    AND fecha >= ? 
                    AND hora_entrada IS NOT NULL`, 
                [userId, inicioMes.toISOString().split('T')[0]], (err, row) => {
                    resolve(row ? row.dias : 0);
                });
        }),
        
        promedio: new Promise((resolve) => {
            const hace3Meses = new Date();
            hace3Meses.setMonth(hace3Meses.getMonth() - 3);
            
            db.get(`SELECT 
                        COUNT(*) as total_dias,
                        COUNT(CASE WHEN hora_entrada IS NOT NULL THEN 1 END) as dias_trabajados
                    FROM asistencias 
                    WHERE empleado_id = ? 
                    AND fecha >= ?`, 
                [userId, hace3Meses.toISOString().split('T')[0]], (err, row) => {
                    if (row && row.total_dias > 0) {
                        const porcentaje = Math.round((row.dias_trabajados / row.total_dias) * 100);
                        resolve(porcentaje);
                    } else {
                        resolve(0);
                    }
                });
        })
    };
    
    Promise.all([queries.hoy, queries.semana, queries.mes, queries.promedio])
        .then(([hoy, semana, mes, promedio]) => {
            res.json({
                hoy,
                semana,
                mes,
                promedio
            });
        })
        .catch(err => {
            console.error('Error en estadísticas:', err);
            res.status(500).json({ error: 'Error al obtener estadísticas' });
        });
});

// API - Notificaciones para admin
app.get('/api/admin/notificaciones', requireAuth, requireAdmin, (req, res) => {
    const hoy = new Date().toISOString().split('T')[0];
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = ayer.toISOString().split('T')[0];
    
    // Empleados que no han marcado hoy
    db.all(`SELECT e.id, e.nombre, e.email 
            FROM empleados e 
            LEFT JOIN asistencias a ON e.id = a.empleado_id AND a.fecha = ?
            WHERE e.es_admin = 0 AND a.id IS NULL`, 
        [hoy], (err, sinMarcarHoy) => {
            if (err) {
                return res.status(500).json({ error: 'Error del servidor' });
            }
            
            // Empleados con asistencias incompletas ayer
            db.all(`SELECT e.nombre, e.email, a.hora_entrada 
                    FROM empleados e 
                    JOIN asistencias a ON e.id = a.empleado_id 
                    WHERE a.fecha = ? AND a.hora_entrada IS NOT NULL AND a.hora_salida IS NULL`, 
                [ayerStr], (err, incompletasAyer) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error del servidor' });
                    }
                    
                    res.json({
                        sinMarcarHoy: sinMarcarHoy || [],
                        incompletasAyer: incompletasAyer || [],
                        fecha: hoy
                    });
                });
        });
});

// API - Obtener información del usuario actual
app.get('/api/user-info', requireAuth, (req, res) => {
    db.get('SELECT id, nombre, email, es_admin FROM empleados WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            es_admin: user.es_admin
        });
    });
});

// API - Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.json({ success: true });
    });
});

// API - Marcar asistencia
app.post('/api/marcar-asistencia', requireAuth, (req, res) => {
    const { tipo } = req.body; // 'entrada' o 'salida'
    const userId = req.session.userId;
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toLocaleTimeString('es-ES');

    if (tipo === 'entrada') {
        // Verificar si ya marcó entrada hoy
        db.get('SELECT * FROM asistencias WHERE empleado_id = ? AND fecha = ? AND hora_entrada IS NOT NULL', 
            [userId, fecha], (err, existing) => {
            if (err) {
                return res.status(500).json({ error: 'Error del servidor' });
            }
            
            if (existing) {
                return res.status(400).json({ error: 'Ya marcaste entrada hoy' });
            }

            // Insertar nueva asistencia
            db.run('INSERT INTO asistencias (empleado_id, fecha, hora_entrada) VALUES (?, ?, ?)',
                [userId, fecha, hora], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Error al marcar entrada' });
                }
                res.json({ success: true, message: 'Entrada marcada correctamente', hora });
            });
        });
    } else if (tipo === 'salida') {
        // Actualizar con hora de salida
        db.run('UPDATE asistencias SET hora_salida = ? WHERE empleado_id = ? AND fecha = ? AND hora_entrada IS NOT NULL AND hora_salida IS NULL',
            [hora, userId, fecha], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error del servidor' });
            }
            
            if (this.changes === 0) {
                return res.status(400).json({ error: 'No hay entrada registrada hoy o ya marcaste salida' });
            }
            
            res.json({ success: true, message: 'Salida marcada correctamente', hora });
        });
    } else {
        res.status(400).json({ error: 'Tipo de marcación inválido' });
    }
});

// API - Obtener asistencias del usuario
app.get('/api/mis-asistencias', requireAuth, (req, res) => {
    const userId = req.session.userId;
    
    db.all(`SELECT fecha, hora_entrada, hora_salida, 
                   CASE 
                       WHEN hora_salida IS NULL THEN 'Incompleto'
                       ELSE 'Completo'
                   END as estado
            FROM asistencias 
            WHERE empleado_id = ? 
            ORDER BY fecha DESC 
            LIMIT 30`, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(rows);
    });
});

// API - Obtener estado de hoy
app.get('/api/estado-hoy', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const fecha = new Date().toISOString().split('T')[0];
    
    db.get('SELECT * FROM asistencias WHERE empleado_id = ? AND fecha = ?', 
        [userId, fecha], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        let estado = 'sin_marcar';
        if (row) {
            if (row.hora_entrada && row.hora_salida) {
                estado = 'completo';
            } else if (row.hora_entrada) {
                estado = 'trabajando';
            }
        }
        
        res.json({ estado, asistencia: row });
    });
});

// API Admin - Crear empleado
app.post('/api/admin/empleados', requireAuth, requireAdmin, async (req, res) => {
    const { nombre, email, password, es_admin = false } = req.body;
    
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run('INSERT INTO empleados (nombre, email, password, es_admin) VALUES (?, ?, ?, ?)',
            [nombre, email, hashedPassword, es_admin ? 1 : 0], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'El email ya está registrado' });
                }
                return res.status(500).json({ error: 'Error al crear empleado' });
            }
            
            res.json({ success: true, id: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// API Admin - Listar empleados
app.get('/api/admin/empleados', requireAuth, requireAdmin, (req, res) => {
    db.all('SELECT id, nombre, email, es_admin, created_at FROM empleados ORDER BY nombre', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(rows);
    });
});

// API Admin - Reporte de asistencias
app.get('/api/admin/reporte-asistencias', requireAuth, requireAdmin, (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    
    let query = `SELECT e.nombre, e.email, a.fecha, a.hora_entrada, a.hora_salida,
                        CASE 
                            WHEN a.hora_salida IS NULL AND a.hora_entrada IS NOT NULL THEN 'Incompleto'
                            WHEN a.hora_entrada IS NOT NULL AND a.hora_salida IS NOT NULL THEN 'Completo'
                            ELSE 'Sin registros'
                        END as estado
                 FROM empleados e
                 LEFT JOIN asistencias a ON e.id = a.empleado_id`;
    
    let params = [];
    
    if (fecha_inicio && fecha_fin) {
        query += ` WHERE a.fecha BETWEEN ? AND ?`;
        params = [fecha_inicio, fecha_fin];
    } else if (fecha_inicio) {
        query += ` WHERE a.fecha >= ?`;
        params = [fecha_inicio];
    }
    
    query += ` ORDER BY e.nombre, a.fecha DESC`;
    
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(rows);
    });
});

// Inicializar base de datos
function initDatabase() {
    db.serialize(() => {
        // Tabla empleados
        db.run(`CREATE TABLE IF NOT EXISTS empleados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            es_admin BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla asistencias
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

        console.log('Tablas de base de datos inicializadas');
    });
}

// Inicializar la aplicación
initDatabase();

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
