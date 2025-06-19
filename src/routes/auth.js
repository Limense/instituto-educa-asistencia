const express = require('express');
const AuthController = require('../controllers/AuthController');
const { requireApiAuth } = require('../middleware/auth');

const router = express.Router();
const authController = new AuthController();

// Rutas de autenticación
router.post('/login', (req, res) => authController.login(req, res));
router.post('/logout', requireApiAuth, (req, res) => authController.logout(req, res));
router.get('/user', requireApiAuth, (req, res) => authController.getUserInfo(req, res));

module.exports = router;
