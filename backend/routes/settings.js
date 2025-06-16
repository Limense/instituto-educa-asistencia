// Rutas de Configuración - Instituto Educa
const express = require('express');
const { query } = require('../config/database');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/settings - Obtener configuración del sistema
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
    const settings = await query(`
        SELECT category, key_name, value, description
        FROM system_settings
        ORDER BY category, key_name
    `);
    
    // Organizar por categorías
    const organized = {};
    settings.forEach(setting => {
        if (!organized[setting.category]) {
            organized[setting.category] = {};
        }
        organized[setting.category][setting.key_name] = {
            value: typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value,
            description: setting.description
        };
    });
    
    res.json({
        success: true,
        settings: organized
    });
}));

// GET /api/settings/shifts - Obtener turnos
router.get('/shifts', asyncHandler(async (req, res) => {
    const shifts = await query(`
        SELECT * FROM shifts WHERE active = true ORDER BY name
    `);
    
    res.json({
        success: true,
        shifts
    });
}));

module.exports = router;
