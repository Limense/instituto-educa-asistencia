const Dashboard = {
    // Renderizar la vista de registro diario
    renderRegistroView() {
        return `
            <div class="card">
                <div class="card-header">
                    <i class="fas fa-clock"></i> Registro Diario
                </div>
                <div class="card-body">
                    <form id="dailyRegisterForm" class="form">
                        <div class="form-group">
                            <label for="date" class="form-label">Fecha:</label>
                            <input type="date" id="date" class="form-input" value="${Utils.getToday()}" required>
                        </div>
                        <div class="form-group">
                            <label for="checkIn" class="form-label">Hora de Entrada:</label>
                            <input type="time" id="checkIn" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="checkOut" class="form-label">Hora de Salida:</label>
                            <input type="time" id="checkOut" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="activities" class="form-label">Actividades Realizadas:</label>
                            <textarea id="activities" class="form-textarea" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Guardar Registro</button>
                    </form>
                </div>
            </div>
        `;
    },

    initRegistro() {
        const form = document.getElementById('dailyRegisterForm');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const date = form.date.value;
            const checkIn = form.checkIn.value;
            const checkOut = form.checkOut.value;
            const activities = form.activities.value.trim();

            // Validaciones
            if (!date || !checkIn || !checkOut || !activities) {
                EventBus.emit('notification', { message: 'Por favor, completa todos los campos.', type: 'error' });
                return;
            }

            // Validar que la hora de salida sea posterior a la de entrada
            if (checkOut <= checkIn) {
                EventBus.emit('notification', { message: 'La hora de salida debe ser posterior a la hora de entrada.', type: 'error' });
                return;
            }

            try {
                // Verificar si ya existe un registro para esta fecha
                const existingRecord = await AttendanceService.getRecordByDate(date);
                if (existingRecord) {
                    if (!confirm('Ya existe un registro para esta fecha. ¿Deseas sobrescribirlo?')) {
                        return;
                    }
                }

                // Crear objeto de registro usando el Factory
                const attendanceData = DataFactory.createAttendance({
                    date,
                    checkIn,
                    checkOut,
                    activities,
                    status: 'pending'
                });

                // Guardar usando el servicio
                await AttendanceService.saveRecord(attendanceData);
                
                EventBus.emit('notification', { message: 'Registro guardado correctamente.', type: 'success' });
                
                // Limpiar formulario
                form.reset();
                form.date.value = Utils.getToday();
                
                // Emitir evento para refrescar la vista
                EventBus.emit('view-refresh');
                
            } catch (error) {
                EventBus.emit('error', { message: 'Error al guardar el registro', error });
            }
        });
        
        // Aplicar validaciones en tiempo real
        const entradaInput = document.getElementById('checkIn');
        const salidaInput = document.getElementById('checkOut');
        
        if (entradaInput) {
            entradaInput.addEventListener('blur', function() {
                const validation = this.validateEntryTime(this.value);
                this.showValidationFeedback('checkIn', validation);
            });
        }
        
        if (salidaInput) {
            salidaInput.addEventListener('blur', function() {
                const entrada = document.getElementById('checkIn').value;
                if (entrada && this.value) {
                    const validation = this.validateExitTime(entrada, this.value);
                    this.showValidationFeedback('checkOut', validation);
                }
            });
        }
        
        // Función para mostrar feedback de validación
        function showValidationFeedback(fieldId, validation) {
            const field = document.getElementById(fieldId);
            const container = field.parentElement;
            
            // Remover alertas anteriores
            const existingAlerts = container.querySelectorAll('.validation-alerts');
            existingAlerts.forEach(alert => alert.remove());
            
            if (validation.errors.length > 0 || validation.warnings.length > 0) {
                const alertsContainer = document.createElement('div');
                alertsContainer.className = 'validation-alerts';
                
                // Mostrar errores
                validation.errors.forEach(error => {
                    const alert = document.createElement('div');
                    alert.className = 'alert alert-error';
                    alert.innerHTML = `<i class="fas fa-times-circle"></i> ${error}`;
                    alertsContainer.appendChild(alert);
                });
                
                // Mostrar advertencias
                validation.warnings.forEach(warning => {
                    const alert = document.createElement('div');
                    alert.className = 'alert alert-warning';
                    alert.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${warning}`;
                    alertsContainer.appendChild(alert);
                });
                
                container.appendChild(alertsContainer);
            }
        }
    },

    // Renderizar el Dashboard del empleado
    async renderDashboardView() {
        try {
            const records = await AttendanceService.getCurrentUserRecords();
            
            let rows = '';
            if (records.length === 0) {
                rows = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No hay registros aún. <br><small>Ve a "Registro Diario" para crear tu primer registro.</small></td></tr>';
            } else {
                rows = records.map(record => {
                    return `
                        <tr>
                            <td>${new Date(record.date).toLocaleDateString('es-ES')}</td>
                            <td>${record.check_in}</td>
                            <td>${record.check_out || 'No registrado'}</td>
                            <td>${record.hours_worked || 0} hrs</td>
                            <td><span class="badge badge-${record.status}">${this.getStatusLabel(record.status)}</span></td>
                        </tr>
                    `;
                }).join('');
            }

            const stats = this.calculateStats(records);

            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-chart-bar"></i> Mi Dashboard
                    </div>
                    <div class="card-body">
                        <div class="row" style="margin-bottom: 20px;">
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body" style="text-align: center;">
                                        <h3>${stats.total}</h3>
                                        <p>Total Registros</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body" style="text-align: center;">
                                        <h3>${stats.approved}</h3>
                                        <p>Aprobados</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body" style="text-align: center;">
                                        <h3>${stats.pending}</h3>
                                        <p>Pendientes</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="card">
                                    <div class="card-body" style="text-align: center;">
                                        <h3>${stats.totalHours}</h3>
                                        <p>Total Horas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Entrada</th>
                                    <th>Salida</th>
                                    <th>Horas</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            EventBus.emit('error', { message: 'Error al cargar el dashboard', error });
            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-chart-bar"></i> Mi Dashboard
                    </div>
                    <div class="card-body">
                        <div class="alert alert-danger">Error al cargar datos. Inténtalo de nuevo.</div>
                    </div>
                </div>
            `;
        }
    },

    getStatusLabel(status) {
        const statusMap = {
            'pending': '⏳ Pendiente',
            'approved': '✅ Aprobado',
            'rejected': '❌ Rechazado'
        };
        return statusMap[status] || status;
    },

    calculateStats(records) {
        const stats = {
            total: records.length,
            approved: records.filter(r => r.status === 'approved').length,
            pending: records.filter(r => r.status === 'pending').length,
            rejected: records.filter(r => r.status === 'rejected').length,
            totalHours: records.reduce((sum, r) => sum + (parseFloat(r.hours_worked) || 0), 0)
        };
        
        return stats;
    },

    initDashboard() {
        // Configurar listeners para actualizaciones
        EventBus.on('view-refresh', () => {
            if (AppState.currentView === 'dashboard') {
                this.renderDashboardView().then(html => {
                    const contentArea = document.getElementById('contentArea');
                    if (contentArea) {
                        contentArea.innerHTML = html;
                    }
                });
            }
        });
    },

    // Renderizar la vista de reportes
    async renderReportesView() {
        try {
            const reports = await ReportsService.getUserReports();
            
            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-file-alt"></i> Mis Reportes
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <button class="btn btn-primary" onclick="Dashboard.generatePersonalReport()">
                                    <i class="fas fa-user"></i> Reporte Personal
                                </button>
                            </div>
                            <div class="col-md-4">
                                <button class="btn btn-secondary" onclick="Dashboard.generateMonthlyReport()">
                                    <i class="fas fa-calendar"></i> Reporte Mensual
                                </button>
                            </div>
                            <div class="col-md-4">
                                <button class="btn btn-info" onclick="Dashboard.exportAllData()">
                                    <i class="fas fa-download"></i> Exportar Datos
                                </button>
                            </div>
                        </div>
                        
                        <div id="reportContent">
                            ${reports.length > 0 ? this.renderReportsList(reports) : '<p>No hay reportes disponibles. Genera tu primer reporte usando los botones de arriba.</p>'}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            EventBus.emit('error', { message: 'Error al cargar reportes', error });
            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-file-alt"></i> Mis Reportes
                    </div>
                    <div class="card-body">
                        <div class="alert alert-warning">Error al cargar reportes. Inténtalo de nuevo.</div>
                    </div>
                </div>
            `;
        }
    },

    renderReportsList(reports) {
        return `
            <table class="table">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th>Periodo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${reports.map(report => `
                        <tr>
                            <td>${report.type}</td>
                            <td>${new Date(report.created_at).toLocaleDateString('es-ES')}</td>
                            <td>${report.period}</td>
                            <td>
                                <button class="btn btn-sm btn-info" onclick="Dashboard.viewReport(${report.id})">
                                    <i class="fas fa-eye"></i> Ver
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="Dashboard.downloadReport(${report.id})">
                                    <i class="fas fa-download"></i> Descargar
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    initReportes() {
        // Reportes ya renderizados
    },

    // Métodos para la generación de reportes
    async generatePersonalReport() {
        try {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1); // Último mes
            const endDate = new Date();
            
            const report = await ReportsService.generatePersonalReport(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );
            
            EventBus.emit('notification', { message: 'Reporte personal generado exitosamente', type: 'success' });
            EventBus.emit('view-refresh');
        } catch (error) {
            EventBus.emit('error', { message: 'Error al generar reporte personal', error });
        }
    },

    async generateMonthlyReport() {
        try {
            const currentDate = new Date();
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            
            const report = await ReportsService.generateMonthlyReport(
                firstDay.toISOString().split('T')[0],
                lastDay.toISOString().split('T')[0]
            );
            
            EventBus.emit('notification', { message: 'Reporte mensual generado exitosamente', type: 'success' });
            EventBus.emit('view-refresh');
        } catch (error) {
            EventBus.emit('error', { message: 'Error al generar reporte mensual', error });
        }
    },

    async exportAllData() {
        try {
            const data = await AttendanceService.getCurrentUserRecords();
            const csvContent = this.convertToCSV(data);
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `mis_registros_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            EventBus.emit('notification', { message: 'Datos exportados exitosamente', type: 'success' });
        } catch (error) {
            EventBus.emit('error', { message: 'Error al exportar datos', error });
        }
    },

    convertToCSV(data) {
        const headers = ['Fecha', 'Entrada', 'Salida', 'Horas Trabajadas', 'Estado', 'Actividades'];
        const csvRows = [headers.join(',')];
        
        data.forEach(record => {
            const row = [
                new Date(record.date).toLocaleDateString('es-ES'),
                record.check_in,
                record.check_out || '',
                record.hours_worked || 0,
                this.getStatusLabel(record.status),
                `"${(record.activities || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    },

    async viewReport(reportId) {
        try {
            const report = await ReportsService.getReport(reportId);
            // Aquí se mostraría el reporte en un modal
            EventBus.emit('notification', { message: 'Reporte cargado', type: 'info' });
        } catch (error) {
            EventBus.emit('error', { message: 'Error al cargar reporte', error });
        }
    },

    async downloadReport(reportId) {
        try {
            const reportData = await ReportsService.downloadReport(reportId);
            // Crear enlace de descarga
            const blob = new Blob([reportData], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            EventBus.emit('notification', { message: 'Reporte descargado exitosamente', type: 'success' });
        } catch (error) {
            EventBus.emit('error', { message: 'Error al descargar reporte', error });
        }
    },

    // Métodos de validación incorporados
    validateEntryTime(time) {
        const errors = [];
        const warnings = [];
        
        if (!time) {
            errors.push('La hora de entrada es requerida');
            return { errors, warnings };
        }
        
        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        
        // Validar rango de horario laboral (6:00 AM - 10:00 AM)
        if (timeInMinutes < 6 * 60) {
            warnings.push('La hora de entrada es muy temprana (antes de las 6:00 AM)');
        } else if (timeInMinutes > 10 * 60) {
            warnings.push('La hora de entrada es tardía (después de las 10:00 AM)');
        }
        
        return { errors, warnings };
    },

    validateExitTime(entryTime, exitTime) {
        const errors = [];
        const warnings = [];
        
        if (!exitTime) {
            errors.push('La hora de salida es requerida');
            return { errors, warnings };
        }
        
        if (exitTime <= entryTime) {
            errors.push('La hora de salida debe ser posterior a la hora de entrada');
        }
        
        const [entryHours, entryMinutes] = entryTime.split(':').map(Number);
        const [exitHours, exitMinutes] = exitTime.split(':').map(Number);
        
        const entryInMinutes = entryHours * 60 + entryMinutes;
        const exitInMinutes = exitHours * 60 + exitMinutes;
        
        const workedMinutes = exitInMinutes - entryInMinutes;
        const workedHours = workedMinutes / 60;
        
        if (workedHours < 4) {
            warnings.push('Jornada muy corta (menos de 4 horas)');
        } else if (workedHours > 12) {
            warnings.push('Jornada muy larga (más de 12 horas)');
        }
        
        // Validar hora de salida (14:00 - 20:00)
        if (exitInMinutes < 14 * 60) {
            warnings.push('La hora de salida es muy temprana (antes de las 2:00 PM)');
        } else if (exitInMinutes > 20 * 60) {
            warnings.push('La hora de salida es muy tardía (después de las 8:00 PM)');
        }
        
        return { errors, warnings };
    },

    // Nuevas funcionalidades para todos los roles
    menuItems: [
        {
            id: 'calendar',
            icon: 'fas fa-calendar-alt',
            text: 'Calendario',
            action: () => this.showCalendar(),
            roles: ['employee', 'supervisor', 'administrator']
        },
        {
            id: 'reports',
            icon: 'fas fa-chart-line',
            text: 'Reportes',
            action: () => this.showReports(),
            roles: ['employee', 'supervisor', 'administrator']
        },
        {
            id: 'settings',
            icon: 'fas fa-cog',
            text: 'Configuración',
            action: () => this.showSettings(),
            roles: ['administrator']
        }
    ],

    async showCalendar() {
        try {
            const records = await AttendanceService.getCurrentUserRecords();
            // Implementar vista de calendario
            EventBus.emit('notification', { message: 'Vista de calendario en desarrollo', type: 'info' });
        } catch (error) {
            EventBus.emit('error', { message: 'Error al cargar calendario', error });
        }
    },

    async showReports() {
        EventBus.emit('view-change', { view: 'reportes' });
    },

    showSettings() {
        EventBus.emit('notification', { message: 'Configuración disponible solo para administradores', type: 'info' });
    }
};