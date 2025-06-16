// Rutas de Usuarios Simplificado - Instituto Educa
const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Versión simplificada que funciona
router.get('/', authenticate, async (req, res) => {
    try {
        // Consulta muy simple sin filtros complejos
        const users = await query(`
            SELECT 
                u.id,
                u.username,
                u.role,
                u.profile,
                u.employment,
                u.active,
                u.created_at,
                u.last_login
            FROM users u
            WHERE u.active = 1
            ORDER BY u.created_at DESC
            LIMIT 20
        `);
          res.json({
            success: true,
            data: users.map(user => {
                let profile = null;
                let employment = null;
                
                try {
                    profile = user.profile ? JSON.parse(user.profile) : null;
                } catch (e) {
                    console.warn('Error parsing profile JSON for user', user.id);
                }
                
                try {
                    employment = user.employment ? JSON.parse(user.employment) : null;
                } catch (e) {
                    console.warn('Error parsing employment JSON for user', user.id);
                }
                
                return {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    profile: profile,
                    employment: employment,
                    active: user.active,
                    created_at: user.created_at,
                    last_login: user.last_login
                };
            }),
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
