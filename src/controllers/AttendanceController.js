const Attendance = require('../models/Attendance');

class AttendanceController {
    constructor() {
        this.attendanceModel = new Attendance();
    }

    async markEntry(req, res) {
        // Verificar que el usuario no sea administrador
        if (req.session.isAdmin) {
            return res.status(403).json({ error: 'Los administradores no pueden marcar asistencia' });
        }

        const empleadoId = req.session.userId;
        const fecha = new Date().toISOString().split('T')[0];
        const horaEntrada = new Date().toLocaleTimeString('es-ES', { hour12: false });

        try {
            const existingRecord = await this.attendanceModel.getByEmployeeAndDate(empleadoId, fecha);
            
            if (existingRecord && existingRecord.hora_entrada) {
                return res.status(400).json({ error: 'Ya has marcado entrada hoy' });
            }

            await this.attendanceModel.markEntry(empleadoId, fecha, horaEntrada);
            res.json({ success: true, message: 'Entrada marcada correctamente', hora: horaEntrada });
        } catch (error) {
            console.error('Error al marcar entrada:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }

    async markExit(req, res) {
        // Verificar que el usuario no sea administrador
        if (req.session.isAdmin) {
            return res.status(403).json({ error: 'Los administradores no pueden marcar asistencia' });
        }

        const empleadoId = req.session.userId;
        const fecha = new Date().toISOString().split('T')[0];
        const horaSalida = new Date().toLocaleTimeString('es-ES', { hour12: false });

        try {
            const existingRecord = await this.attendanceModel.getByEmployeeAndDate(empleadoId, fecha);
            
            if (!existingRecord || !existingRecord.hora_entrada) {
                return res.status(400).json({ error: 'Primero debes marcar entrada' });
            }

            if (existingRecord.hora_salida) {
                return res.status(400).json({ error: 'Ya has marcado salida hoy' });
            }

            await this.attendanceModel.markExit(empleadoId, fecha, horaSalida);
            res.json({ success: true, message: 'Salida marcada correctamente', hora: horaSalida });
        } catch (error) {
            console.error('Error al marcar salida:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }

    async getTodayStatus(req, res) {
        // Si es administrador, no devolver datos de asistencia personal
        if (req.session.isAdmin) {
            return res.json({});
        }

        const empleadoId = req.session.userId;
        const fecha = new Date().toISOString().split('T')[0];

        try {
            const record = await this.attendanceModel.getByEmployeeAndDate(empleadoId, fecha);
            res.json(record || {});
        } catch (error) {
            console.error('Error al obtener estado del día:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }

    async getEmployeeAttendances(req, res) {
        // Si es administrador, no devolver asistencias personales
        if (req.session.isAdmin) {
            return res.json([]);
        }

        const empleadoId = req.session.userId;

        try {
            const attendances = await this.attendanceModel.getEmployeeAttendances(empleadoId);
            res.json(attendances);
        } catch (error) {
            console.error('Error al obtener asistencias:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }

    async getMonthlyStats(req, res) {
        // Si es administrador, no devolver estadísticas personales
        if (req.session.isAdmin) {
            return res.json({
                diasTrabajados: 0,
                horasTotales: 0,
                promedioHoras: 0,
                puntualidad: 0
            });
        }

        const empleadoId = req.session.userId;
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        try {
            const stats = await this.attendanceModel.getMonthlyStats(empleadoId, year, month);
            res.json(stats);
        } catch (error) {
            console.error('Error al obtener estadísticas mensuales:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }

    async getAllAttendances(req, res) {
        const { fecha_inicio, fecha_fin } = req.query;

        try {
            const attendances = await this.attendanceModel.getAllAttendances(fecha_inicio, fecha_fin);
            res.json(attendances);
        } catch (error) {
            console.error('Error al obtener todas las asistencias:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }

    async getDashboard(req, res) {
        try {
            const dashboardData = await this.attendanceModel.getDashboardToday();
            res.json(dashboardData);
        } catch (error) {
            console.error('Error al obtener dashboard:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
}

module.exports = AttendanceController;
