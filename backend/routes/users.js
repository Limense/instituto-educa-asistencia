// Rutas de Usuarios - Instituto Educa
const express = require('express');
const bcrypt = require('bcrypt');
const { query, transaction } = require('../config/database');
const { requireAdmin, requireSupervisor, requireOwnershipOrAdmin, auditLog } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const Joi = require('joi');

const router = express.Router();

// Esquemas de validación
const createUserSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('administrator', 'supervisor', 'employee', 'guest').required(),
    profile: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().optional(),
        address: Joi.string().optional(),
        dateOfBirth: Joi.date().optional(),
        nationalId: Joi.string().optional()
    }).required(),
    employment: Joi.object({
        departmentId: Joi.string().required(),
        position: Joi.string().required(),
        hireDate: Joi.date().required(),
        salary: Joi.number().positive().optional(),
        status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
        contractType: Joi.string().optional()
    }).required(),
    schedule: Joi.object({
        shiftId: Joi.string().optional(),
        workDays: Joi.array().items(Joi.number().min(0).max(6)).optional(),
        flexibleHours: Joi.boolean().default(false)
    }).optional(),
    emergencyContact: Joi.object({
        name: Joi.string().required(),
        relationship: Joi.string().required(),
        phone: Joi.string().required(),
        email: Joi.string().email().optional()
    }).optional()
});

const updateUserSchema = createUserSchema.fork(['username', 'password'], (schema) => schema.optional());

// GET /api/users - Obtener lista de usuarios
router.get('/', requireSupervisor, asyncHandler(async (req, res) => {
    // Consulta simple sin filtros complejos por ahora
    const users = await query(`
        SELECT 
            id,
            username,
            role,
            active,
            created_at,
            last_login
        FROM users
        WHERE active = 1
        ORDER BY created_at DESC
        LIMIT 20
    `);
    
    res.json({
        success: true,
        users: users,
        pagination: {
            page: 1,
            limit: 20,
            total: users.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
        }
    });
    
    res.json({
        success: true,
        users: formattedUsers,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    });
}));

