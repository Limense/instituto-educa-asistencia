/**
 * Instituto Educa - Aplicación Principal
 * Sistema de Control de Asistencia v2.0 - VERSIÓN LIMPIA
 */

// Configuración global
const CONFIG = {
    FECHA_INICIO: new Date(2025, 0, 1),
    FECHA_FIN: new Date(2025, 11, 31),
    HORAS_DIARIAS: 8,
    HORAS_MENSUALES: 160,
    ROLES: {
        administrator: { name: 'Administrador', color: '#DC3545', icon: 'fas fa-crown' },
        supervisor: { name: 'Supervisor', color: '#FFC107', icon: 'fas fa-user-tie' },
        employee: { name: 'Empleado', color: '#28A745', icon: 'fas fa-user' },
        guest: { name: 'Invitado', color: '#6C757D', icon: 'fas fa-user-clock' }
    }
};

// Estado global de la aplicación
window.AppState = {
    currentUser: null,
    currentView: 'dashboard',
    permissions: null,
    sessionId: null,
    isLoading: false
};

// Función para mostrar notificaciones toast
function showToast(message, type = 'info') {
    console.log(`Toast: ${message} (${type})`);
    
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 350px;
        `;
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const colors = {
        success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
        error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
        warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
        info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
    };
    
    const color = colors[type] || colors.info;
    
    toast.style.cssText = `
        background: ${color.bg};
        color: ${color.text};
        border: 1px solid ${color.border};
        padding: 12px 16px;
        margin-bottom: 8px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        font-size: 14px;
        animation: slideInRight 0.3s ease;
        cursor: pointer;
    `;
    
    toast.innerHTML = `${icons[type] || icons.info} ${message}`;
    
    toast.onclick = () => toast.remove();
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// CSS para animaciones de toast
if (!document.getElementById('toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Función de inicialización cuando se autentica un usuario
function initializeApp(user) {
    console.log('🎓 Inicializando aplicación para:', user.username);
    
    // Mostrar aplicación principal
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Actualizar información del usuario
    updateUserInfo(user);
    
    // Generar menú de navegación
    generateNavigationMenu(user);
    
    // Cargar vista inicial
    loadView('dashboard');
    
    showToast(`Bienvenido ${getUserDisplayName(user)}`, 'success');
}

function updateUserInfo(user) {
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) userNameEl.textContent = getUserDisplayName(user);
    if (userRoleEl) userRoleEl.textContent = CONFIG.ROLES[user.role]?.name || user.role;
    if (userAvatarEl) {
        userAvatarEl.textContent = getUserDisplayName(user).charAt(0).toUpperCase();
        userAvatarEl.style.backgroundColor = CONFIG.ROLES[user.role]?.color || '#6C757D';
    }
}

function generateNavigationMenu(user) {
    const menuItems = document.getElementById('menuItems');
    const navigationMenu = document.getElementById('navigationMenu');
    
    if (!menuItems) return;
    
    const menuConfig = {
        administrator: [
            { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard', view: 'dashboard' },
            { id: 'users', icon: 'fas fa-users', label: 'Usuarios', view: 'users' },
            { id: 'attendance', icon: 'fas fa-clock', label: 'Asistencia', view: 'attendance' },
            { id: 'reports', icon: 'fas fa-chart-bar', label: 'Reportes', view: 'reports' },
            { id: 'departments', icon: 'fas fa-building', label: 'Departamentos', view: 'departments' },
            { id: 'settings', icon: 'fas fa-cog', label: 'Configuración', view: 'settings' }
        ],
        supervisor: [
            { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard', view: 'dashboard' },
            { id: 'attendance', icon: 'fas fa-clock', label: 'Asistencia', view: 'attendance' },
            { id: 'team', icon: 'fas fa-users', label: 'Mi Equipo', view: 'team' },
            { id: 'reports', icon: 'fas fa-chart-bar', label: 'Reportes', view: 'reports' }
        ],
        employee: [
            { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard', view: 'dashboard' },
            { id: 'attendance', icon: 'fas fa-clock', label: 'Mi Asistencia', view: 'attendance' },
            { id: 'profile', icon: 'fas fa-user', label: 'Mi Perfil', view: 'profile' }
        ],
        guest: [
            { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard', view: 'dashboard' },
            { id: 'info', icon: 'fas fa-info-circle', label: 'Información', view: 'info' }
        ]
    };
    
    const items = menuConfig[user.role] || menuConfig.employee;
    
    // Generar menú lateral
    menuItems.innerHTML = items.map(item => `
        <li class="menu-item">
            <a href="#" onclick="loadView('${item.view}')" class="menu-link">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        </li>
    `).join('');
    
    // Header limpio sin botones duplicados
    if (navigationMenu) {
        navigationMenu.innerHTML = '';
    }
}

function loadView(viewName) {
    console.log(`📄 Cargando vista: ${viewName}`);
    
    // Actualizar estado global
    window.AppState.currentView = viewName;
    
    // Marcar elemento activo en el menú
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeMenuItem = document.querySelector(`[onclick="loadView('${viewName}')"]`)?.closest('.menu-item');
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }
    
    // Cargar vista correspondiente
    switch (viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'attendance':
            loadAttendanceView();
            break;
        case 'users':
            loadUsersView();
            break;
        case 'reports':
            loadReportsView();
            break;
        case 'profile':
            loadProfileView();
            break;
        case 'settings':
            loadSettingsView();
            break;
        default:
            loadDashboard();
    }
}

function loadDashboard() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <h1><i class="fas fa-tachometer-alt"></i> Dashboard</h1>
                <p>Resumen de tu actividad y asistencia</p>
            </div>
            
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="todayHours">-- hrs</h3>
                        <p>Horas Hoy</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-week"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="weekHours">-- hrs</h3>
                        <p>Horas esta Semana</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-month"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="monthHours">-- hrs</h3>
                        <p>Horas este Mes</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="attendanceRate">--%</h3>
                        <p>Tasa de Asistencia</p>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-actions">
                <div class="quick-actions">
                    <h3>Acciones Rápidas</h3>
                    <div class="action-buttons">
                        <button id="clockInBtn" onclick="clockIn()" class="btn btn-success">
                            <i class="fas fa-sign-in-alt"></i> Marcar Entrada
                        </button>
                        <button id="clockOutBtn" onclick="clockOut()" class="btn btn-warning">
                            <i class="fas fa-sign-out-alt"></i> Marcar Salida
                        </button>
                        <button onclick="loadView('attendance')" class="btn btn-info">
                            <i class="fas fa-history"></i> Ver Historial
                        </button>
                    </div>
                </div>
                
                <div class="recent-activity">
                    <h3>Actividad Reciente</h3>
                    <div id="recentActivity" class="activity-list">
                        <div class="loading">Cargando actividad...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Cargar datos del dashboard
    loadDashboardData();
}

async function loadDashboardData() {
    try {
        console.log('📊 Cargando datos del dashboard...');
        
        const apiService = new ApiService();
        
        // Cargar resumen de asistencia
        try {
            const summaryResult = await apiService.get('/attendance/summary');
            if (summaryResult.success) {
                const summary = summaryResult.data;
                document.getElementById('weekHours').textContent = `${summary.weekHours || 0} hrs`;
                document.getElementById('monthHours').textContent = `${summary.monthHours || 0} hrs`;
                document.getElementById('attendanceRate').textContent = `${summary.attendanceRate || 0}%`;
            } else {
                throw new Error('No se pudo cargar el resumen');
            }
        } catch (error) {
            console.warn('Usando datos de ejemplo para resumen:', error.message);
            document.getElementById('weekHours').textContent = '32 hrs';
            document.getElementById('monthHours').textContent = '128 hrs';
            document.getElementById('attendanceRate').textContent = '95%';
        }
        
        // Cargar estado de hoy
        try {
            const todayResult = await apiService.get('/attendance/today');
            if (todayResult.success && todayResult.data) {
                const todayData = todayResult.data;
                const todayHours = todayData.total_hours ? 
                    parseFloat(todayData.total_hours).toFixed(1) : '0.0';
                document.getElementById('todayHours').textContent = `${todayHours} hrs`;
            } else {
                document.getElementById('todayHours').textContent = '0.0 hrs';
            }
        } catch (error) {
            console.warn('No se pudo cargar datos de hoy:', error.message);
            document.getElementById('todayHours').textContent = '0.0 hrs';
        }
        
        // Actualizar botones de asistencia
        if (typeof updateAttendanceButtons === 'function') {
            updateAttendanceButtons();
        }
        
        // Cargar actividad reciente
        loadRecentActivity();
        
        console.log('✅ Datos del dashboard cargados');
        
    } catch (error) {
        console.error('❌ Error general cargando dashboard:', error);
        showToast('Error cargando datos del dashboard', 'error');
    }
}

async function loadRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer) return;
    
    try {
        const apiService = new ApiService();
        const response = await apiService.get('/attendance?limit=5');
        
        if (response.success && response.attendance && response.attendance.length > 0) {
            const activities = response.attendance.slice(0, 5);
            
            activityContainer.innerHTML = activities.map(activity => {
                const date = new Date(activity.created_at).toLocaleDateString('es-ES');
                const timeIn = activity.clock_in ? 
                    new Date(activity.clock_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--';
                const timeOut = activity.clock_out ? 
                    new Date(activity.clock_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--';
                
                return `
                    <div class="activity-item">
                        <div class="activity-date">${date}</div>
                        <div class="activity-time">
                            Entrada: ${timeIn} | Salida: ${timeOut}
                        </div>
                        <div class="activity-status status-${activity.status}">
                            ${getStatusLabel(activity.status)}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            activityContainer.innerHTML = '<div class="no-activity">No hay actividad reciente</div>';
        }
    } catch (error) {
        console.error('Error cargando actividad reciente:', error);
        activityContainer.innerHTML = '<div class="no-activity">Error cargando actividad</div>';
    }
}

