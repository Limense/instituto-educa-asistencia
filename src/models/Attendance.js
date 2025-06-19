const database = require('../config/database');

class Attendance {
    async getByEmployeeAndDate(empleadoId, fecha) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            db.get(
                'SELECT * FROM asistencias WHERE empleado_id = ? AND fecha = ?',
                [empleadoId, fecha],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    async markEntry(empleadoId, fecha, horaEntrada) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            db.run(
                'INSERT OR REPLACE INTO asistencias (empleado_id, fecha, hora_entrada) VALUES (?, ?, ?)',
                [empleadoId, fecha, horaEntrada],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID });
                    }
                }
            );
        });
    }

    async markExit(empleadoId, fecha, horaSalida) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            db.run(
                'UPDATE asistencias SET hora_salida = ? WHERE empleado_id = ? AND fecha = ?',
                [horaSalida, empleadoId, fecha],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                }
            );
        });
    }

    async getEmployeeAttendances(empleadoId, limit = 10) {
        return new Promise((resolve, reject) => {
            const db = database.getDatabase();
            db.all(
                `SELECT a.*, e.nombre as empleado_nombre 
                 FROM asistencias a 
                 JOIN empleados e ON a.empleado_id = e.id 
                 WHERE a.empleado_id = ? 
                 ORDER BY a.fecha DESC 
                 LIMIT ?`,
                [empleadoId, limit],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    async getMonthlyStats(empleadoId, year, month) {
        return new Promise((resolve, reject) => {
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

            const db = database.getDatabase();
            db.all(
                `SELECT COUNT(*) as dias_trabajados,
                        COUNT(CASE WHEN hora_entrada IS NOT NULL AND hora_salida IS NOT NULL THEN 1 END) as dias_completos
                 FROM asistencias 
                 WHERE empleado_id = ? AND fecha BETWEEN ? AND ?`,
                [empleadoId, startDate, endDate],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows[0] || { dias_trabajados: 0, dias_completos: 0 });
                    }
                }
            );
        });
    }

    async getAllAttendances(fechaInicio = null, fechaFin = null) {
        return new Promise((resolve, reject) => {
            let query = `SELECT e.id, e.nombre, e.email,
                               a.fecha, a.hora_entrada, a.hora_salida,
                               CASE 
                                   WHEN a.hora_entrada IS NOT NULL AND a.hora_salida IS NOT NULL THEN 'Completo'
                                   WHEN a.hora_entrada IS NOT NULL THEN 'Solo entrada'
                                   ELSE 'Sin registros'
                               END as estado
                        FROM empleados e
                        LEFT JOIN asistencias a ON e.id = a.empleado_id`;
            
            let params = [];
            
            if (fechaInicio && fechaFin) {
                query += ` WHERE a.fecha BETWEEN ? AND ?`;
                params = [fechaInicio, fechaFin];
            } else if (fechaInicio) {
                query += ` WHERE a.fecha >= ?`;
                params = [fechaInicio];
            }
            
            query += ` ORDER BY e.nombre, a.fecha DESC`;
            
            const db = database.getDatabase();
            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = Attendance;
