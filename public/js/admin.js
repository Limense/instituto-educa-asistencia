// Variables globales
let currentTab = 'dashboard';
let currentView = 'cards';
let empleados = [];
let asistencias = [];
let dashboardData = [];

// Sistema de tabs
function showTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar tab actual
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    currentTab = tabName;
    
    // Cargar datos según el tab
    if (tabName === 'dashboard') {
        loadDashboard();
    } else if (tabName === 'empleados') {
        loadEmpleados();
    } else if (tabName === 'asistencias') {
        loadAsistencias();
    }
}

// Alternar vista entre tarjetas y tabla
function toggleView(viewType) {
    currentView = viewType;
    
    // Actualizar botones
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="toggleView('${viewType}')"]`).classList.add('active');
    
    // Mostrar/ocultar vistas
    if (viewType === 'cards') {
        document.getElementById('cardsView').style.display = 'grid';
        document.getElementById('tableView').style.display = 'none';
        renderEmployeeCards(); // Asegurar que las tarjetas estén actualizadas
    } else {
        document.getElementById('cardsView').style.display = 'none';
        document.getElementById('tableView').style.display = 'block';
        renderDashboardTable(); // Asegurar que la tabla esté actualizada
    }
}

// Cargar dashboard con datos de hoy
async function loadDashboard() {
    try {
        const response = await fetch('/api/attendances/dashboard');
        const data = await response.json();
        
        // Procesar datos para el dashboard
        dashboardData = processDashboardData(data);
        
        // Renderizar ambas vistas para tener los datos listos
        renderEmployeeCards();
        renderDashboardTable();
        
        // Mostrar la vista actual
        if (currentView === 'cards') {
            document.getElementById('cardsView').style.display = 'grid';
            document.getElementById('tableView').style.display = 'none';
        } else {
            document.getElementById('cardsView').style.display = 'none';
            document.getElementById('tableView').style.display = 'block';
        }
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showMessage('Error cargando dashboard', 'error');
    }
}

// Procesar datos para el dashboard
function processDashboardData(rawData) {
    return rawData.map(emp => {
        // Calcular tiempo total
        let tiempoTotal = '';
        let tiempoEnMinutos = 0;
        let estadoClase = 'sin-marcar';
        
        if (emp.hora_entrada && emp.hora_salida) {
            const entrada = new Date(`2000-01-01 ${emp.hora_entrada}`);
            const salida = new Date(`2000-01-01 ${emp.hora_salida}`);
            tiempoEnMinutos = (salida - entrada) / (1000 * 60);
            
            const horas = Math.floor(tiempoEnMinutos / 60);
            const minutos = Math.floor(tiempoEnMinutos % 60);
            tiempoTotal = `${horas}h ${minutos}m`;
            
            if (tiempoEnMinutos >= 480) { // 8 horas
                estadoClase = 'jornada-completa';
                emp.estado = 'Jornada completa';
            } else {
                estadoClase = 'jornada-corta';
                emp.estado = `Jornada corta: ${tiempoTotal}`;
            }
        } else if (emp.hora_entrada) {
            estadoClase = 'en-trabajo';
            emp.estado = 'En trabajo';
        } else {
            estadoClase = 'sin-marcar';
            emp.estado = 'Sin marcar';
        }
        
        return {
            ...emp,
            tiempoTotal,
            tiempoEnMinutos,
            estadoClase
        };
    });
}

// Renderizar tarjetas de empleados
function renderEmployeeCards() {
    const container = document.getElementById('cardsView');
    
    if (dashboardData.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #666;">No hay datos para mostrar</div>';
        return;
    }
    
    container.innerHTML = dashboardData.map(emp => {
        const iniciales = emp.nombre.split(' ').map(n => n[0]).join('').toUpperCase();
        
        return `
            <div class="employee-card ${emp.estadoClase}">
                <div class="employee-header">
                    <div class="employee-avatar">${iniciales}</div>
                    <div class="employee-info">
                        <h3>${emp.nombre}</h3>
                        <p class="employee-role">${emp.email}</p>
                    </div>
                </div>
                
                <div class="status-badge-card ${getStatusClass(emp.estadoClase)}">
                    ${getStatusIcon(emp.estadoClase)} ${emp.estado}
                </div>
                
                <div class="time-info">
                    <div class="time-item">
                        <div class="time-label">Entrada</div>
                        <div class="time-value">${emp.entrada || 'Pendiente'}</div>
                    </div>
                    <div class="time-item">
                        <div class="time-label">Salida</div>
                        <div class="time-value">${emp.salida || 'Pendiente'}</div>
                    </div>
                </div>
                
                <div class="total-time ${getTotalTimeClass(emp.tiempoEnMinutos)}">
                    <div class="total-time-label">Total</div>
                    <div class="total-time-value">${emp.tiempoTotal || '0h 0m'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Obtener clase de estado
function getStatusClass(estadoClase) {
    const map = {
        'jornada-completa': 'completa',
        'en-trabajo': 'trabajo',
        'sin-marcar': 'pendiente',
        'jornada-corta': 'corta'
    };
    return map[estadoClase] || 'pendiente';
}

// Obtener icono de estado
function getStatusIcon(estadoClase) {
    const map = {
        'jornada-completa': '✅',
        'en-trabajo': '🔄',
        'sin-marcar': '⏸️',
        'jornada-corta': '⚠️'
    };
    return map[estadoClase] || '❓';
}

// Obtener clase para tiempo total
function getTotalTimeClass(minutos) {
    if (minutos >= 480) return 'success-time'; // 8+ horas
    if (minutos >= 360) return 'warning-time'; // 6+ horas
    return '';
}

// Renderizar tabla del dashboard
function renderDashboardTable() {
    const tbody = document.getElementById('dashboardTable');
    
    if (dashboardData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay datos para mostrar</td></tr>';
        return;
    }
    
    tbody.innerHTML = dashboardData.map(emp => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #EC5971 0%, #ff8a9b 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.9rem;">
                        ${emp.nombre.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: 500;">${emp.nombre}</div>
                        <div style="font-size: 0.8rem; color: #666;">${emp.email}</div>
                    </div>
                </div>
            </td>
            <td>${emp.entrada || '-'}</td>
            <td>${emp.salida || '-'}</td>
            <td style="font-weight: 500;">${emp.tiempoTotal || '-'}</td>
            <td>
                <span class="badge badge-${getStatusClass(emp.estadoClase)}">
                    ${getStatusIcon(emp.estadoClase)} ${emp.estado}
                </span>
            </td>
        </tr>
    `).join('');
}

// Obtener fecha de hoy en formato YYYY-MM-DD
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Cargar empleados
async function loadEmpleados() {
    try {
        const response = await fetch('/api/employees');
        empleados = await response.json();
        renderEmpleados();
    } catch (error) {
        console.error('Error cargando empleados:', error);
        showMessage('Error cargando empleados', 'error');
    }
}

// Renderizar tabla de empleados
function renderEmpleados() {
    const tbody = document.getElementById('empleadosTable');
    
    if (empleados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay empleados registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = empleados.map(emp => `
        <tr>
            <td>${emp.id}</td>
            <td>${emp.nombre}</td>
            <td>${emp.email}</td>
            <td>
                <span class="badge badge-${emp.es_admin ? 'admin' : 'empleado'}">
                    ${emp.es_admin ? 'Admin' : 'Empleado'}
                </span>
            </td>
            <td>
                <button class="btn btn-primary" onclick="editEmpleado(${emp.id})" style="margin-right: 0.5rem; padding: 0.5rem;">
                    ✏️ Editar
                </button>
                <button class="btn btn-danger" onclick="deleteEmpleado(${emp.id})" style="padding: 0.5rem;">
                    🗑️ Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// Mostrar modal de empleado
function showEmpleadoModal(empleado = null) {
    const modal = document.getElementById('empleadoModal');
    const form = document.getElementById('empleadoForm');
    const title = document.getElementById('modalTitle');
    
    if (empleado) {
        title.textContent = 'Editar Empleado';
        document.getElementById('empleadoId').value = empleado.id;
        document.getElementById('empleadoNombre').value = empleado.nombre;
        document.getElementById('empleadoEmail').value = empleado.email;
        document.getElementById('empleadoPassword').required = false;
        document.getElementById('empleadoAdmin').checked = empleado.es_admin;
    } else {
        title.textContent = 'Nuevo Empleado';
        form.reset();
        document.getElementById('empleadoId').value = '';
        document.getElementById('empleadoPassword').required = true;
    }
    
    modal.style.display = 'block';
}

// Cerrar modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Guardar empleado
async function saveEmpleado() {
    const form = document.getElementById('empleadoForm');
    const formData = new FormData(form);
    const empleadoId = formData.get('empleadoId');
    
    const data = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        password: formData.get('password'),
        es_admin: formData.get('es_admin') === 'on'
    };
    
    try {
        let response;
        if (empleadoId) {
            // Actualizar
            if (!data.password) delete data.password;
            response = await fetch(`/api/employees/${empleadoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Crear
            response = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage(empleadoId ? 'Empleado actualizado' : 'Empleado creado', 'success');
            closeModal('empleadoModal');
            loadEmpleados();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Editar empleado
function editEmpleado(id) {
    const empleado = empleados.find(emp => emp.id === id);
    if (empleado) {
        showEmpleadoModal(empleado);
    }
}

// Eliminar empleado
async function deleteEmpleado(id) {
    if (!confirm('¿Estás seguro de eliminar este empleado?')) return;
    
    try {
        const response = await fetch(`/api/employees/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Empleado eliminado', 'success');
            loadEmpleados();
        } else {
            const result = await response.json();
            throw new Error(result.error);
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Cargar asistencias
async function loadAsistencias() {
    try {
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        
        let url = '/api/attendances/todas';
        const params = new URLSearchParams();
        
        if (fechaInicio) params.append('fecha_inicio', fechaInicio);
        if (fechaFin) params.append('fecha_fin', fechaFin);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        asistencias = await response.json();
        renderAsistencias();
    } catch (error) {
        console.error('Error cargando asistencias:', error);
        showMessage('Error cargando asistencias', 'error');
    }
}

// Renderizar tabla de asistencias
function renderAsistencias() {
    const tbody = document.getElementById('asistenciasTable');
    
    if (asistencias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No hay registros de asistencia</td></tr>';
        return;
    }
    
    tbody.innerHTML = asistencias.map(asist => {
        let estado = 'Sin registros';
        let badgeClass = 'badge-sin-registros';
        
        if (asist.hora_entrada && asist.hora_salida) {
            estado = 'Completo';
            badgeClass = 'badge-completo';
        } else if (asist.hora_entrada) {
            estado = 'Solo entrada';
            badgeClass = 'badge-incompleto';
        }
        
        return `
            <tr>
                <td>${asist.nombre}</td>
                <td>${asist.email}</td>
                <td>${asist.fecha ? new Date(asist.fecha).toLocaleDateString('es-ES') : '-'}</td>
                <td>${asist.hora_entrada || '-'}</td>
                <td>${asist.hora_salida || '-'}</td>
                <td>
                    <span class="badge ${badgeClass}">
                        ${estado}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Filtrar asistencias
function filtrarAsistencias() {
    loadAsistencias();
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('fechaInicio').value = '';
    document.getElementById('fechaFin').value = '';
    loadAsistencias();
}

// Exportar datos
function exportarAsistencias() {
    if (asistencias.length === 0) {
        showMessage('No hay datos para exportar', 'error');
        return;
    }
    
    const csvContent = [
        ['Empleado', 'Email', 'Fecha', 'Entrada', 'Salida', 'Estado'],
        ...asistencias.map(asist => [
            asist.nombre,
            asist.email,
            asist.fecha ? new Date(asist.fecha).toLocaleDateString('es-ES') : '-',
            asist.hora_entrada || '-',
            asist.hora_salida || '-',
            asist.estado || 'Sin registros'
        ])
    ].map(row => row.join(',')).join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencias_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Mostrar mensaje
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message message-${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Logout
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        window.location.href = '/login';
    }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    showTab('dashboard');
    
    // Cerrar modales al hacer click fuera
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
});
