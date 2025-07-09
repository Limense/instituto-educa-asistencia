const bcrypt = require('bcrypt');
const database = require('../config/database');

class Employee {
    async findByEmail(email) {
        return await database.getEmpleadoByEmail(email);
    }

    async findById(id) {
        const { data, error } = await database.getDatabase()
            .from('empleados')
            .select('*')
            .eq('id', id)
            .eq('activo', true)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async getAll() {
        return await database.getEmpleados();
    }

    async create(nombre, email, password, departamento = null, esAdmin = false) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const empleadoData = {
            nombre,
            email,
            password: hashedPassword,
            departamento,
            es_admin: esAdmin,
            activo: true
        };

        return await database.crearEmpleado(empleadoData);
    }

    async update(id, nombre, email, password = null, departamento = null, esAdmin = null) {
        const updateData = { nombre, email, departamento };
        
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Solo actualizar es_admin si se proporciona explícitamente
        if (esAdmin !== null) {
            updateData.es_admin = esAdmin;
        }

        const { data, error } = await database.getDatabase()
            .from('empleados')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async delete(id) {
        // Primero eliminar las asistencias relacionadas
        await database.getDatabase()
            .from('asistencias')
            .delete()
            .eq('empleado_id', id);
        
        // Luego eliminar el empleado
        const { error } = await database.getDatabase()
            .from('empleados')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return { changes: 1 };
    }

    async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = Employee;
