const bcrypt = require('bcryptjs');
const database = require('../config/database');

class Employee {
    async findByEmail(email) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            db.get('SELECT * FROM empleados WHERE email = ?', [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async findById(id) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            db.get('SELECT * FROM empleados WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async getAll() {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            db.all('SELECT id, nombre, email, es_admin, created_at FROM empleados ORDER BY nombre', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async create(nombre, email, password, esAdmin = false) {
        return new Promise(async (resolve, reject) => {
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                const db = database.getDatabase();
                db.run(
                    'INSERT INTO empleados (nombre, email, password, es_admin) VALUES (?, ?, ?, ?)',
                    [nombre, email, hashedPassword, esAdmin ? 1 : 0],
                    function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ id: this.lastID, nombre, email, es_admin: esAdmin });
                        }
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    async update(id, nombre, email, password = null) {
        return new Promise(async (resolve, reject) => {
            try {
                let query = 'UPDATE empleados SET nombre = ?, email = ?';
                let params = [nombre, email];

                if (password) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    query += ', password = ?';
                    params.push(hashedPassword);
                }

                query += ' WHERE id = ?';
                params.push(id);

                const db = database.getDatabase();
                db.run(query, params, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async delete(id) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            db.run('DELETE FROM empleados WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = Employee;
