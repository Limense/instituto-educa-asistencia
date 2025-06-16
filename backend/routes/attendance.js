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

// GET /api/attendance/summary/:userId - Obtener resumen de asistencia
router.get('/summary/:userId?', asyncHandler(async (req, res) => {
    const userId = req.params.userId || req.user.id;
    
    // Verificar permisos: solo puede ver su propio resumen a menos que sea admin/supervisor
    if (userId !== req.user.id && !['administrator', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: 'No tienes permisos para ver este resumen'
        });
    }
    
    const today = moment().format('YYYY-MM-DD');
    const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
    
    // Estado de hoy
    const todayRecord = await query(
        'SELECT status FROM attendance WHERE user_id = ? AND DATE(created_at) = ?',
        [userId, today]
    );
    
    // Horas de esta semana
    const weekHours = await query(
        'SELECT COALESCE(SUM(total_hours), 0) as hours FROM attendance WHERE user_id = ? AND DATE(created_at) >= ?',
        [userId, startOfWeek]
    );
    
    // Horas de este mes
    const monthHours = await query(
        'SELECT COALESCE(SUM(total_hours), 0) as hours FROM attendance WHERE user_id = ? AND DATE(created_at) >= ?',
        [userId, startOfMonth]
    );
    
    // Tasa de asistencia del mes
    const monthRecords = await query(
        'SELECT COUNT(*) as total, SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present FROM attendance WHERE user_id = ? AND DATE(created_at) >= ?',
        [userId, startOfMonth]
    );
    
    const attendanceRate = monthRecords[0].total > 0 ? 
        Math.round((monthRecords[0].present / monthRecords[0].total) * 100) : 0;
    
    res.json({
        success: true,
        data: {
            todayStatus: todayRecord.length > 0 ? todayRecord[0].status : 'Sin registro',
            weekHours: parseFloat(weekHours[0].hours) || 0,
            monthHours: parseFloat(monthHours[0].hours) || 0,
            attendanceRate: attendanceRate
        }
    });
}));

// GET /api/attendance/recent/:userId - Obtener actividad reciente
router.get('/recent/:userId?', asyncHandler(async (req, res) => {
    const userId = req.params.userId || req.user.id;
    
    // Verificar permisos
    if (userId !== req.user.id && !['administrator', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: 'No tienes permisos para ver esta actividad'
        });
    }
    
    const recentActivity = await query(`
        SELECT 
            CASE 
                WHEN clock_in IS NOT NULL AND clock_out IS NULL THEN 'Entrada registrada'
                WHEN clock_out IS NOT NULL THEN 'Salida registrada'
                ELSE 'Registro de asistencia'
            END as description,
            CASE 
                WHEN clock_out IS NOT NULL THEN clock_out
                ELSE clock_in
            END as timestamp
        FROM attendance 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 5
    `, [userId]);
    
    res.json({
        success: true,
        data: recentActivity
    });
}));

// GET /api/attendance/user/:userId - Obtener registros de un usuario con filtros
router.get('/user/:userId', asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const { period = 'month' } = req.query;
    
    // Verificar permisos
    if (userId !== req.user.id && !['administrator', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: 'No tienes permisos para ver estos datos'
        });
    }
    
    let dateFilter = '';
    switch(period) {
        case 'today':
            dateFilter = 'DATE(created_at) = CURDATE()';
            break;
        case 'week':
            dateFilter = 'YEARWEEK(created_at) = YEARWEEK(NOW())';
            break;
        case 'month':
        default:
            dateFilter = 'YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())';
            break;
    }
    
    const attendanceRecords = await query(`
        SELECT 
            DATE(created_at) as date,
            clock_in,
            clock_out,
            total_hours as hours_worked,
            status
        FROM attendance 
        WHERE user_id = ? AND ${dateFilter}
        ORDER BY created_at DESC
    `, [userId]);
    
    res.json({
        success: true,
        data: attendanceRecords
    });
}));

// POST /api/attendance - Crear nuevo registro de asistencia (simplificado)
router.post('/', auditLog('CREATE_ATTENDANCE'), asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { date, clock_in, status = 'present', type = 'manual' } = req.body;
    
    // Verificar si ya existe un registro para esa fecha
    const existingRecord = await query(
        'SELECT id FROM attendance WHERE user_id = ? AND DATE(created_at) = ?',
        [userId, date]
    );
    
    if (existingRecord.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Ya existe un registro para esta fecha'
        });
    }
    
    // Crear nuevo registro
    const attendanceId = `att_${Date.now()}_${userId}`;
    await query(`
        INSERT INTO attendance (
            id, user_id, clock_in, status, created_at
        ) VALUES (?, ?, ?, ?, ?)
    `, [attendanceId, userId, clock_in, status, date]);
    
    res.json({
        success: true,
        message: 'Entrada registrada correctamente',
        data: { id: attendanceId, status, clock_in }
    });
}));

// PUT /api/attendance/clock-out - Actualizar salida
router.put('/clock-out', auditLog('UPDATE_CLOCK_OUT'), asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { date, clock_out } = req.body;
    
    // Buscar registro del día
    const existingRecord = await query(
        'SELECT id FROM attendance WHERE user_id = ? AND DATE(created_at) = ? AND clock_out IS NULL',
        [userId, date]
    );
    
    if (existingRecord.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No se encontró registro de entrada para actualizar'
        });
    }
    
    // Actualizar con salida
    await query(`
        UPDATE attendance 
        SET clock_out = ?,
            total_hours = TIMESTAMPDIFF(MINUTE, clock_in, ?) / 60,
            updated_at = NOW()
        WHERE id = ?
    `, [clock_out, clock_out, existingRecord[0].id]);
    
    res.json({
        success: true,
        message: 'Salida registrada correctamente'
    });
}));

module.exports = router;
