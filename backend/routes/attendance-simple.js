// Rutas de Asistencia Simplificado - Instituto Educa
const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/attendance - Versión simplificada
router.get('/', authenticate, async (req, res) => {
    try {        let attendanceQuery = `
            SELECT 
                a.id,
                a.user_id,
                a.date,
                a.clock_in,
                a.clock_out,
                a.hours_worked,
                a.status,
                a.created_at
            FROM attendance a
            ORDER BY a.date DESC, a.created_at DESC
            LIMIT 20
        `;
        
        const attendance = await query(attendanceQuery);
        
        res.json({
            success: true,
            data: attendance,
            total: attendance.length
        });
        
    } catch (error) {
        console.error('Error obteniendo asistencia:', error);
        res.status(500).json({
            error: 'Error de base de datos',
            message: error.message
        });
    }
});

module.exports = router;
