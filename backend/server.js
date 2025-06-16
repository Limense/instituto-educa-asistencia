// Servidor Express.js - Instituto Educa
// Sistema de Control de Asistencia v2.0

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const departmentRoutes = require('./routes/departments');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');

// Importar middlewares
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3002;

// =====================================================
// MIDDLEWARES GLOBALES
// =====================================================

// Seguridad
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8888',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutos
    max: process.env.RATE_LIMIT_MAX || 100, // máximo 100 requests por ventana
    message: {
        error: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.'
    }
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compresión
app.use(compression());

// =====================================================
// RUTAS DE LA API
// =====================================================

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Instituto Educa API funcionando correctamente',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rutas de autenticación (sin protección)
app.use('/api/auth', authRoutes);

// Rutas protegidas
app.use('/api/users', authenticate, userRoutes);
app.use('/api/attendance', authenticate, attendanceRoutes);
app.use('/api/departments', authenticate, departmentRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/settings', authenticate, settingsRoutes);

// Ruta para servir archivos estáticos (si es necesario)
app.use('/uploads', express.static('uploads'));

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Ruta no encontrada
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        message: `La ruta ${req.originalUrl} no existe en este servidor.`,
        availableEndpoints: [
            'GET /api/health',
            'POST /api/auth/login',
            'POST /api/auth/logout',
            'GET /api/users',
            'GET /api/attendance',
            'GET /api/departments',
            'GET /api/reports',
            'GET /api/settings'
        ]
    });
});

// Middleware de manejo de errores
app.use(errorHandler);

// =====================================================
// INICIO DEL SERVIDOR
// =====================================================

// Manejar cierre graceful
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM recibido, cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT recibido, cerrando servidor...');
    process.exit(0);
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`
    🚀 Servidor Instituto Educa iniciado exitosamente
    
    📍 Puerto: ${PORT}
    🌍 Entorno: ${process.env.NODE_ENV || 'development'}
    🔗 URL: http://localhost:${PORT}
    🏥 Health check: http://localhost:${PORT}/api/health
    
    📚 Endpoints disponibles:
    - POST /api/auth/login
    - GET /api/users
    - GET /api/attendance
    - GET /api/departments
    - GET /api/reports
    - GET /api/settings
    
    ⏰ ${new Date().toLocaleString()}
    `);
});

// Exportar para testing
module.exports = { app, server };
