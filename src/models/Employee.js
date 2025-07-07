const bcrypt = require('bcryptjs');
const database = require('../config/database');

class Employee {
    async findByEmail(email) {
        return await database.getEmpleadoByEmail(email);
    }

    async findById(id) {
        if (database.getDatabaseType() === 'supabase') {
            const { data, error } = await database.getDatabase()
                .from('empleados')
                .select('*')
                .eq('id', id)
                .eq('activo', true)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } else {
            return new Promise((resolve, reject) => {
                const db = database.getDatabase();
                db.get('SELECT * FROM empleados WHERE id = ? AND activo = 1', [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
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

    async update(id, nombre, email, password = null, departamento = null) {
        if (database.getDatabaseType() === 'supabase') {
            const updateData = { nombre, email, departamento };
            
            if (password) {
                updateData.password = await bcrypt.hash(password, 10);
            }

            const { data, error } = await database.getDatabase()
                .from('empleados')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } else {
            return new Promise(async (resolve, reject) => {
                const db = database.getDatabase();
                
                let sql = 'UPDATE empleados SET nombre = ?, email = ?, departamento = ?';
                let params = [nombre, email, departamento];
                
                if (password) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    sql += ', password = ?';
                    params.push(hashedPassword);
                }
                
                sql += ' WHERE id = ?';
                params.push(id);
                
                db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ id, nombre, email, departamento });
                });
            });
        }
    }

    async delete(id) {
        if (database.getDatabaseType() === 'supabase') {
            const { error } = await database.getDatabase()
                .from('empleados')
                .update({ activo: false })
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } else {
            return new Promise((resolve, reject) => {
                const db = database.getDatabase();
                db.run('UPDATE empleados SET activo = 0 WHERE id = ?', [id], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                });
            });
        }
    }

    async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = Employee;
