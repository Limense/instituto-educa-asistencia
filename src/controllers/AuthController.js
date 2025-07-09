const Employee = require('../models/Employee');

class AuthController {
    constructor() {
        this.employeeModel = new Employee();
    }

    async login(req, res) {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        try {
            const user = await this.employeeModel.findByEmail(email);
            
            if (!user) {
                return res.status(401).json({ error: 'Credenciales incorrectas' });
            }

            const isValidPassword = await this.employeeModel.validatePassword(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Credenciales incorrectas' });
            }

            req.session.userId = user.id;
            req.session.userName = user.nombre;
            req.session.isAdmin = user.es_admin === true;

            res.json({ 
                success: true, 
                user: { 
                    id: user.id, 
                    nombre: user.nombre, 
                    email: user.email, 
                    es_admin: user.es_admin === true 
                } 
            });
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }

    logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al cerrar sesión' });
            }
            res.json({ success: true });
        });
    }

    getUserInfo(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        res.json({
            id: req.session.userId,
            nombre: req.session.userName,
            es_admin: req.session.isAdmin
        });
    }
}

module.exports = AuthController;