function getUserDisplayName(user) {
    if (user && user.profile) {
        const profile = typeof user.profile === 'string' ? 
            JSON.parse(user.profile) : user.profile;
        return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.username;
    }
    return user ? user.username : 'Usuario';
}

function loadAttendanceView() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="view-container">
            <div class="view-header">
                <h1><i class="fas fa-clock"></i> Gestión de Asistencia</h1>
                <div class="view-actions">
                    <button onclick="loadAttendanceData('today')" class="btn btn-secondary">Hoy</button>
                    <button onclick="loadAttendanceData('week')" class="btn btn-secondary">Esta Semana</button>
                    <button onclick="loadAttendanceData('month')" class="btn btn-primary">Este Mes</button>
                </div>
            </div>
            
            <div class="attendance-summary">
                <div class="summary-stats">
                    <div class="summary-card">
                        <h3>Horas Totales</h3>
                        <div class="summary-value" id="totalHours">-- hrs</div>
                    </div>
                    <div class="summary-card">
                        <h3>Días Presentes</h3>
                        <div class="summary-value" id="daysPresent">--/--</div>
                    </div>
                    <div class="summary-card">
                        <h3>Días Tarde</h3>
                        <div class="summary-value" id="daysLate">--</div>
                    </div>
                </div>
            </div>
            
            <div class="attendance-table">
                <div id="attendanceData" class="data-table">
                    <div class="loading">Cargando registros de asistencia...</div>
                </div>
            </div>
        </div>
    `;
    
    loadAttendanceData();
}

async function loadAttendanceData(period = 'month') {
    try {
        const attendanceContainer = document.getElementById('attendanceData');
        if (!attendanceContainer) return;
        
        const apiService = new ApiService();
        
        // Actualizar botones activos
        document.querySelectorAll('.view-actions .btn').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        });
        
        const activeBtn = document.querySelector(`[onclick="loadAttendanceData('${period}')"]`);
        if (activeBtn) {
            activeBtn.classList.add('btn-primary');
            activeBtn.classList.remove('btn-secondary');
        }
        
        const response = await apiService.get(`/attendance?period=${period}`);
        
        if (response.success && response.attendance && response.attendance.length > 0) {
            const records = response.attendance;
            
            // Calcular estadísticas
            let totalHours = 0;
            let daysPresent = 0;
            let daysLate = 0;
            
            records.forEach(record => {
                if (record.total_hours) {
                    totalHours += parseFloat(record.total_hours) || 0;
                }
                if (record.status === 'present') daysPresent++;
                if (record.status === 'late') daysLate++;
            });
            
            // Actualizar estadísticas
            const totalHoursEl = document.getElementById('totalHours');
            const daysPresentEl = document.getElementById('daysPresent');
            const daysLateEl = document.getElementById('daysLate');
            
            if (totalHoursEl) totalHoursEl.textContent = `${totalHours.toFixed(1)} hrs`;
            if (daysPresentEl) daysPresentEl.textContent = `${daysPresent}/${records.length}`;
            if (daysLateEl) daysLateEl.textContent = daysLate;
            
            // Mostrar tabla
            attendanceContainer.innerHTML = `
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
                        ${records.map(record => {
                            const date = record.created_at ? 
                                new Date(record.created_at).toLocaleDateString('es-ES') : '--';
                            const clockIn = record.clock_in ? 
                                new Date(record.clock_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--';
                            const clockOut = record.clock_out ? 
                                new Date(record.clock_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--';
                            const hours = record.total_hours ? 
                                `${parseFloat(record.total_hours).toFixed(1)} hrs` : '--';
                            
                            return `
                                <tr>
                                    <td>${date}</td>
                                    <td>${clockIn}</td>
                                    <td>${clockOut}</td>
                                    <td>${hours}</td>
                                    <td><span class="status ${record.status}">${getStatusLabel(record.status)}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } else {
            // Sin registros
            const totalHoursEl = document.getElementById('totalHours');
            const daysPresentEl = document.getElementById('daysPresent');
            const daysLateEl = document.getElementById('daysLate');
            
            if (totalHoursEl) totalHoursEl.textContent = '0 hrs';
            if (daysPresentEl) daysPresentEl.textContent = '0/0';
            if (daysLateEl) daysLateEl.textContent = '0';
            
            attendanceContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-clock"></i>
                    <h3>No hay registros de asistencia</h3>
                    <p>Comienza marcando tu entrada desde el dashboard.</p>
                    <button onclick="loadView('dashboard')" class="btn btn-primary">Ir al Dashboard</button>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error cargando datos de asistencia:', error);
        const attendanceContainer = document.getElementById('attendanceData');
        if (attendanceContainer) {
            attendanceContainer.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error cargando registros</h3>
                    <p>${error.message}</p>
                    <button onclick="loadAttendanceData('${period}')" class="btn btn-secondary">Reintentar</button>
                </div>
            `;
        }
    }
}

// Funciones de asistencia
async function clockIn() {
    try {
        showToast('Marcando entrada...', 'info');
        
        const apiService = new ApiService();
        
        // Verificar estado actual primero
        const statusResult = await apiService.get('/attendance/status');
        if (statusResult.success && !statusResult.data.canClockIn) {
            showToast('Ya has marcado entrada hoy', 'warning');
            return;
        }
        
        const result = await apiService.post('/attendance/clock-in', {
            location: {
                latitude: null,
                longitude: null,
                address: 'Oficina Principal'
            },
            observations: 'Entrada manual desde dashboard'
        });
        
        if (result.success) {
            showToast('✅ Entrada registrada correctamente', 'success');
            // Recargar datos del dashboard
            loadDashboardData();
            loadRecentActivity();
            updateAttendanceButtons();
        } else {
            throw new Error(result.message || 'Error al registrar entrada');
        }
        
    } catch (error) {
        console.error('Error marcando entrada:', error);
        let errorMsg = 'Error al marcar entrada';
        
        if (error.message.includes('429')) {
            errorMsg = 'Demasiadas peticiones. Espera un momento y vuelve a intentar.';
        } else if (error.message.includes('Ya existe un registro')) {
            errorMsg = 'Ya has marcado entrada hoy';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        showToast('❌ ' + errorMsg, 'error');
    }
}

async function clockOut() {
    try {
        showToast('Marcando salida...', 'info');
        
        const apiService = new ApiService();
        
        // Verificar estado actual primero
        const statusResult = await apiService.get('/attendance/status');
        if (statusResult.success && !statusResult.data.canClockOut) {
            showToast('No puedes marcar salida sin haber marcado entrada', 'warning');
            return;
        }
        
        const result = await apiService.post('/attendance/clock-out', {
            location: {
                latitude: null,
                longitude: null,
                address: 'Oficina Principal'
            },
            observations: 'Salida manual desde dashboard'
        });
        
        if (result.success) {
            showToast('✅ Salida registrada correctamente', 'success');
            // Recargar datos del dashboard
            loadDashboardData();
            loadRecentActivity();
            updateAttendanceButtons();
        } else {
            throw new Error(result.message || 'Error al registrar salida');
        }
        
    } catch (error) {
        console.error('Error marcando salida:', error);
        let errorMsg = 'Error al marcar salida';
        
        if (error.message.includes('429')) {
            errorMsg = 'Demasiadas peticiones. Espera un momento y vuelve a intentar.';
        } else if (error.message.includes('No se encontró registro')) {
            errorMsg = 'Debes marcar entrada antes de marcar salida';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        showToast('❌ ' + errorMsg, 'error');
    }
}

// Función para actualizar el estado de los botones de asistencia
async function updateAttendanceButtons() {
    try {
        const apiService = new ApiService();
        const statusResult = await apiService.get('/attendance/status');
        
        if (statusResult.success) {
            const clockInBtn = document.getElementById('clockInBtn');
            const clockOutBtn = document.getElementById('clockOutBtn');
            
            if (clockInBtn) {
                clockInBtn.disabled = !statusResult.data.canClockIn;
                clockInBtn.style.opacity = statusResult.data.canClockIn ? '1' : '0.5';
            }
            
            if (clockOutBtn) {
                clockOutBtn.disabled = !statusResult.data.canClockOut;
                clockOutBtn.style.opacity = statusResult.data.canClockOut ? '1' : '0.5';
            }
        }
    } catch (error) {
        console.error('Error updating attendance buttons:', error);
    }
}

// Funciones auxiliares
function getStatusLabel(status) {
    const labels = {
        'present': 'Presente',
        'absent': 'Ausente',
        'late': 'Tardío',
        'early': 'Temprano'
    };
    return labels[status] || status;
}

// Funciones básicas para otras vistas
function loadUsersView() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="view-container">
            <h1><i class="fas fa-users"></i> Gestión de Usuarios</h1>
            <p>Funcionalidad en desarrollo...</p>
        </div>
    `;
}

function loadReportsView() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="view-container">
            <h1><i class="fas fa-chart-bar"></i> Reportes</h1>
            <p>Funcionalidad en desarrollo...</p>
        </div>
    `;
}

function loadProfileView() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="view-container">
            <h1><i class="fas fa-user"></i> Mi Perfil</h1>
            <p>Funcionalidad en desarrollo...</p>
        </div>
    `;
}

function loadSettingsView() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="view-container">
            <h1><i class="fas fa-cog"></i> Configuración</h1>
            <p>Funcionalidad en desarrollo...</p>
        </div>
    `;
}

// Evento para logout
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (window.authManager && typeof window.authManager.logout === 'function') {
                window.authManager.logout();
            } else {
                // Fallback
                document.getElementById('mainApp').classList.add('hidden');
                document.getElementById('loginScreen').classList.remove('hidden');
                showToast('Sesión cerrada', 'info');
            }
        });
    }
});

console.log('✅ App principal cargada correctamente (versión limpia)');
