// Rutas de Departamentos - Instituto Educa
const express = require('express');
const { query } = require('../config/database');
const { requireAdmin, requireSupervisor, auditLog } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/departments - Obtener lista de departamentos
router.get('/', requireSupervisor, asyncHandler(async (req, res) => {
    const { active = 'true' } = req.query;
    
    const departments = await query(`
        SELECT 
            d.*,
            u.username as manager_username,
            u.profile->>"$.firstName" as manager_first_name,
            u.profile->>"$.lastName" as manager_last_name,
            (SELECT COUNT(*) FROM users WHERE employment->>"$.departmentId" = d.id AND active = true) as employee_count
        FROM departments d
        LEFT JOIN users u ON d.manager_id = u.id
        WHERE d.active = ?
        ORDER BY d.name
    `, [active === 'true']);
    
    const formattedDepartments = departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        location: dept.location,
        budget: dept.budget,
        active: dept.active,
        manager: dept.manager_id ? {
            id: dept.manager_id,
            username: dept.manager_username,
            fullName: `${dept.manager_first_name || ''} ${dept.manager_last_name || ''}`.trim()
        } : null,
        employeeCount: dept.employee_count,
        createdAt: dept.created_at,
        updatedAt: dept.updated_at
    }));
    
    res.json({
        success: true,
        departments: formattedDepartments
    });
}));

// GET /api/departments/:id - Obtener departamento específico
router.get('/:id', requireSupervisor, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const departments = await query(`
        SELECT 
            d.*,
            u.username as manager_username,
            u.profile->>"$.firstName" as manager_first_name,
            u.profile->>"$.lastName" as manager_last_name
        FROM departments d
        LEFT JOIN users u ON d.manager_id = u.id
        WHERE d.id = ?
    `, [id]);
    
    if (departments.length === 0) {
        throw createError(404, 'Departamento no encontrado');
    }
    
    const dept = departments[0];
    
    // Obtener empleados del departamento
    const employees = await query(`
        SELECT 
            id,
            username,
            role,
            profile->>"$.firstName" as first_name,
            profile->>"$.lastName" as last_name,
            employment->>"$.position" as position,
            active
        FROM users
        WHERE employment->>"$.departmentId" = ? AND active = true
        ORDER BY role, username
    `, [id]);
    
    res.json({
        success: true,
        department: {
            id: dept.id,
            name: dept.name,
            description: dept.description,
            location: dept.location,
            budget: dept.budget,
            active: dept.active,
            manager: dept.manager_id ? {
                id: dept.manager_id,
                username: dept.manager_username,
                fullName: `${dept.manager_first_name || ''} ${dept.manager_last_name || ''}`.trim()
            } : null,
            employees: employees.map(emp => ({
                id: emp.id,
                username: emp.username,
                role: emp.role,
                fullName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                position: emp.position,
                active: emp.active
            })),
            createdAt: dept.created_at,
            updatedAt: dept.updated_at
        }
    });
}));

module.exports = router;
