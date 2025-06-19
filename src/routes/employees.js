const express = require('express');
const EmployeeController = require('../controllers/EmployeeController');
const { requireApiAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const employeeController = new EmployeeController();

// Rutas para empleados (solo admin)
router.get('/', requireApiAuth, requireAdmin, (req, res) => employeeController.getAll(req, res));
router.post('/', requireApiAuth, requireAdmin, (req, res) => employeeController.create(req, res));
router.put('/:id', requireApiAuth, requireAdmin, (req, res) => employeeController.update(req, res));
router.delete('/:id', requireApiAuth, requireAdmin, (req, res) => employeeController.delete(req, res));

module.exports = router;
