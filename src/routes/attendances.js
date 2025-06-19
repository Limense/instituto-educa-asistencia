const express = require('express');
const AttendanceController = require('../controllers/AttendanceController');
const { requireApiAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const attendanceController = new AttendanceController();

// Rutas para asistencias
router.post('/entrada', requireApiAuth, (req, res) => attendanceController.markEntry(req, res));
router.post('/salida', requireApiAuth, (req, res) => attendanceController.markExit(req, res));
router.get('/hoy', requireApiAuth, (req, res) => attendanceController.getTodayStatus(req, res));
router.get('/mis-asistencias', requireApiAuth, (req, res) => attendanceController.getEmployeeAttendances(req, res));
router.get('/estadisticas', requireApiAuth, (req, res) => attendanceController.getMonthlyStats(req, res));

// Rutas admin
router.get('/todas', requireApiAuth, requireAdmin, (req, res) => attendanceController.getAllAttendances(req, res));

module.exports = router;
