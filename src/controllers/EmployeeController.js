const Employee = require('../models/Employee');

class EmployeeController {
    constructor() {
        this.employeeModel = new Employee();
    }

    async getAll(req, res) {
        try {
            const employees = await this.employeeModel.getAll();
            res.json(employees);
        } catch (error) {
            console.error('Error al obtener empleados:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }

    async create(req, res) {
        const { nombre, email, password, es_admin } = req.body;
        
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
        }

        try {
            const employee = await this.employeeModel.create(nombre, email, password, es_admin);
            res.status(201).json(employee);
        } catch (error) {
            console.error('Error al crear empleado:', error);
            if (error.code === '23505') {
                res.status(400).json({ error: 'El email ya está registrado' });
            } else {
                res.status(500).json({ error: 'Error del servidor' });
            }
        }
    }

    async update(req, res) {
        const { id } = req.params;
        const { nombre, email, password, es_admin } = req.body;
        
        if (!nombre || !email) {
            return res.status(400).json({ error: 'Nombre y email son requeridos' });
        }

        try {
            const result = await this.employeeModel.update(id, nombre, email, password, null, es_admin);
            if (result.changes === 0) {
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }
            res.json({ success: true });
        } catch (error) {
            console.error('Error al actualizar empleado:', error);
            if (error.code === '23505') {
                res.status(400).json({ error: 'El email ya está registrado' });
            } else {
                res.status(500).json({ error: 'Error del servidor' });
            }
        }
    }

    async delete(req, res) {
        const { id } = req.params;

        try {
            const result = await this.employeeModel.delete(id);
            if (result.changes === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            res.json({ success: true, message: 'Usuario eliminado exitosamente' });
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
}

module.exports = EmployeeController;
