// Middleware de Manejo de Errores - Instituto Educa

const errorHandler = (err, req, res, next) => {
    console.error('Error capturado:', err);
    
    // Error de validación de Joi
    if (err.isJoi) {
        return res.status(400).json({
            error: 'Error de validación',
            message: 'Los datos proporcionados no son válidos',
            details: err.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }
    
    // Error de MySQL
    if (err.code) {
        switch (err.code) {
            case 'ER_DUP_ENTRY':
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'Ya existe un registro con estos datos',
                    sqlError: process.env.NODE_ENV === 'development' ? err.sqlMessage : undefined
                });
            
            case 'ER_NO_REFERENCED_ROW_2':
                return res.status(400).json({
                    error: 'Referencia inválida',
                    message: 'El registro referenciado no existe',
                    sqlError: process.env.NODE_ENV === 'development' ? err.sqlMessage : undefined
                });
            
            case 'ER_ROW_IS_REFERENCED_2':
                return res.status(409).json({
                    error: 'No se puede eliminar',
                    message: 'Este registro está siendo utilizado por otros elementos',
                    sqlError: process.env.NODE_ENV === 'development' ? err.sqlMessage : undefined
                });
            
            case 'ER_BAD_FIELD_ERROR':
                return res.status(400).json({
                    error: 'Campo inválido',
                    message: 'Uno o más campos no son válidos',
                    sqlError: process.env.NODE_ENV === 'development' ? err.sqlMessage : undefined
                });
            
            case 'ECONNREFUSED':
                return res.status(503).json({
                    error: 'Error de conexión',
                    message: 'No se puede conectar a la base de datos'
                });
            
            default:
                console.error('Error SQL no manejado:', err.code, err.sqlMessage);
                return res.status(500).json({
                    error: 'Error de base de datos',
                    message: 'Ocurrió un error al procesar la solicitud',
                    sqlError: process.env.NODE_ENV === 'development' ? err.sqlMessage : undefined
                });
        }
    }
    
    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Token inválido',
            message: 'El token de autenticación no es válido'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expirado',
            message: 'Tu sesión ha expirado, por favor inicia sesión nuevamente'
        });
    }
    
    // Error de validación de Express Validator
    if (err.type === 'validation') {
        return res.status(400).json({
            error: 'Error de validación',
            message: 'Los datos proporcionados no son válidos',
            details: err.errors
        });
    }
    
    // Error personalizado de la aplicación
    if (err.status || err.statusCode) {
        return res.status(err.status || err.statusCode).json({
            error: err.name || 'Error de aplicación',
            message: err.message
        });
    }
    
    // Error 404 - No encontrado
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'JSON inválido',
            message: 'El formato JSON de la solicitud no es válido'
        });
    }
    
    // Error genérico del servidor
    console.error('Error no manejado:', err);
    
    return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Ocurrió un error inesperado en el servidor',
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err.message
        })
    });
};

// Middleware para capturar errores 404
const notFound = (req, res, next) => {
    const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

// Función para crear errores personalizados
const createError = (status, message, details = null) => {
    const error = new Error(message);
    error.status = status;
    if (details) {
        error.details = details;
    }
    return error;
};

// Wrapper para funciones async para capturar errores automáticamente
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Validador de datos de entrada
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            error.isJoi = true;
            return next(error);
        }
        next();
    };
};

module.exports = {
    errorHandler,
    notFound,
    createError,
    asyncHandler,
    validateRequest
};
