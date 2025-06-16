// Middleware de Autenticación - Instituto Educa
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware principal de autenticación
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token de acceso requerido',
                message: 'Debes incluir un token válido en el header Authorization'
            });
        }
        
        const token = authHeader.substring(7); // Remover 'Bearer '
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Verificar que el usuario aún existe y está activo
            const users = await query(
                'SELECT id, username, role, active, last_login FROM users WHERE id = ? AND active = true',
                [decoded.userId]
            );
            
            if (users.length === 0) {
                return res.status(401).json({
                    error: 'Token inválido',
                    message: 'El usuario ya no existe o está inactivo'
                });
            }
            
            const user = users[0];
            
            // Agregar información del usuario al request
            req.user = {
                id: user.id,
                username: user.username,
                role: user.role,
                lastLogin: user.last_login
            };
            
            next();
            
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expirado',
                    message: 'Tu sesión ha expirado, por favor inicia sesión nuevamente'
                });
            }
            
            return res.status(401).json({
                error: 'Token inválido',
                message: 'El token proporcionado no es válido'
            });
        }
        
    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error al procesar la autenticación'
        });
    }
};

// Middleware para verificar roles específicos
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Usuario no autenticado',
                message: 'Debes estar autenticado para acceder a este recurso'
            });
        }
        
        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: `Tu rol '${userRole}' no tiene permisos para acceder a este recurso`,
                requiredRoles: allowedRoles
            });
        }
        
        next();
    };
};

// Middleware para verificar si es administrador
const requireAdmin = requireRole(['administrator']);

// Middleware para verificar si es supervisor o administrador
const requireSupervisor = requireRole(['administrator', 'supervisor']);

// Middleware para verificar que el usuario puede acceder a sus propios datos
const requireOwnershipOrAdmin = async (req, res, next) => {
    const requestedUserId = req.params.userId || req.params.id;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    
    // Los administradores pueden acceder a cualquier recurso
    if (currentUserRole === 'administrator') {
        return next();
    }
    
    // Los supervisores pueden acceder a recursos de empleados bajo su supervisión
    if (currentUserRole === 'supervisor') {
        try {
            // Verificar si el usuario solicitado es un empleado bajo supervisión
            const employees = await query(`
                SELECT u.id 
                FROM users u 
                JOIN departments d ON u.employment->>'$.departmentId' = d.id 
                WHERE d.manager_id = ? AND u.id = ? AND u.role = 'employee'
            `, [currentUserId, requestedUserId]);
            
            if (employees.length > 0) {
                return next();
            }
        } catch (error) {
            console.error('Error verificando supervisión:', error);
        }
    }
    
    // El usuario solo puede acceder a sus propios datos
    if (requestedUserId && requestedUserId !== currentUserId) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: 'Solo puedes acceder a tus propios datos'
        });
    }
    
    next();
};

// Middleware para logging de auditoría
const auditLog = (action) => {
    return async (req, res, next) => {
        // Guardar información original del response
        const originalSend = res.send;
        
        res.send = function(data) {
            // Registrar en auditoría solo si la respuesta es exitosa
            if (res.statusCode >= 200 && res.statusCode < 300) {
                setImmediate(async () => {
                    try {
                        await query(`
                            INSERT INTO audit_log (user_id, action, table_name, record_id, ip_address, user_agent) 
                            VALUES (?, ?, ?, ?, ?, ?)
                        `, [
                            req.user?.id || null,
                            action,
                            req.route?.path || req.path,
                            req.params?.id || null,
                            req.ip || req.connection.remoteAddress,
                            req.get('User-Agent') || ''
                        ]);
                    } catch (error) {
                        console.error('Error guardando log de auditoría:', error);
                    }
                });
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

// Función para generar tokens JWT
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id, 
            username: user.username, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
        }
    );
};

// Función para verificar token sin middleware (útil para rutas opcionales)
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    authenticate,
    requireRole,
    requireAdmin,
    requireSupervisor,
    requireOwnershipOrAdmin,
    auditLog,
    generateToken,
    verifyToken
};
