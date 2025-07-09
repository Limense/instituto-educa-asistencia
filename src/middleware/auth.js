// Middleware de autenticación
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

// Middleware para requerir autenticación en API
function requireApiAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ 
            error: 'Acceso no autorizado',
            message: 'Debes iniciar sesión para acceder a este recurso'
        });
    }
    next();
}

// Middleware para requerir rol de administrador
function requireAdmin(req, res, next) {
    if (!req.session.isAdmin) {
        return res.status(403).json({ 
            error: 'Acceso denegado',
            message: 'Se requieren permisos de administrador'
        });
    }
    next();
}

// Middleware para verificar que el usuario está activo
function requireActiveUser(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ 
            error: 'Acceso no autorizado',
            message: 'Debes iniciar sesión'
        });
    }
    
    // Verificar si el usuario sigue activo en la base de datos
    const database = require('../config/database');
    
    database.getEmpleados()
        .then(empleados => {
            const usuario = empleados.find(emp => emp.id === req.session.userId);
            if (!usuario || !usuario.activo) {
                req.session.destroy();
                return res.status(401).json({ 
                    error: 'Cuenta inactiva',
                    message: 'Tu cuenta ha sido desactivada'
                });
            }
            next();
        })
        .catch(error => {
            console.error('Error verificando usuario activo:', error);
            res.status(500).json({ 
                error: 'Error del servidor',
                message: 'No se pudo verificar el estado de la cuenta'
            });
        });
}

module.exports = {
    requireAuth,
    requireApiAuth,
    requireAdmin,
    requireActiveUser
};
