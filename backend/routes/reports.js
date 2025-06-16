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

// GET /api/reports/:reportType - Generar reportes específicos
router.get('/:reportType', requireSupervisor, asyncHandler(async (req, res) => {
    const { reportType } = req.params;
    const { departmentId, userId } = req.query;
    
    let dateFilter, periodName;
    
    switch(reportType) {
        case 'daily':
            dateFilter = 'DATE(a.created_at) = CURDATE()';
            periodName = `Reporte Diario - ${moment().format('DD/MM/YYYY')}`;
            break;
        case 'weekly':
            dateFilter = 'YEARWEEK(a.created_at) = YEARWEEK(NOW())';
            periodName = `Reporte Semanal - Semana del ${moment().startOf('week').format('DD/MM')} al ${moment().endOf('week').format('DD/MM/YYYY')}`;
            break;
        case 'monthly':
        default:
            dateFilter = 'YEAR(a.created_at) = YEAR(NOW()) AND MONTH(a.created_at) = MONTH(NOW())';
            periodName = `Reporte Mensual - ${moment().format('MMMM YYYY')}`;
            break;
    }
    
    let whereConditions = [dateFilter];
    let queryParams = [];
    
    // Filtros adicionales
    if (departmentId) {
        whereConditions.push('u.department_id = ?');
        queryParams.push(departmentId);
    }
    
    if (userId) {
        whereConditions.push('a.user_id = ?');
        queryParams.push(userId);
    }
    
    // Si es supervisor, solo datos de su departamento
    if (req.user.role === 'supervisor') {
        whereConditions.push('u.department_id IN (SELECT id FROM departments WHERE manager_id = ?)');
        queryParams.push(req.user.id);
    }
    
    const whereClause = whereConditions.length > 1 ? 
        ` AND ${whereConditions.slice(1).join(' AND ')}` : '';
    
    // Obtener estadísticas del reporte
    const stats = await query(`
        SELECT 
            COUNT(DISTINCT u.id) as totalEmployees,
            COUNT(a.id) as totalRecords,
            COUNT(CASE WHEN a.status = 'present' THEN 1 END) as presentDays,
            COUNT(CASE WHEN a.status = 'late' THEN 1 END) as lateDays,
            COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absentDays,
            SUM(a.total_hours) as totalHours,
            AVG(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) * 100 as averageAttendance
        FROM users u
        LEFT JOIN attendance a ON u.id = a.user_id AND ${dateFilter}
        WHERE u.is_active = true ${whereClause}
    `, queryParams);
    
    // Obtener detalles por empleado
    const employeeDetails = await query(`
        SELECT 
            u.id,
            u.username,
            CONCAT(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.profile, '$.firstName')), ''), ' ', 
                   COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.profile, '$.lastName')), '')) as fullName,
            d.name as departmentName,
            COUNT(a.id) as totalDays,
            COUNT(CASE WHEN a.status = 'present' THEN 1 END) as presentDays,
            COUNT(CASE WHEN a.status = 'late' THEN 1 END) as lateDays,
            COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absentDays,
            SUM(a.total_hours) as totalHours
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN attendance a ON u.id = a.user_id AND ${dateFilter}
        WHERE u.is_active = true ${whereClause}
        GROUP BY u.id, u.username, fullName, d.name
        ORDER BY d.name, fullName
    `, queryParams);
    
    const reportData = {
        title: periodName,
        period: reportType,
        generatedAt: new Date().toISOString(),
        stats: {
            totalEmployees: stats[0]?.totalEmployees || 0,
            totalRecords: stats[0]?.totalRecords || 0,
            presentDays: stats[0]?.presentDays || 0,
            lateDays: stats[0]?.lateDays || 0,
            absentDays: stats[0]?.absentDays || 0,
            totalHours: Math.round((stats[0]?.totalHours || 0) * 100) / 100,
            averageAttendance: `${Math.round(stats[0]?.averageAttendance || 0)}%`
        },
        employees: employeeDetails.map(emp => ({
            id: emp.id,
            username: emp.username,
            fullName: emp.fullName?.trim() || emp.username,
            department: emp.departmentName || 'Sin departamento',
            totalDays: emp.totalDays || 0,
            presentDays: emp.presentDays || 0,
            lateDays: emp.lateDays || 0,
            absentDays: emp.absentDays || 0,
            totalHours: Math.round((emp.totalHours || 0) * 100) / 100,
            attendanceRate: emp.totalDays > 0 ? 
                Math.round(((emp.presentDays + emp.lateDays) / emp.totalDays) * 100) : 0
        }))
    };
    
    res.json({
        success: true,
        data: reportData
    });
}));

module.exports = router;
