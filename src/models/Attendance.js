const database = require('../config/database');

class Attendance {
    async marcarAsistencia(empleadoId, tipo) {
        return await database.marcarAsistencia(empleadoId, tipo);
    }

    async markEntry(empleadoId, fecha, hora) {
        return await database.marcarAsistencia(empleadoId, 'entrada');
    }

    async markExit(empleadoId, fecha, hora) {
        return await database.marcarAsistencia(empleadoId, 'salida');
    }

    async getByEmployeeAndDate(empleadoId, fecha) {
        const asistencias = await database.getAsistencias({
            empleado_id: empleadoId,
            fecha_inicio: fecha,
            fecha_fin: fecha
        });
        return asistencias.length > 0 ? asistencias[0] : null;
    }

    async getAsistenciasPorEmpleado(empleadoId, fechaInicio = null, fechaFin = null) {
        const filtros = { empleado_id: empleadoId };
        
        if (fechaInicio) filtros.fecha_inicio = fechaInicio;
        if (fechaFin) filtros.fecha_fin = fechaFin;
        
        return await database.getAsistencias(filtros);
    }

    async getTodasAsistencias(filtros = {}) {
        return await database.getAsistencias(filtros);
    }

    async getAsistenciaHoy(empleadoId) {
        const hoy = new Date().toISOString().split('T')[0];
        const asistencias = await this.getAsistenciasPorEmpleado(empleadoId, hoy, hoy);
        return asistencias.length > 0 ? asistencias[0] : null;
    }

    async getEstadisticasMensuales(empleadoId, año, mes) {
        const fechaInicio = `${año}-${mes.toString().padStart(2, '0')}-01`;
        const fechaFin = `${año}-${mes.toString().padStart(2, '0')}-31`;
        
        const asistencias = await this.getAsistenciasPorEmpleado(empleadoId, fechaInicio, fechaFin);
        
        const stats = {
            diasTrabajados: asistencias.length,
            diasCompletos: asistencias.filter(a => a.hora_entrada && a.hora_salida).length,
            totalHoras: 0
        };

        asistencias.forEach(asistencia => {
            if (asistencia.hora_entrada && asistencia.hora_salida) {
                const entrada = new Date(`1970-01-01T${asistencia.hora_entrada}`);
                const salida = new Date(`1970-01-01T${asistencia.hora_salida}`);
                const horas = (salida - entrada) / (1000 * 60 * 60);
                stats.totalHoras += horas;
            }
        });

        stats.promedioHorasDiarias = stats.diasCompletos > 0 ? 
            (stats.totalHoras / stats.diasCompletos).toFixed(2) : 0;

        return stats;
    }

    async exportarCSV(filtros = {}) {
        const asistencias = await this.getTodasAsistencias(filtros);
        
        let csv = 'Fecha,Empleado,Email,Departamento,Hora Entrada,Hora Salida,Horas Trabajadas\n';
        
        asistencias.forEach(asistencia => {
            let horasTrabajadas = '';
            if (asistencia.hora_entrada && asistencia.hora_salida) {
                const entrada = new Date(`1970-01-01T${asistencia.hora_entrada}`);
                const salida = new Date(`1970-01-01T${asistencia.hora_salida}`);
                horasTrabajadas = ((salida - entrada) / (1000 * 60 * 60)).toFixed(2);
            }
            
            csv += `${asistencia.fecha},${asistencia.nombre || ''},${asistencia.email || ''},${asistencia.departamento || ''},${asistencia.hora_entrada || ''},${asistencia.hora_salida || ''},${horasTrabajadas}\n`;
        });
        
        return csv;
    }

    async getEmployeeAttendances(empleadoId, limit = 10) {
        const asistencias = await this.getAsistenciasPorEmpleado(empleadoId);
        return asistencias.slice(0, limit);
    }

    async getMonthlyStats(empleadoId, año, mes) {
        const fechaInicio = `${año}-${mes.toString().padStart(2, '0')}-01`;
        const fechaFin = `${año}-${mes.toString().padStart(2, '0')}-31`;
        
        // Obtener asistencias del mes
        const asistenciasMes = await this.getAsistenciasPorEmpleado(empleadoId, fechaInicio, fechaFin);
        
        // Obtener asistencias de la semana actual
        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        
        const asistenciasSemana = await this.getAsistenciasPorEmpleado(
            empleadoId, 
            inicioSemana.toISOString().split('T')[0],
            finSemana.toISOString().split('T')[0]
        );

        // Asistencia de hoy
        const asistenciaHoy = await this.getAsistenciaHoy(empleadoId);
        
        return {
            diasTrabajados: asistenciasMes.length,
            horasTotales: this.calcularHorasTotales(asistenciasMes),
            promedioHoras: this.calcularPromedioHoras(asistenciasMes),
            puntualidad: this.calcularPuntualidad(asistenciasMes)
        };
    }

    async getAllAttendances(fechaInicio = null, fechaFin = null) {
        const filtros = {};
        if (fechaInicio) filtros.fecha_inicio = fechaInicio;
        if (fechaFin) filtros.fecha_fin = fechaFin;
        
        return await database.getAsistencias(filtros);
    }

    async getDashboardToday() {
        const hoy = new Date().toISOString().split('T')[0];
        const empleados = await database.getEmpleados();
        
        const dashboardData = [];

        for (const empleado of empleados) {
            const asistenciaHoy = await this.getByEmployeeAndDate(empleado.id, hoy);
            
            dashboardData.push({
                id: empleado.id,
                nombre: empleado.nombre,
                email: empleado.email,
                fecha: hoy,
                hora_entrada: asistenciaHoy?.hora_entrada || null,
                hora_salida: asistenciaHoy?.hora_salida || null,
                estado: this.calculateStatus(asistenciaHoy)
            });
        }

        return dashboardData;
    }

    calculateStatus(asistencia) {
        if (!asistencia || !asistencia.hora_entrada) {
            return 'sin-marcar';
        } else if (asistencia.hora_entrada && !asistencia.hora_salida) {
            return 'trabajando';
        } else if (asistencia.hora_entrada && asistencia.hora_salida) {
            return 'completa';
        }
        return 'sin-marcar';
    }

    // Funciones auxiliares para calcular estadísticas
    calcularHorasTotales(asistencias) {
        let totalHoras = 0;
        asistencias.forEach(asistencia => {
            if (asistencia.hora_entrada && asistencia.hora_salida) {
                const entrada = new Date(`2000-01-01 ${asistencia.hora_entrada}`);
                const salida = new Date(`2000-01-01 ${asistencia.hora_salida}`);
                const diff = (salida - entrada) / (1000 * 60 * 60); // horas
                totalHoras += diff;
            }
        });
        return Math.round(totalHoras * 10) / 10; // Redondear a 1 decimal
    }

    calcularPromedioHoras(asistencias) {
        const diasCompletos = asistencias.filter(a => a.hora_entrada && a.hora_salida);
        if (diasCompletos.length === 0) return 0;
        
        const totalHoras = this.calcularHorasTotales(asistencias);
        return Math.round((totalHoras / diasCompletos.length) * 10) / 10;
    }

    calcularPuntualidad(asistencias) {
        if (asistencias.length === 0) return 100;
        
        const puntuales = asistencias.filter(asistencia => {
            if (!asistencia.hora_entrada) return false;
            const entrada = asistencia.hora_entrada;
            // Considerar puntual si llega antes de las 9:15
            return entrada <= '09:15:00';
        });
        
        return Math.round((puntuales.length / asistencias.length) * 100);
    }
}

module.exports = Attendance;
