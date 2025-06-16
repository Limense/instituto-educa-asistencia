const Supervisor = {
    attendanceRecords: [],
    
    // Renderizar vista de supervisión
    async renderSupervisionView() {
        try {
            // Obtener registros de asistencia pendientes de aprobación usando el servicio
            this.attendanceRecords = await AttendanceService.getPendingRecords();
            
            const pendingRecords = this.attendanceRecords.filter(record => record.status === 'pending');
            const approvedRecords = this.attendanceRecords.filter(record => record.status === 'approved');
            const rejectedRecords = this.attendanceRecords.filter(record => record.status === 'rejected');
            
            let rows = '';
            if (this.attendanceRecords.length === 0) {
                rows = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No hay registros para revisar.</td></tr>';
            } else {
                rows = this.attendanceRecords.map(record => {
                    const formattedDate = new Date(record.date).toLocaleDateString('es-ES');
                    return `
                        <tr>
                            <td>${formattedDate}</td>
                            <td>${record.check_in}</td>
                            <td>${record.check_out || 'No registrado'}</td>
                            <td>${record.hours_worked || 0} hrs</td>
                            <td><span class="badge badge-${record.status}">${this.getStatusLabel(record.status)}</span></td>
                            <td>
                                ${record.status === 'pending' ? `
                                    <button class="btn btn-success" onclick="Supervisor.approveRecord(${record.id})">✔️ Aprobar</button>
                                    <button class="btn btn-danger" onclick="Supervisor.rejectRecord(${record.id})">❌ Rechazar</button>
                                ` : `
                                    <span style="color: #666; font-size: 0.8em;">
                                        ${record.status === 'approved' ? 'Ya aprobado' : 'Ya procesado'}
                                    </span>
                                `}
                                <button class="btn btn-info" onclick="Supervisor.showRecordDetails(${record.id})">🔍 Detalles</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-users"></i> Supervisión de Registros
                    </div>
                    <div class="card-body">
                        <div class="row" style="margin-bottom: 20px;">
                            <div class="col-4">
                                <div class="card">
                                    <div class="card-body" style="text-align: center;">
                                        <h3>${pendingRecords.length}</h3>
                                        <p>Pendientes de Revisión</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="card">
                                    <div class="card-body" style="text-align: center;">
                                        <h3>${approvedRecords.length}</h3>
                                        <p>Aprobados</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="card">
                                    <div class="card-body" style="text-align: center;">
                                        <h3>${rejectedRecords.length}</h3>
                                        <p>Rechazados</p>
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
                                    <th>Acciones</th>
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
            EventBus.emit('error', { message: 'Error al cargar registros de supervisión', error });
            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-users"></i> Supervisión de Registros
                    </div>
                    <div class="card-body">
                        <div class="alert alert-danger">Error al cargar los registros. Inténtalo de nuevo.</div>
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

    async approveRecord(recordId) {
        try {
            await AttendanceService.updateRecordStatus(recordId, 'approved');
            EventBus.emit('notification', { message: 'Registro aprobado exitosamente', type: 'success' });
            EventBus.emit('view-refresh');
        } catch (error) {
            EventBus.emit('error', { message: 'Error al aprobar registro', error });
        }
    },

    async rejectRecord(recordId) {
        try {
            await AttendanceService.updateRecordStatus(recordId, 'rejected');
            EventBus.emit('notification', { message: 'Registro rechazado', type: 'warning' });
            EventBus.emit('view-refresh');
        } catch (error) {
            EventBus.emit('error', { message: 'Error al rechazar registro', error });
        }
    },

    initSupervision() {
        // Configurar listeners para eventos del EventBus
        EventBus.on('view-refresh', () => {
            if (AppState.currentView === 'supervision') {
                this.renderSupervisionView().then(html => {
                    const contentArea = document.getElementById('contentArea');
                    if (contentArea) {
                        contentArea.innerHTML = html;
                    }
                });
            }
        });
    },

    async renderDashboardView() {
        try {
            const stats = await ReportsService.getSupervisorStats();
            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-chart-line"></i> Dashboard Supervisor
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-3">
                                <div class="metric-card">
                                    <div class="metric-value">${stats.totalEmployees || 0}</div>
                                    <div class="metric-label">Empleados a Cargo</div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="metric-card">
                                    <div class="metric-value">${stats.pendingApprovals || 0}</div>
                                    <div class="metric-label">Pendientes de Aprobación</div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="metric-card">
                                    <div class="metric-value">${stats.attendanceRate || 0}%</div>
                                    <div class="metric-label">Tasa de Asistencia</div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="metric-card">
                                    <div class="metric-value">${stats.avgHoursPerDay || 0}</div>
                                    <div class="metric-label">Promedio Horas/Día</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            EventBus.emit('error', { message: 'Error al cargar estadísticas', error });
            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-chart-line"></i> Dashboard Supervisor
                    </div>
                    <div class="card-body">
                        <div class="alert alert-warning">Error al cargar estadísticas. Inténtalo de nuevo.</div>
                    </div>
                </div>
            `;
        }
    },

    initDashboard() {
        // Dashboard ya renderizado
    },

    async renderReportesView() {
        try {
            const reports = await ReportsService.getSupervisorReports();
            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-chart-pie"></i> Reportes Supervisor
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <button class="btn btn-primary" onclick="Supervisor.generateTeamReport()">
                                    <i class="fas fa-users"></i> Reporte de Equipo
                                </button>
                            </div>
                            <div class="col-md-6">
                                <button class="btn btn-secondary" onclick="Supervisor.generateAttendanceReport()">
                                    <i class="fas fa-calendar-check"></i> Reporte de Asistencia
                                </button>
                            </div>
                        </div>
                        <div id="reportContent">
                            ${reports.length > 0 ? this.renderReportsList(reports) : '<p>No hay reportes disponibles.</p>'}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            EventBus.emit('error', { message: 'Error al cargar reportes', error });
            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-chart-pie"></i> Reportes Supervisor
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
                                <button class="btn btn-sm btn-info" onclick="Supervisor.viewReport(${report.id})">
                                    <i class="fas fa-eye"></i> Ver
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="Supervisor.downloadReport(${report.id})">
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

    // Función para mostrar detalles del registro
    async showRecordDetails(recordId) {
        try {
            const record = this.attendanceRecords.find(r => r.id === recordId);
            
            if (!record) {
                EventBus.emit('notification', { message: 'Registro no encontrado', type: 'error' });
                return;
            }

            const detailsHTML = `
                <div class="modal-overlay" onclick="this.remove()" style="
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100%; 
                    height: 100%; 
                    background: rgba(0,0,0,0.5); 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    z-index: 1000;
                ">
                    <div class="modal-content" onclick="event.stopPropagation()" style="
                        background: white; 
                        padding: 20px; 
                        border-radius: 10px; 
                        max-width: 500px; 
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                    ">
                        <h3>📋 Detalles del Registro</h3>
                        <hr>
                        <p><strong>📅 Fecha:</strong> ${new Date(record.date).toLocaleDateString('es-ES')}</p>
                        <p><strong>� Empleado:</strong> ${record.employee_name || 'N/A'}</p>
                        <p><strong>�🕒 Entrada:</strong> ${record.check_in}</p>
                        <p><strong>🕕 Salida:</strong> ${record.check_out || 'No registrado'}</p>
                        <p><strong>⏱️ Horas Trabajadas:</strong> ${record.hours_worked || 0} horas</p>
                        <p><strong>📊 Estado:</strong> <span class="badge badge-${record.status}">${this.getStatusLabel(record.status)}</span></p>
                        ${record.activities ? `
                            <p><strong>📝 Actividades:</strong></p>
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
                                ${record.activities.replace(/\n/g, '<br>')}
                            </div>
                        ` : ''}
                        ${record.created_at ? `<p><strong>🕐 Registrado:</strong> ${new Date(record.created_at).toLocaleString('es-ES')}</p>` : ''}
                        <hr>
                        <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-primary" style="width: 100%;">Cerrar</button>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', detailsHTML);
        } catch (error) {
            EventBus.emit('error', { message: 'Error al mostrar detalles del registro', error });
        }
    },

    // Vista de empleados supervisados
    async renderEmpleadosView() {
        try {
            const currentUser = AuthManager.getCurrentUser();
            const employees = await UserService.getSupervisedEmployees(currentUser.id);

            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-user-friends"></i> Mis Empleados Supervisados
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-3">
                                <div class="metric-card">
                                    <div class="metric-value">${employees.length}</div>
                                    <div class="metric-label">Empleados a Cargo</div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="metric-card">
                                    <div class="metric-value">${employees.filter(e => e.active).length}</div>
                                    <div class="metric-label">Activos</div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="metric-card">
                                    <div class="metric-value">${currentUser.department || 'N/A'}</div>
                                    <div class="metric-label">Departamento</div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="metric-card">
                                    <div class="metric-value">${employees.filter(e => e.role === 'employee').length}</div>
                                    <div class="metric-label">Empleados</div>
                                </div>
                            </div>
                        </div>
                        
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Email</th>
                                    <th>Departamento</th>
                                    <th>Estado</th>
                                    <th>Última Actividad</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${employees.length === 0 ? 
                                    '<tr><td colspan="6" style="text-align: center; padding: 20px;">No tienes empleados asignados</td></tr>' :
                                    await this.renderEmployeeRows(employees)
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            EventBus.emit('error', { message: 'Error al cargar empleados supervisados', error });
            return `
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-user-friends"></i> Mis Empleados Supervisados
                    </div>
                    <div class="card-body">
                        <div class="alert alert-danger">Error al cargar empleados. Inténtalo de nuevo.</div>
                    </div>
                </div>
            `;
        }
    },

    async renderEmployeeRows(employees) {
        const rows = await Promise.all(employees.map(async (employee) => {
            try {
                const lastActivity = await AttendanceService.getLastActivity(employee.id);
                return `
                    <tr>
                        <td>
                            <strong>${employee.name}</strong><br>
                            <small>@${employee.username}</small>
                        </td>
                        <td>${employee.email}</td>
                        <td>${employee.department || 'N/A'}</td>
                        <td>
                            <span class="badge badge-${employee.active ? 'approved' : 'rejected'}">
                                ${employee.active ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td>
                            ${lastActivity ? 
                                new Date(lastActivity.date).toLocaleDateString('es-ES') : 
                                'Sin registros'
                            }
                        </td>
                        <td>
                            <button class="btn btn-info" onclick="Supervisor.viewEmployeeDetails(${employee.id})" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-primary" onclick="Supervisor.viewEmployeeAttendance(${employee.id})" title="Ver asistencia">
                                <i class="fas fa-calendar-check"></i>
                            </button>
                        </td>
                    </tr>
                `;
            } catch (error) {
                return `
                    <tr>
                        <td>
                            <strong>${employee.name}</strong><br>
                            <small>@${employee.username}</small>
                        </td>
                        <td>${employee.email}</td>
                        <td>${employee.department || 'N/A'}</td>
                        <td>
                            <span class="badge badge-${employee.active ? 'approved' : 'rejected'}">
                                ${employee.active ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td>Error al cargar</td>
                        <td>
                            <button class="btn btn-info" onclick="Supervisor.viewEmployeeDetails(${employee.id})" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }
        }));
        
        return rows.join('');
    },

    initEmpleados() {
        // Vista ya renderizada con datos asíncronos
    },

    async viewEmployeeDetails(employeeId) {
        try {
            const employee = await UserService.getUserById(employeeId);
            const currentUser = AuthManager.getCurrentUser();
            
            // Verificar permisos usando el nuevo sistema
            if (!AuthManager.canManageUser(employeeId)) {
                EventBus.emit('notification', { message: 'No tienes permisos para ver este empleado', type: 'error' });
                return;
            }

            if (!employee) {
                EventBus.emit('notification', { message: 'Empleado no encontrado', type: 'error' });
                return;
            }

            const detailsHTML = `
                <div class="modal-overlay" onclick="this.remove()">
                    <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
                        <h3><i class="fas fa-user"></i> Detalles del Empleado</h3>
                        <hr>
                        <div class="row">
                            <div class="col-2">
                                <p><strong>👤 Nombre:</strong> ${employee.name}</p>
                                <p><strong>📧 Email:</strong> ${employee.email}</p>
                                <p><strong>🏢 Departamento:</strong> ${employee.department || 'N/A'}</p>
                            </div>
                            <div class="col-2">
                                <p><strong>👨‍💼 Usuario:</strong> ${employee.username}</p>
                                <p><strong>📅 Creado:</strong> ${new Date(employee.created_at).toLocaleDateString('es-ES')}</p>
                                <p><strong>🟢 Estado:</strong> ${employee.active ? 'Activo' : 'Inactivo'}</p>
                            </div>
                        </div>
                        <hr>
                        <div style="text-align: right;">
                            <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-primary">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', detailsHTML);
        } catch (error) {
            EventBus.emit('error', { message: 'Error al cargar detalles del empleado', error });
        }
    },

    async viewEmployeeAttendance(employeeId) {
        try {
            const employee = await UserService.getUserById(employeeId);
            
            if (!AuthManager.canManageUser(employeeId)) {
                EventBus.emit('notification', { message: 'No tienes permisos para ver este empleado', type: 'error' });
                return;
            }

            // Obtener registros de asistencia del empleado
            const attendanceRecords = await AttendanceService.getEmployeeAttendance(employeeId);
            
            const attendanceHTML = `
                <div class="modal-overlay" onclick="this.remove()">
                    <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
                        <h3><i class="fas fa-calendar-check"></i> Asistencia de ${employee.name}</h3>
                        <hr>
                        <div class="table-responsive">
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
                                    ${attendanceRecords.length === 0 ? 
                                        '<tr><td colspan="5" style="text-align: center;">No hay registros de asistencia</td></tr>' :
                                        attendanceRecords.map(record => `
                                            <tr>
                                                <td>${new Date(record.date).toLocaleDateString('es-ES')}</td>
                                                <td>${record.check_in}</td>
                                                <td>${record.check_out || 'No registrado'}</td>
                                                <td>${record.hours_worked || 0} hrs</td>
                                                <td><span class="badge badge-${record.status}">${this.getStatusLabel(record.status)}</span></td>
                                            </tr>
                                        `).join('')
                                    }
                                </tbody>
                            </table>
                        </div>
                        <hr>
                        <div style="text-align: right;">
                            <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-primary">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', attendanceHTML);
        } catch (error) {
            EventBus.emit('error', { message: 'Error al cargar asistencia del empleado', error });
        }
    },

    // Métodos para reportes
    async generateTeamReport() {
        try {
            const report = await ReportsService.generateTeamReport();
            EventBus.emit('notification', { message: 'Reporte de equipo generado exitosamente', type: 'success' });
            // Aquí se podría mostrar el reporte en un modal o descargarlo
        } catch (error) {
            EventBus.emit('error', { message: 'Error al generar reporte de equipo', error });
        }
    },

    async generateAttendanceReport() {
        try {
            const report = await ReportsService.generateAttendanceReport();
            EventBus.emit('notification', { message: 'Reporte de asistencia generado exitosamente', type: 'success' });
            // Aquí se podría mostrar el reporte en un modal o descargarlo
        } catch (error) {
            EventBus.emit('error', { message: 'Error al generar reporte de asistencia', error });
        }
    },

    async viewReport(reportId) {
        try {
            const report = await ReportsService.getReport(reportId);
            // Mostrar el reporte en un modal
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
    }
};