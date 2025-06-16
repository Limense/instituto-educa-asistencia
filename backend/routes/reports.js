// Rutas de Reportes - Instituto Educa
const express = require('express');
const { query } = require('../config/database');
const { requireSupervisor } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment');

const router = express.Router();

// GET /api/reports/attendance - Reporte de asistencia
router.get('/attendance', requireSupervisor, asyncHandler(async (req, res) => {
    const { 
        startDate = moment().startOf('month').format('YYYY-MM-DD'),
        endDate = moment().endOf('month').format('YYYY-MM-DD'),
        departmentId,
        userId
    } = req.query;
    
    let whereConditions = ['a.date BETWEEN ? AND ?'];
    let queryParams = [startDate, endDate];
    
    // Filtros adicionales
    if (departmentId) {
        whereConditions.push('u.employment->>"$.departmentId" = ?');
        queryParams.push(departmentId);
    }
    
    if (userId) {
        whereConditions.push('a.user_id = ?');
        queryParams.push(userId);
    }
    
    // Si es supervisor, solo datos de su departamento
    if (req.user.role === 'supervisor') {
        whereConditions.push(`u.employment->>"$.departmentId" IN (
            SELECT id FROM departments WHERE manager_id = ?
        )`);
        queryParams.push(req.user.id);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const attendanceData = await query(`
        SELECT 
            u.id as user_id,
            u.username,
            u.profile->>"$.firstName" as first_name,
            u.profile->>"$.lastName" as last_name,
            d.name as department_name,
            COUNT(a.id) as total_days,
            COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
            COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
            COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
            AVG(a.hours_worked) as avg_hours,
            SUM(a.hours_worked) as total_hours
        FROM users u
        LEFT JOIN attendance a ON u.id = a.user_id AND ${whereClause}
        LEFT JOIN departments d ON u.employment->>"$.departmentId" = d.id
        WHERE u.active = true
        GROUP BY u.id, u.username, u.profile, d.name
        ORDER BY d.name, u.username
    `, queryParams);
    
    res.json({
        success: true,
        report: {
            period: { startDate, endDate },
            data: attendanceData.map(record => ({
                userId: record.user_id,
                username: record.username,
                fullName: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
                departmentName: record.department_name,
                totalDays: record.total_days,
                presentDays: record.present_days,
                lateDays: record.late_days,
                absentDays: record.absent_days,
                avgHours: Math.round((record.avg_hours || 0) * 100) / 100,
                totalHours: Math.round((record.total_hours || 0) * 100) / 100,
                attendanceRate: record.total_days > 0 ? 
                    Math.round((record.present_days + record.late_days) / record.total_days * 100) : 0
            }))
        }
    });
}));

// GET /api/reports/summary - Resumen general
router.get('/summary', requireSupervisor, asyncHandler(async (req, res) => {
    const today = moment().format('YYYY-MM-DD');
    const thisMonth = moment().format('YYYY-MM');
    
    // Estadísticas básicas
    const stats = await Promise.all([
        // Total usuarios activos
        query('SELECT COUNT(*) as count FROM users WHERE active = true'),
        
        // Asistencia de hoy
        query(`SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN clock_in IS NOT NULL THEN 1 END) as checked_in,
            COUNT(CASE WHEN status = 'late' THEN 1 END) as late
        FROM attendance WHERE date = ?`, [today]),
        
        // Estadísticas del mes
        query(`SELECT 
            COUNT(DISTINCT user_id) as active_users,
            AVG(hours_worked) as avg_hours,
            COUNT(CASE WHEN status = 'absent' THEN 1 END) as total_absences
        FROM attendance WHERE date LIKE ?`, [`${thisMonth}%`])
    ]);
    
    res.json({
        success: true,
        summary: {
            totalUsers: stats[0][0].count,
            today: {
                total: stats[1][0].total,
                checkedIn: stats[1][0].checked_in,
                late: stats[1][0].late,
                attendanceRate: stats[1][0].total > 0 ? 
                    Math.round(stats[1][0].checked_in / stats[1][0].total * 100) : 0
            },
            thisMonth: {
                activeUsers: stats[2][0].active_users,
                avgHours: Math.round((stats[2][0].avg_hours || 0) * 100) / 100,
                totalAbsences: stats[2][0].total_absences
            }
        }
    });
}));

module.exports = router;
