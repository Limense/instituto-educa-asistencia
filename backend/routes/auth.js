// Rutas de Autenticación - Instituto Educa
const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const Joi = require('joi');

const router = express.Router();

// Esquemas de validación
const loginSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
        'string.alphanum': 'El usuario solo puede contener letras y números',
        'string.min': 'El usuario debe tener al menos 3 caracteres',
        'string.max': 'El usuario no puede tener más de 30 caracteres',
        'any.required': 'El usuario es requerido'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
        'any.required': 'La contraseña es requerida'
    })
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', asyncHandler(async (req, res) => {
    // Validar datos de entrada
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Datos inválidos',
            message: 'Por favor verifica los datos ingresados',
            details: error.details.map(detail => ({
                field: detail.path[0],
                message: detail.message
            }))
        });
    }
    
    const { username, password } = req.body;
    
    // Buscar usuario por username
    const users = await query(`
        SELECT 
            id, 
            username, 
            password_hash, 
            role, 
            active,
            profile,
            employment,
            last_login
        FROM users 
        WHERE username = ? AND active = true
    `, [username]);
    
    if (users.length === 0) {
        return res.status(401).json({
            error: 'Credenciales inválidas',
            message: 'Usuario o contraseña incorrectos'
        });
    }
    
    const user = users[0];
    
    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
        return res.status(401).json({
            error: 'Credenciales inválidas',
            message: 'Usuario o contraseña incorrectos'
        });
    }
    
    // Actualizar último login
    await query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
    );
    
    // Generar token JWT
    const token = generateToken(user);
    
    // Preparar datos del usuario para respuesta (sin contraseña)
    const userResponse = {
        id: user.id,
        username: user.username,
        role: user.role,
        profile: typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile,
        employment: typeof user.employment === 'string' ? JSON.parse(user.employment) : user.employment,
        lastLogin: user.last_login
    };
    
    res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        token,
        user: userResponse,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
}));

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', asyncHandler(async (req, res) => {
    // En JWT stateless, el logout se maneja en el frontend eliminando el token
    // Aquí podríamos agregar el token a una blacklist si fuera necesario
    
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
}));

// GET /api/auth/profile - Obtener perfil del usuario autenticado
router.get('/profile', require('../middleware/auth').authenticate, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const users = await query(`
        SELECT 
            u.id,
            u.username,
            u.role,
            u.active,
            u.profile,
            u.employment,
            u.schedule,
            u.permissions,
            u.emergency_contact,
            u.created_at,
            u.last_login,
            d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.employment->>'$.departmentId' = d.id
        WHERE u.id = ? AND u.active = true
    `, [userId]);
    
    if (users.length === 0) {
        throw createError(404, 'Usuario no encontrado');
    }
    
    const user = users[0];
    
    // Parsear campos JSON
    const userProfile = {
        id: user.id,
        username: user.username,
        role: user.role,
        active: user.active,
        profile: typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile,
        employment: typeof user.employment === 'string' ? JSON.parse(user.employment) : user.employment,
        schedule: typeof user.schedule === 'string' ? JSON.parse(user.schedule) : user.schedule,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
        emergencyContact: typeof user.emergency_contact === 'string' ? JSON.parse(user.emergency_contact) : user.emergency_contact,
        departmentName: user.department_name,
        createdAt: user.created_at,
        lastLogin: user.last_login
    };
    
    res.json({
        success: true,
        user: userProfile
    });
}));

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', require('../middleware/auth').authenticate, asyncHandler(async (req, res) => {
    const changePasswordSchema = Joi.object({
        currentPassword: Joi.string().required().messages({
            'any.required': 'La contraseña actual es requerida'
        }),
        newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
            'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
            'string.pattern.base': 'La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
            'any.required': 'La nueva contraseña es requerida'
        }),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
            'any.only': 'La confirmación de contraseña no coincide',
            'any.required': 'La confirmación de contraseña es requerida'
        })
    });
    
    const { error } = changePasswordSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Datos inválidos',
            message: 'Por favor verifica los datos ingresados',
            details: error.details.map(detail => ({
                field: detail.path[0],
                message: detail.message
            }))
        });
    }
    
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Obtener contraseña actual del usuario
    const users = await query(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
    );
    
    if (users.length === 0) {
        throw createError(404, 'Usuario no encontrado');
    }
    
    // Verificar contraseña actual
    const passwordMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    
    if (!passwordMatch) {
        return res.status(400).json({
            error: 'Contraseña incorrecta',
            message: 'La contraseña actual no es correcta'
        });
    }
    
    // Encriptar nueva contraseña
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Actualizar contraseña en la base de datos
    await query(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [newPasswordHash, userId]
    );
    
    res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
    });
}));

// GET /api/auth/verify - Verificar validez del token
router.get('/verify', require('../middleware/auth').authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'Token válido',
        user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        }
    });
});

module.exports = router;
