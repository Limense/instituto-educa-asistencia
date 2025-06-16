const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/test-users - Endpoint simple para probar
router.get('/', authenticate, async (req, res) => {
    try {
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
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: users,
            total: users.length
        });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({
            error: 'Error de base de datos',
            message: error.message
        });
    }
});

module.exports = router;
