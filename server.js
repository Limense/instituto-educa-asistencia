const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Importar configuración y middlewares
const database = require('./src/config/database');
const { requireAuth, requireAdmin } = require('./src/middleware/auth');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const employeeRoutes = require('./src/routes/employees');
const attendanceRoutes = require('./src/routes/attendances');

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

// Rutas principales de navegación
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    if (req.session.userId) {
        res.redirect('/');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
    }
});

app.get('/admin', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'admin.html'));
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendances', attendanceRoutes);

// Inicializar la aplicación
async function initializeApp() {
    try {
        // Conectar a la base de datos
        await database.connect();
        
        // Inicializar tablas
        await database.initTables();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📊 Panel admin: http://localhost:${PORT}/admin`);
            console.log(`📁 Base de datos: database/database.sqlite`);
        });
        
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        process.exit(1);
    }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\\n🛑 Cerrando servidor...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\\n🛑 Cerrando servidor...');
    await database.close();
    process.exit(0);
});

// Inicializar aplicación
initializeApp();

module.exports = app;
