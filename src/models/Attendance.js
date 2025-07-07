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
            dias_trabajados_mes: asistenciasMes.length,
            dias_completos_mes: asistenciasMes.filter(a => a.hora_entrada && a.hora_salida).length,
            dias_trabajados_semana: asistenciasSemana.length,
            tiene_asistencia_hoy: asistenciaHoy ? true : false,
            promedio_mensual: asistenciasMes.length > 0 ? 
                Math.round((asistenciasMes.filter(a => a.hora_entrada && a.hora_salida).length / asistenciasMes.length) * 100) : 0
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
        
        const estadisticas = {
            totalEmpleados: empleados.length,
            presente: 0,
            ausente: 0,
            trabajando: 0,
            jornada_completa: 0
        };

        for (const empleado of empleados) {
            const asistenciaHoy = await this.getByEmployeeAndDate(empleado.id, hoy);
            
            if (!asistenciaHoy || !asistenciaHoy.hora_entrada) {
                estadisticas.ausente++;
            } else if (asistenciaHoy.hora_entrada && !asistenciaHoy.hora_salida) {
                estadisticas.presente++;
                estadisticas.trabajando++;
            } else if (asistenciaHoy.hora_entrada && asistenciaHoy.hora_salida) {
                estadisticas.presente++;
                estadisticas.jornada_completa++;
            }
        }

        return estadisticas;
    }
}

module.exports = Attendance;
