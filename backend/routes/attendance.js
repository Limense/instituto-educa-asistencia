// Rutas de Asistencia - Instituto Educa
const express = require('express');
const { query, transaction } = require('../config/database');
const { requireSupervisor, auditLog } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const Joi = require('joi');
const moment = require('moment');

const router = express.Router();

// Esquemas de validación
const clockInSchema = Joi.object({
    location: Joi.object({
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional(),
        address: Joi.string().optional()
    }).optional(),
    shiftId: Joi.string().optional(),
    observations: Joi.string().max(500).optional()
});

const clockOutSchema = Joi.object({
    location: Joi.object({
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional(),
        address: Joi.string().optional()
    }).optional(),
    observations: Joi.string().max(500).optional()
});

// GET /api/attendance - Obtener registros de asistencia
router.get('/', asyncHandler(async (req, res) => {
    // Consulta simple por ahora
    let attendanceQuery = `
        SELECT 
            a.id,
            a.user_id,
            a.clock_in,
            a.clock_out,
            a.total_hours,
            a.status,
            a.created_at,
            u.username
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 20
    `;
    
    // Si no es administrador o supervisor, solo puede ver su propia asistencia
    if (req.user.role === 'employee') {
        attendanceQuery = `
            SELECT 
                a.id,
                a.user_id,
                a.clock_in,
                a.clock_out,
                a.total_hours,
                a.status,
                a.created_at,
                u.username
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC
            LIMIT 20
        `;
    }
    
    const attendance = req.user.role === 'employee' ? 
        await query(attendanceQuery, [req.user.id]) : 
        await query(attendanceQuery);
    
    res.json({
        success: true,
        attendance: attendance,
        pagination: {
            page: 1,
            limit: 20,
            total: attendance.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
        }
    });
}));

// POST /api/attendance/clock-in - Marcar entrada
router.post('/clock-in', auditLog('CLOCK_IN'), asyncHandler(async (req, res) => {
    const { error } = clockInSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Datos inválidos',
            details: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }
    
    const userId = req.user.id;
    const { location, shiftId, observations } = req.body;
    const today = moment().format('YYYY-MM-DD');
    
    // Verificar si ya marcó entrada hoy
    const existingRecord = await query(
        'SELECT id FROM attendance WHERE user_id = ? AND DATE(created_at) = ?',
        [userId, today]
    );
    
    if (existingRecord.length > 0) {
        return res.status(400).json({
            error: 'Ya existe un registro para hoy',
            message: 'Solo se permite un registro de entrada por día'
        });
    }
    
    // Crear registro de entrada
    const attendanceId = `att_${Date.now()}_${userId}`;
    await query(`
        INSERT INTO attendance (
            id, user_id, clock_in, status, created_at
        ) VALUES (?, ?, NOW(), 'present', NOW())
    `, [attendanceId, userId]);
    
    // Obtener el registro creado
    const newRecord = await query(
        'SELECT * FROM attendance WHERE id = ?',
        [attendanceId]
    );
    
    res.json({
        success: true,
        message: 'Entrada registrada exitosamente',
        attendance: newRecord[0]
    });
}));

// POST /api/attendance/clock-out - Marcar salida
router.post('/clock-out', auditLog('CLOCK_OUT'), asyncHandler(async (req, res) => {
    const { error } = clockOutSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Datos inválidos',
            details: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }
    
    const userId = req.user.id;
    const { location, observations } = req.body;
    const today = moment().format('YYYY-MM-DD');
    
    // Buscar registro de hoy sin salida
    const existingRecord = await query(
        'SELECT id FROM attendance WHERE user_id = ? AND DATE(created_at) = ? AND clock_out IS NULL',
        [userId, today]
    );
    
    if (existingRecord.length === 0) {
        return res.status(400).json({
            error: 'No se encontró registro de entrada',
            message: 'Debe marcar entrada antes de marcar salida'
        });
    }
    
    // Actualizar con salida
    await query(`
        UPDATE attendance 
        SET clock_out = NOW(),
            total_hours = TIMESTAMPDIFF(MINUTE, clock_in, NOW()) / 60,
            updated_at = NOW()
        WHERE id = ?
    `, [existingRecord[0].id]);
    
    // Obtener el registro actualizado
    const updatedRecord = await query(
        'SELECT * FROM attendance WHERE id = ?',
        [existingRecord[0].id]
    );
    
    res.json({
        success: true,
        message: 'Salida registrada exitosamente',
        attendance: updatedRecord[0]
    });
}));

// GET /api/attendance/today - Obtener registro de hoy
router.get('/today', asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const today = moment().format('YYYY-MM-DD');
    
    const todayRecord = await query(
        'SELECT * FROM attendance WHERE user_id = ? AND DATE(created_at) = ?',
        [userId, today]
    );
    
    res.json({
        success: true,
        attendance: todayRecord.length > 0 ? todayRecord[0] : null
    });
}));

module.exports = router;