// GET /api/users/:id - Obtener usuario específico
router.get('/:id', requireOwnershipOrAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
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
            u.updated_at,
            u.last_login,
            d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.employment->>"$.departmentId" = d.id
        WHERE u.id = ?
    `, [id]);
    
    if (users.length === 0) {
        throw createError(404, 'Usuario no encontrado');
    }
    
    const user = users[0];
    
    const formattedUser = {
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
        updatedAt: user.updated_at,
        lastLogin: user.last_login
    };
    
    res.json({
        success: true,
        user: formattedUser
    });
}));

// POST /api/users - Crear nuevo usuario
router.post('/', requireAdmin, auditLog('CREATE_USER'), asyncHandler(async (req, res) => {
    const { error } = createUserSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Datos inválidos',
            message: 'Por favor verifica los datos ingresados',
            details: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }
    
    const { username, password, role, profile, employment, schedule, emergencyContact } = req.body;
    
    // Verificar que el departamento existe
    const departments = await query('SELECT id FROM departments WHERE id = ? AND active = true', [employment.departmentId]);
    if (departments.length === 0) {
        throw createError(400, 'El departamento especificado no existe o está inactivo');
    }
    
    // Encriptar contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Generar ID único
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Usar transacción para crear el usuario
    const result = await transaction(async (connection) => {
        await connection.execute(`
            INSERT INTO users (
                id, username, password_hash, role, active, 
                profile, employment, schedule, emergency_contact
            ) VALUES (?, ?, ?, ?, true, ?, ?, ?, ?)
        `, [
            userId,
            username,
            passwordHash,
            role,
            JSON.stringify(profile),
            JSON.stringify(employment),
            JSON.stringify(schedule || {}),
            JSON.stringify(emergencyContact || {})
        ]);
        
        return userId;
    });
    
    // Obtener el usuario creado
    const newUser = await query(`
        SELECT 
            u.id,
            u.username,
            u.role,
            u.active,
            u.profile,
            u.employment,
            u.created_at,
            d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.employment->>"$.departmentId" = d.id
        WHERE u.id = ?
    `, [userId]);
    
    const user = newUser[0];
    const formattedUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        active: user.active,
        profile: typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile,
        employment: typeof user.employment === 'string' ? JSON.parse(user.employment) : user.employment,
        departmentName: user.department_name,
        createdAt: user.created_at
    };
    
    res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        user: formattedUser
    });
}));

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', requireAdmin, auditLog('UPDATE_USER'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { error } = updateUserSchema.validate(req.body);
    
    if (error) {
        return res.status(400).json({
            error: 'Datos inválidos',
            message: 'Por favor verifica los datos ingresados',
            details: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }
    
    // Verificar que el usuario existe
    const existingUsers = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
        throw createError(404, 'Usuario no encontrado');
    }
    
    const updateData = req.body;
    const updateFields = [];
    const updateValues = [];
    
    // Campos permitidos para actualización
    if (updateData.role) {
        updateFields.push('role = ?');
        updateValues.push(updateData.role);
    }
    
    if (updateData.profile) {
        updateFields.push('profile = ?');
        updateValues.push(JSON.stringify(updateData.profile));
    }
    
    if (updateData.employment) {
        // Verificar que el departamento existe
        const departments = await query('SELECT id FROM departments WHERE id = ? AND active = true', [updateData.employment.departmentId]);
        if (departments.length === 0) {
            throw createError(400, 'El departamento especificado no existe o está inactivo');
        }
        
        updateFields.push('employment = ?');
        updateValues.push(JSON.stringify(updateData.employment));
    }
    
    if (updateData.schedule) {
        updateFields.push('schedule = ?');
        updateValues.push(JSON.stringify(updateData.schedule));
    }
    
    if (updateData.emergencyContact) {
        updateFields.push('emergency_contact = ?');
        updateValues.push(JSON.stringify(updateData.emergencyContact));
    }
    
    if (updateData.password) {
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(updateData.password, saltRounds);
        updateFields.push('password_hash = ?');
        updateValues.push(passwordHash);
    }
    
    if (updateFields.length === 0) {
        return res.status(400).json({
            error: 'No hay datos para actualizar',
            message: 'Debe proporcionar al menos un campo para actualizar'
        });
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    await query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    
    // Obtener usuario actualizado
    const updatedUser = await query(`
        SELECT 
            u.id,
            u.username,
            u.role,
            u.active,
            u.profile,
            u.employment,
            u.schedule,
            u.emergency_contact,
            u.updated_at,
            d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.employment->>"$.departmentId" = d.id
        WHERE u.id = ?
    `, [id]);
    
    const user = updatedUser[0];
    const formattedUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        active: user.active,
        profile: typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile,
        employment: typeof user.employment === 'string' ? JSON.parse(user.employment) : user.employment,
        schedule: typeof user.schedule === 'string' ? JSON.parse(user.schedule) : user.schedule,
        emergencyContact: typeof user.emergency_contact === 'string' ? JSON.parse(user.emergency_contact) : user.emergency_contact,
        departmentName: user.department_name,
        updatedAt: user.updated_at
    };
    
    res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        user: formattedUser
    });
}));

// DELETE /api/users/:id - Eliminar (desactivar) usuario
router.delete('/:id', requireAdmin, auditLog('DELETE_USER'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Verificar que el usuario existe
    const existingUsers = await query('SELECT id, username FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
        throw createError(404, 'Usuario no encontrado');
    }
    
    // No permitir eliminar el propio usuario
    if (id === req.user.id) {
        throw createError(400, 'No puedes eliminar tu propio usuario');
    }
    
    // Desactivar en lugar de eliminar (soft delete)
    await query('UPDATE users SET active = false, updated_at = NOW() WHERE id = ?', [id]);
    
    res.json({
        success: true,
        message: 'Usuario desactivado exitosamente'
    });
}));

// POST /api/users/:id/activate - Reactivar usuario
router.post('/:id/activate', requireAdmin, auditLog('ACTIVATE_USER'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Verificar que el usuario existe
    const existingUsers = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
        throw createError(404, 'Usuario no encontrado');
    }
    
    await query('UPDATE users SET active = true, updated_at = NOW() WHERE id = ?', [id]);
    
    res.json({
        success: true,
        message: 'Usuario reactivado exitosamente'
    });
}));

module.exports = router;
