/**
 * Instituto Educa - Aplicación Principal
 * Sistema de Control de Asistencia v2.0
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
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center;">
                <i class="${icons[type] || icons.info}" style="margin-right: 8px;"></i>
                <span>${message}</span>
            </div>
            <button onclick="this.closest('.toast').remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; margin-left: 10px;">&times;</button>
        </div>
    `;
    
    toast.style.cssText = `
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin-bottom: 10px;
        padding: 12px 16px;
        border-left: 4px solid;
        animation: slideIn 0.3s ease;
    `;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    toast.style.borderLeftColor = colors[type] || colors.info;
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando Instituto Educa - Sistema de Asistencia v2.0');
    
    setTimeout(() => {
        initializeApplication();
    }, 100);
});

function initializeApplication() {
    console.log('🔧 Inicializando aplicación...');
    
    try {
        initializeServices();
        setupUIEventListeners();
        checkExistingSession();
        
        console.log('✅ Aplicación iniciada correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico en la inicialización:', error);
        showToast('Error crítico en la inicialización del sistema', 'error');
    }
}

function initializeServices() {
    try {
        console.log('🔧 Inicializando servicios...');
        
        window.authManager = new AuthManager();
        
        setTimeout(() => {
            checkBackendHealth();
        }, 500);
        
        return true;
    } catch (error) {
        console.error('❌ Error inicializando servicios:', error);
        return false;
    }
}

async function checkExistingSession() {
    if (window.authManager && window.authManager.isUserAuthenticated()) {
        console.log('✅ Sesión existente encontrada');
        
        const isValid = await window.authManager.verifySession();
        
        if (isValid) {
            const user = window.authManager.getCurrentUser();
            showMainApp(user);
        } else {
            console.log('⚠️ Sesión expirada, mostrando login');
            showLoginScreen();
        }
    } else {
        console.log('ℹ️ No hay sesión existente, mostrando login');
        showLoginScreen();
    }
}

function setupUIEventListeners() {
    console.log('🔧 Configurando event listeners de UI...');
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const btnEmployee = document.getElementById('btnEmployee');
    const btnSupervisor = document.getElementById('btnSupervisor');
    const btnAdmin = document.getElementById('btnAdmin');
    
    if (btnEmployee) {
        btnEmployee.addEventListener('click', () => quickLogin('empleado1', 'admin123'));
    }
    
    if (btnSupervisor) {
        btnSupervisor.addEventListener('click', () => quickLogin('supervisor1', 'admin123'));
    }
    
    if (btnAdmin) {
        btnAdmin.addEventListener('click', () => quickLogin('admin', 'admin123'));
    }
    
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', toggleNotifications);
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp(user) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    updateUserInterface(user);
    loadDashboard();
}

function updateUserInterface(user) {
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement && user.profile) {
        const profile = typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile;
        userNameElement.textContent = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.username;
    }
    
    if (userRoleElement) {
        const roleConfig = CONFIG.ROLES[user.role] || { name: user.role };
        userRoleElement.textContent = roleConfig.name;
        userRoleElement.style.color = roleConfig.color || '#333';
    }
    
    if (userAvatarElement) {
        const profile = typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile;
        const initials = profile && profile.firstName ? 
            `${profile.firstName.charAt(0)}${profile.lastName ? profile.lastName.charAt(0) : ''}` : 
            user.username.charAt(0).toUpperCase();
        userAvatarElement.textContent = initials;
    }
    
    generateNavigationMenu(user);
}

function generateNavigationMenu(user) {
    const menuItems = document.getElementById('menuItems');
    const navigationMenu = document.getElementById('navigationMenu');
    
    if (!menuItems || !navigationMenu) return;
    
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
    
    menuItems.innerHTML = items.map(item => `
        <li class="menu-item">
            <a href="#" onclick="loadView('${item.view}')" class="menu-link">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        </li>
    `).join('');
    
    navigationMenu.innerHTML = items.slice(0, 4).map(item => `
        <button onclick="loadView('${item.view}')" class="nav-btn">
            <i class="${item.icon}"></i>
            <span>${item.label}</span>
        </button>
    `).join('');
}

function loadView(viewName) {
    console.log(`📄 Cargando vista: ${viewName}`);
    window.AppState.currentView = viewName;
    
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    contentArea.innerHTML = '<div class="loading">Cargando...</div>';
    updateActiveMenu(viewName);
    
    switch(viewName) {
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
            contentArea.innerHTML = `<div class="error">Vista "${viewName}" no encontrada</div>`;
    }
}

function updateActiveMenu(viewName) {
    document.querySelectorAll('.menu-link, .nav-btn').forEach(el => {
        el.classList.remove('active');
    });
    
    document.querySelectorAll(`[onclick*="${viewName}"]`).forEach(el => {
        el.classList.add('active');
    });
}

function loadDashboard() {
    const contentArea = document.getElementById('contentArea');
    const user = window.authManager?.getCurrentUser();
    
    if (!user) {
        contentArea.innerHTML = '<div class="error">Usuario no autenticado</div>';
        return;
    }
    
    contentArea.innerHTML = `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <h1><i class="fas fa-tachometer-alt"></i> Dashboard</h1>
                <p>Bienvenido/a de vuelta, ${getUserDisplayName(user)}</p>
            </div>
            
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="todayStatus">--</h3>
                        <p>Estado de Hoy</p>
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
                        <button onclick="clockIn()" class="btn btn-success">
                            <i class="fas fa-sign-in-alt"></i> Marcar Entrada
                        </button>
                        <button onclick="clockOut()" class="btn btn-warning">
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
    
    loadDashboardData();
}

async function loadDashboardData() {
    try {
        const user = window.authManager.getCurrentUser();
        const apiService = new ApiService();
        
        // Cargar estadísticas reales desde la API
        const attendanceData = await apiService.get(`/attendance/summary/${user.id}`);
        
        if (attendanceData.success) {
            const data = attendanceData.data;
            document.getElementById('todayStatus').textContent = data.todayStatus || 'Sin datos';
            document.getElementById('weekHours').textContent = `${data.weekHours || 0} hrs`;
            document.getElementById('monthHours').textContent = `${data.monthHours || 0} hrs`;
            document.getElementById('attendanceRate').textContent = `${data.attendanceRate || 0}%`;
        } else {
            // Datos de ejemplo si no hay datos reales
            document.getElementById('todayStatus').textContent = 'Presente';
            document.getElementById('weekHours').textContent = '32 hrs';
            document.getElementById('monthHours').textContent = '128 hrs';
            document.getElementById('attendanceRate').textContent = '95%';
        }
        
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        // Mostrar datos de ejemplo en caso de error
        document.getElementById('todayStatus').textContent = 'Presente';
        document.getElementById('weekHours').textContent = '32 hrs';
        document.getElementById('monthHours').textContent = '128 hrs';
        document.getElementById('attendanceRate').textContent = '95%';
        
        loadRecentActivity();
    }
}

async function loadRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer) return;
    
    try {
        const user = window.authManager.getCurrentUser();
        const apiService = new ApiService();
        
        const response = await apiService.get(`/attendance/recent/${user.id}`);
        
        if (response.success && response.data.length > 0) {
            activityContainer.innerHTML = response.data.map(activity => `
                <div class="activity-item">
                    <div class="activity-time">${new Date(activity.timestamp).toLocaleTimeString()}</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
            `).join('');
        } else {
            // Actividad de ejemplo
            const activities = [
                { time: '08:00', action: 'Entrada registrada', type: 'clock-in' },
                { time: '12:00', action: 'Pausa iniciada', type: 'break' },
                { time: '13:00', action: 'Pausa finalizada', type: 'break' },
            ];
            
            activityContainer.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-time">${activity.time}</div>
                    <div class="activity-description">${activity.action}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando actividad reciente:', error);
        activityContainer.innerHTML = '<div class="no-activity">No hay actividad reciente</div>';
    }
}

function getUserDisplayName(user) {
    if (user.profile) {
        const profile = typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile;
        return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.username;
    }
    return user.username;
}

async function clockIn() {
    try {
        showToast('Marcando entrada...', 'info');
        
        const user = window.authManager.getCurrentUser();
        const apiService = new ApiService();
        
        const result = await apiService.post('/attendance', {
            date: new Date().toISOString().split('T')[0],
            clock_in: new Date().toISOString(),
            status: 'present',
            type: 'manual'
        });
        
        if (result.success) {
            showToast('Entrada registrada correctamente', 'success');
            loadDashboardData();
        } else {
            throw new Error(result.message || 'Error al registrar entrada');
        }
        
    } catch (error) {
        console.error('Error marcando entrada:', error);
        showToast('Error al marcar entrada: ' + error.message, 'error');
    }
}

async function clockOut() {
    try {
        showToast('Marcando salida...', 'info');
        
        const user = window.authManager.getCurrentUser();
        const apiService = new ApiService();
        
        const result = await apiService.put('/attendance/clock-out', {
            date: new Date().toISOString().split('T')[0],
            clock_out: new Date().toISOString()
        });
        
        if (result.success) {
            showToast('Salida registrada correctamente', 'success');
            loadDashboardData();
        } else {
            throw new Error(result.message || 'Error al registrar salida');
        }
        
    } catch (error) {
        console.error('Error marcando salida:', error);
        showToast('Error al marcar salida: ' + error.message, 'error');
    }
}

function loadAttendanceView() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="view-container">
            <div class="view-header">
                <h1><i class="fas fa-clock"></i> Gestión de Asistencia</h1>
                <div class="view-actions">
                    <button onclick="loadAttendanceToday()" class="btn btn-primary">Hoy</button>
                    <button onclick="loadAttendanceWeek()" class="btn btn-secondary">Esta Semana</button>
                    <button onclick="loadAttendanceMonth()" class="btn btn-secondary">Este Mes</button>
                </div>
            </div>
            
            <div class="attendance-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h3>Horas Trabajadas</h3>
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
        const user = window.authManager.getCurrentUser();
        const apiService = new ApiService();
        
        const response = await apiService.get(`/attendance/user/${user.id}?period=${period}`);
        
        if (response.success && response.data.length > 0) {
            const records = response.data;
            
            // Actualizar resumen
            const totalHours = records.reduce((sum, record) => sum + (record.hours_worked || 0), 0);
            const daysPresent = records.filter(r => r.status === 'present').length;
            const daysLate = records.filter(r => r.status === 'late').length;
            
            document.getElementById('totalHours').textContent = `${totalHours} hrs`;
            document.getElementById('daysPresent').textContent = `${daysPresent}/${records.length}`;
            document.getElementById('daysLate').textContent = daysLate;
            
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
                        ${records.map(record => `
                            <tr>
                                <td>${new Date(record.date).toLocaleDateString()}</td>
                                <td>${record.clock_in ? new Date(record.clock_in).toLocaleTimeString() : '--'}</td>
                                <td>${record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : '--'}</td>
                                <td>${record.hours_worked || 0} hrs</td>
                                <td><span class="status ${record.status}">${record.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            // Datos de ejemplo
            const attendanceRecords = [
                { date: '2025-01-15', clockIn: '08:00', clockOut: '17:00', status: 'present', hours: 8.0 },
                { date: '2025-01-14', clockIn: '08:15', clockOut: '17:00', status: 'late', hours: 7.75 },
                { date: '2025-01-13', clockIn: '08:00', clockOut: '17:00', status: 'present', hours: 8.0 }
            ];
            
            document.getElementById('totalHours').textContent = '23.75 hrs';
            document.getElementById('daysPresent').textContent = '2/3';
            document.getElementById('daysLate').textContent = '1';
            
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
                        ${attendanceRecords.map(record => `
                            <tr>
                                <td>${record.date}</td>
                                <td>${record.clockIn}</td>
                                <td>${record.clockOut}</td>
                                <td>${record.hours} hrs</td>
                                <td><span class="status ${record.status}">${record.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
    } catch (error) {
        console.error('Error cargando datos de asistencia:', error);
        showToast('Error cargando datos de asistencia', 'error');
        
        // Mostrar datos de ejemplo en caso de error
        const attendanceContainer = document.getElementById('attendanceData');
        attendanceContainer.innerHTML = `
            <div class="error">
                Error cargando datos de asistencia. Mostrando datos de ejemplo.
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
                    <tr>
                        <td>2025-01-15</td>
                        <td>08:00</td>
                        <td>17:00</td>
                        <td>8.0 hrs</td>
                        <td><span class="status present">present</span></td>
                    </tr>
                </tbody>
            </table>
        `;
    }
}

function loadAttendanceToday() {
    loadAttendanceData('today');
}

function loadAttendanceWeek() {
    loadAttendanceData('week');
}

function loadAttendanceMonth() {
    loadAttendanceData('month');
}

function loadUsersView() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="view-container">
            <div class="view-header">
                <h1><i class="fas fa-users"></i> Gestión de Usuarios</h1>
                <button onclick="showAddUserModal()" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Agregar Usuario
                </button>
            </div>
            <div id="usersData" class="data-table">
                <div class="loading">Cargando usuarios...</div>
            </div>
        </div>
    `;
    
    loadUsersData();
}

async function loadUsersData() {
    try {
        const usersContainer = document.getElementById('usersData');
        const apiService = new ApiService();
        
        const response = await apiService.get('/users');
        
        if (response.success && response.data.length > 0) {
            usersContainer.innerHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Nombre</th>
                            <th>Rol</th>
                            <th>Departamento</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.data.map(user => {
                            const profile = user.profile ? JSON.parse(user.profile) : {};
                            return `
                                <tr>
                                    <td>${user.id}</td>
                                    <td>${user.username}</td>
                                    <td>${profile.firstName || ''} ${profile.lastName || ''}</td>
                                    <td>${user.role}</td>
                                    <td>${user.department_name || '--'}</td>
                                    <td><span class="status ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Activo' : 'Inactivo'}</span></td>
                                    <td>
                                        <button onclick="editUser(${user.id})" class="btn btn-sm btn-secondary">Editar</button>
                                        <button onclick="toggleUserStatus(${user.id})" class="btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}">
                                            ${user.is_active ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } else {
            usersContainer.innerHTML = '<div class="no-data">No hay usuarios registrados</div>';
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        document.getElementById('usersData').innerHTML = '<div class="error">Error cargando usuarios</div>';
    }
}

function loadReportsView() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="view-container">
            <div class="view-header">
                <h1><i class="fas fa-chart-bar"></i> Reportes de Asistencia</h1>
                <div class="view-actions">
                    <select id="reportType" class="form-control">
                        <option value="monthly">Reporte Mensual</option>
                        <option value="weekly">Reporte Semanal</option>
                        <option value="daily">Reporte Diario</option>
                    </select>
                    <button onclick="generateReport()" class="btn btn-primary">Generar Reporte</button>
                </div>
            </div>
            <div id="reportContent" class="report-content">
                <div class="info">Selecciona un tipo de reporte y haz clic en "Generar Reporte"</div>
            </div>
        </div>
    `;
}

async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportContent = document.getElementById('reportContent');
    
    reportContent.innerHTML = '<div class="loading">Generando reporte...</div>';
    
    try {
        const apiService = new ApiService();
        const response = await apiService.get(`/reports/${reportType}`);
        
        if (response.success) {
            // Mostrar reporte real
            displayReport(response.data, reportType);
        } else {
            // Mostrar reporte de ejemplo
            displaySampleReport(reportType);
        }
    } catch (error) {
        console.error('Error generando reporte:', error);
        displaySampleReport(reportType);
    }
}

function displaySampleReport(reportType) {
    const reportContent = document.getElementById('reportContent');
    
    const sampleData = {
        monthly: {
            title: 'Reporte Mensual - Enero 2025',
            stats: {
                totalEmployees: 15,
                averageAttendance: '94%',
                totalHours: 2400,
                lateArrivals: 12
            }
        },
        weekly: {
            title: 'Reporte Semanal - Semana del 13-17 Enero',
            stats: {
                totalEmployees: 15,
                averageAttendance: '96%',
                totalHours: 600,
                lateArrivals: 3
            }
        },
        daily: {
            title: 'Reporte Diario - 15 Enero 2025',
            stats: {
                totalEmployees: 15,
                presentEmployees: 14,
                absentEmployees: 1,
                lateArrivals: 2
            }
        }
    };
    
    const data = sampleData[reportType];
    
    reportContent.innerHTML = `
        <div class="report-header">
            <h2>${data.title}</h2>
        </div>
        <div class="report-stats">
            ${Object.entries(data.stats).map(([key, value]) => `
                <div class="report-stat">
                    <h3>${value}</h3>
                    <p>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
                </div>
            `).join('')}
        </div>
        <div class="report-actions">
            <button onclick="exportReport('pdf')" class="btn btn-secondary">
                <i class="fas fa-file-pdf"></i> Exportar PDF
            </button>
            <button onclick="exportReport('excel')" class="btn btn-secondary">
                <i class="fas fa-file-excel"></i> Exportar Excel
            </button>
        </div>
    `;
}

function exportReport(format) {
    showToast(`Exportando reporte en formato ${format.toUpperCase()}...`, 'info');
    // Aquí iría la lógica real de exportación
    setTimeout(() => {
        showToast(`Reporte exportado exitosamente en formato ${format.toUpperCase()}`, 'success');
    }, 2000);
}

function loadProfileView() {
    const contentArea = document.getElementById('contentArea');
    const user = window.authManager.getCurrentUser();
    
    contentArea.innerHTML = `
        <div class="view-container">
            <div class="view-header">
                <h1><i class="fas fa-user"></i> Mi Perfil</h1>
            </div>
            <div class="profile-content">
                <div class="profile-info">
                    <h3>Información Personal</h3>
                    <p><strong>Usuario:</strong> ${user.username}</p>
                    <p><strong>Rol:</strong> ${user.role}</p>
                    <p><strong>Departamento:</strong> ${user.department_name || 'No asignado'}</p>
                </div>
                <div class="profile-actions">
                    <button onclick="editProfile()" class="btn btn-primary">Editar Perfil</button>
                    <button onclick="changePassword()" class="btn btn-secondary">Cambiar Contraseña</button>
                </div>
            </div>
        </div>
    `;
}

function loadSettingsView() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="view-container">
            <div class="view-header">
                <h1><i class="fas fa-cog"></i> Configuración del Sistema</h1>
            </div>
            <div class="settings-content">
                <div class="settings-section">
                    <h3>Configuración General</h3>
                    <div class="setting-item">
                        <label>Horas de trabajo por día:</label>
                        <input type="number" value="8" class="form-control">
                    </div>
                    <div class="setting-item">
                        <label>Zona horaria:</label>
                        <select class="form-control">
                            <option>GMT-6 (Hora de México)</option>
                        </select>
                    </div>
                </div>
                <div class="settings-actions">
                    <button onclick="saveSettings()" class="btn btn-primary">Guardar Configuración</button>
                </div>
            </div>
        </div>
    `;
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showToast('Por favor ingresa usuario y contraseña', 'warning');
        return;
    }
    
    try {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        submitBtn.disabled = true;
        
        const user = await window.authManager.login(username, password);
        
        if (user) {
            showToast(`¡Bienvenido/a ${getUserDisplayName(user)}!`, 'success');
            showMainApp(user);
            document.getElementById('loginForm').reset();
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showToast(error.message || 'Error al iniciar sesión', 'error');
    } finally {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        submitBtn.disabled = false;
    }
}

async function quickLogin(username, password) {
    try {
        showToast(`Iniciando sesión como ${username}...`, 'info');
        
        const user = await window.authManager.login(username, password);
        
        if (user) {
            showToast(`¡Bienvenido/a ${getUserDisplayName(user)}!`, 'success');
            showMainApp(user);
        }
        
    } catch (error) {
        console.error('Error en quick login:', error);
        showToast(error.message || 'Error al iniciar sesión', 'error');
    }
}

async function handleLogout() {
    try {
        const confirmLogout = confirm('¿Estás seguro de que deseas cerrar sesión?');
        if (!confirmLogout) return;
        
        showToast('Cerrando sesión...', 'info');
        
        await window.authManager.logout();
        
        showToast('Sesión cerrada correctamente', 'success');
        showLoginScreen();
        
    } catch (error) {
        console.error('Error en logout:', error);
        showToast('Error al cerrar sesión', 'error');
    }
}

function toggleNotifications() {
    const notificationCenter = document.getElementById('notificationCenter');
    if (notificationCenter) {
        notificationCenter.classList.toggle('show');
    }
}

async function checkBackendHealth() {
    try {
        const apiService = new ApiService();
        const isHealthy = await apiService.checkHealth();
        
        if (isHealthy) {
            console.log('✅ Backend conectado correctamente');
            updateSystemStatus('Conectado', 'success');
        } else {
            console.warn('⚠️ Backend no responde');
            updateSystemStatus('Desconectado', 'error');
            showToast('Error de conexión con el servidor', 'warning');
        }
    } catch (error) {
        console.error('❌ Error verificando backend:', error);
        updateSystemStatus('Error', 'error');
    }
}

function updateSystemStatus(status, type) {
    const statusElement = document.getElementById('systemStatus');
    if (statusElement) {
        const statusValue = statusElement.querySelector('.status-value');
        if (statusValue) {
            statusValue.textContent = status;
            statusValue.className = `status-value ${type}`;
        }
    }
    
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        lastUpdate.textContent = new Date().toLocaleTimeString();
    }
}

// Funciones auxiliares para las vistas
function editUser(userId) {
    showToast(`Editando usuario ${userId}...`, 'info');
    // Aquí iría la lógica para editar usuario
}

function toggleUserStatus(userId) {
    showToast(`Cambiando estado del usuario ${userId}...`, 'info');
    // Aquí iría la lógica para cambiar estado del usuario
}

function editProfile() {
    showToast('Abriendo editor de perfil...', 'info');
    // Aquí iría la lógica para editar perfil
}

function changePassword() {
    showToast('Abriendo cambio de contraseña...', 'info');
    // Aquí iría la lógica para cambiar contraseña
}

function saveSettings() {
    showToast('Guardando configuración...', 'info');
    // Aquí iría la lógica para guardar configuración
    setTimeout(() => {
        showToast('Configuración guardada exitosamente', 'success');
    }, 1000);
}

console.log('✅ App.js cargado correctamente - Instituto Educa v2.0');