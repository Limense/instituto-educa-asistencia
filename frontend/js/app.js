// Configuración global actualizada
const CONFIG = {
    // Adaptado para Instituto Educa
    FECHA_INICIO: new Date(2025, 0, 1), // 1 enero 2025
    FECHA_FIN: new Date(2025, 11, 31),   // 31 diciembre 2025
    HORAS_DIARIAS: 8,
    HORAS_MENSUALES: 160,
    MODALIDADES: ['presencial', 'remoto', 'hibrido'],
    HORARIOS: {
        entrada_min: '06:00',
        entrada_max: '10:00',
        salida_min: '14:00',
        salida_max: '20:00'
    },
    ESTADOS: {
        pending: '⏳ Pendiente',
        approved: '✅ Aprobado',
        rejected: '❌ Rechazado',
        modified: '📝 Requiere modificación'
    },
    // Configuración del sistema de permisos
    ROLES: {
        administrator: { name: 'Administrador', color: '#DC3545', icon: 'fas fa-crown' },
        supervisor: { name: 'Supervisor', color: '#FFC107', icon: 'fas fa-user-tie' },
        employee: { name: 'Empleado', color: '#28A745', icon: 'fas fa-user' },
        guest: { name: 'Invitado', color: '#6C757D', icon: 'fas fa-user-clock' }
    }
};

// Función para mostrar notificaciones toast (definida temprano)
function showToast(message, type = 'info') {
    console.log(`Toast: ${message} (${type})`);
    
    // Crear contenedor si no existe
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
    
    // Definir iconos según tipo
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
    
    // Estilos base para el toast
    toast.style.cssText = `
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin-bottom: 10px;
        padding: 12px 16px;
        border-left: 4px solid;
        animation: slideIn 0.3s ease;
    `;
    
    // Colores según tipo
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    toast.style.borderLeftColor = colors[type] || colors.info;
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Estado global de la aplicación (refactorizado)
let AppState = {
    currentUser: null,
    currentView: 'dashboard',
    permissions: null,
    sessionId: null,
    isLoading: false
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando Instituto Educa - Sistema de Asistencia v3.0');
    
    // Esperar a que todos los scripts se carguen
    setTimeout(() => {
        initializeServices();
    }, 100);
});

function initializeServices() {
    console.log('🔧 Inicializando servicios...');
    
    try {
        // Inicializar EventBus y configurar listeners globales
        setupGlobalEventListeners();
        
        // Esperar un poco más para que todos los módulos se carguen
        setTimeout(() => {
            // Inicializar módulos core
            const modulesInitialized = initializeModules();
            if (!modulesInitialized) {
                console.error('❌ Error crítico: No se pudieron inicializar los módulos');
                showToast('Error crítico en la inicialización del sistema', 'error');
                return;
            }
            
            // Verificar si hay usuario logueado
            checkCurrentSession();
            
            // Event listeners para UI
            setupUIEventListeners();
            
            // Verificar estado del backend (con delay para asegurar inicialización)
            setTimeout(() => {
                checkBackendHealth();
            }, 500);
            
            console.log('✅ Sistema iniciado correctamente');
            
        }, 200); // Dar tiempo a que se carguen todos los scripts
        
    } catch (error) {
        console.error('❌ Error crítico en la inicialización:', error);
        showToast('Error crítico en la inicialización del sistema', 'error');
    }
}

function setupGlobalEventListeners() {
    // Configurar listeners del EventBus
    EventBus.on('notification', (data) => {
        showToast(data.message, data.type);
    });
    
    EventBus.on('error', (data) => {
        console.error('Application Error:', data.error);
        showToast(data.message || 'Ha ocurrido un error', 'error');
    });
    
    EventBus.on('view-change', (data) => {
        loadView(data.view);
    });
    
    EventBus.on('user-login', (user) => {
        showMainApp(user);
    });
    
    EventBus.on('user-logout', () => {
        logout();
    });
    
    EventBus.on('view-refresh', () => {
        loadView(AppState.currentView);
    });
}

function initializeModules() {
    try {
        console.log('🔧 Inicializando módulos core...');
        
        // Verificar dependencias críticas primero
        const criticalModules = ['EventBus', 'AuthManager', 'Utils'];
        const missingModules = criticalModules.filter(module => typeof window[module] === 'undefined');
        
        if (missingModules.length > 0) {
            console.warn('⚠️ Algunos módulos aún se están cargando:', missingModules);
            // Intentar de nuevo en un momento
            setTimeout(() => initializeModules(), 100);
            return false;
        }
        
        // Inicializar APIService (Singleton)
        if (typeof ApiService !== 'undefined') {
            window.APIService = ApiService.getInstance();
            console.log('✅ APIService inicializado');
        } else {
            console.error('❌ ApiService no disponible');
            return false;
        }
        
        // Inicializar servicios de negocio
        if (typeof AuthService !== 'undefined') {
            window.authService = new AuthService();
            console.log('✅ AuthService inicializado');
        }
        
        if (typeof AttendanceService !== 'undefined') {
            window.attendanceService = new AttendanceService();
            console.log('✅ AttendanceService inicializado');
        }
        
        if (typeof UserService !== 'undefined') {
            window.userService = new UserService();
            console.log('✅ UserService inicializado');
        }
        
        if (typeof ReportsService !== 'undefined') {
            window.reportsService = new ReportsService();
            console.log('✅ ReportsService inicializado');
        }
        
        console.log('✅ Todos los módulos inicializados correctamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error inicializando módulos:', error);
        EventBus.emit('error', { message: 'Error en la inicialización del sistema', error });
        return false;
    }
}

async function checkCurrentSession() {
    try {
        AppState.isLoading = true;
        
        // Verificar si hay una sesión activa usando AuthManager
        const currentUser = AuthManager.getCurrentUser();
        
        if (currentUser) {
            // Validar token con el backend
            const isValid = await AuthService.validateToken();
            if (isValid) {
                EventBus.emit('user-login', currentUser);
            } else {
                // Token inválido, limpiar sesión
                AuthManager.logout();
                showLoginScreen();
            }
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
        showLoginScreen();
    } finally {
        AppState.isLoading = false;
    }
}

async function checkBackendHealth() {
    try {
        console.log('🔍 Verificando conexión con el backend...');
        
        if (!window.APIService) {
            throw new Error('APIService no está inicializado');
        }
        
        const health = await window.APIService.get('/health');
        if (health && health.status === 'ok') {
            console.log('✅ Backend conectado correctamente', health);
            EventBus.emit('notification', { 
                message: 'Sistema conectado correctamente', 
                type: 'success' 
            });
        } else {
            throw new Error('Respuesta de health check inválida');
        }
    } catch (error) {
        console.warn('⚠️ Backend no disponible:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            apiServiceExists: !!window.APIService,
            backendUrl: window.APIService?.baseURL || 'N/A'
        });
        
        EventBus.emit('notification', { 
            message: `Advertencia: Problemas de conectividad con el servidor (${error.message})`, 
            type: 'warning' 
        });
    }
}

function setupUIEventListeners() {
    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', handleLoginForm);
    
    // Logout button
    document.getElementById('btnLogout')?.addEventListener('click', () => {
        EventBus.emit('user-logout');
    });
    
    // Remover quick login buttons ya que ahora usamos solo autenticación real
}

async function handleLoginForm(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.username.value.trim();
    const password = form.password.value;
    
    if (!username || !password) {
        EventBus.emit('notification', { message: 'Por favor, completa todos los campos', type: 'error' });
        return;
    }
    
    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Iniciando sesión...';
    submitBtn.disabled = true;
    
    try {
        console.log('🔑 Intentando login para usuario:', username);
        
        if (!window.authService) {
            throw new Error('AuthService no está disponible');
        }
        
        const result = await window.authService.login(username, password);
        if (result.success && result.user) {
            console.log('✅ Login exitoso:', result.user);
            EventBus.emit('notification', { 
                message: `Bienvenido, ${result.user.profile?.firstName || result.user.username}`, 
                type: 'success' 
            });
            EventBus.emit('user-login', result.user);
        } else {
            EventBus.emit('notification', { 
                message: result.message || 'Usuario o contraseña incorrectos', 
                type: 'error' 
            });
            form.password.value = ''; // Limpiar contraseña
        }
    } catch (error) {
        console.error('❌ Error en login:', error);
        EventBus.emit('error', { message: `Error de autenticación: ${error.message}`, error });
        form.password.value = ''; // Limpiar contraseña en caso de error
    } finally {
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function logout() {
    AuthManager.logout();
    AppState.currentUser = null;
    AppState.currentView = 'dashboard';
    showLoginScreen();
    EventBus.emit('notification', { message: 'Sesión cerrada correctamente', type: 'info' });
}

function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp(user) {
    AppState.currentUser = user;
    AppState.sessionId = Date.now();
    
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Actualizar UI con información del usuario
    updateUserInterface(user);
    
    // Cargar menú dinámico según rol
    loadDynamicMenu(user.role);
    
    // Cargar vista inicial según rol
    loadInitialView(user.role);
    
    console.log(`Usuario ${user.name || user.username} (${user.role}) ha iniciado sesión`);
}

function updateUserInterface(user) {
    // Actualizar elementos básicos de UI
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.name || user.username;
    }
    
    const userRoleElement = document.getElementById('userRole');
    if (userRoleElement) {
        const roleInfo = CONFIG.ROLES[user.role] || { name: user.role };
        userRoleElement.textContent = roleInfo.name;
        userRoleElement.style.color = roleInfo.color;
    }
    
    // Mostrar avatar o iniciales
    const userAvatarElement = document.getElementById('userAvatar');
    if (userAvatarElement) {
        const initials = (user.name || user.username).split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('');
        userAvatarElement.textContent = initials;
    }
}

function loadDynamicMenu(userRole) {
    const menuContainer = document.getElementById('navigationMenu');
    
    if (!menuContainer) return;
    
    // Definir menú según rol
    const menuItems = getMenuItemsForRole(userRole);
    
    menuContainer.innerHTML = '';
    
    menuItems.forEach(item => {
        const menuElement = document.createElement('a');
        menuElement.href = '#';
        menuElement.className = 'menu-item';
        menuElement.innerHTML = `
            <i class="${item.icon}"></i>
            <span>${item.label}</span>
        `;
        
        menuElement.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Actualizar estado visual del menú
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            menuElement.classList.add('active');
            
            // Cargar vista
            if (item.url && item.url.includes('pages/')) {
                // Navegar a página externa
                window.location.href = item.url;
            } else {
                loadView(item.id);
            }
        });
        
        menuContainer.appendChild(menuElement);
    });
}

function getMenuItemsForRole(role) {
    const baseItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-bar' }
    ];
    
    switch (role) {
        case 'employee':
            return [
                ...baseItems,
                { id: 'registro', label: 'Registro Diario', icon: 'fas fa-clock' },
                { id: 'reportes', label: 'Mis Reportes', icon: 'fas fa-file-alt' }
            ];
        case 'supervisor':
            return [
                ...baseItems,
                { id: 'supervision', label: 'Supervisión', icon: 'fas fa-users' },
                { id: 'empleados', label: 'Empleados', icon: 'fas fa-user-friends' },
                { id: 'reportes', label: 'Reportes', icon: 'fas fa-chart-pie' }
            ];
        case 'administrator':
            return [
                ...baseItems,
                { id: 'supervision', label: 'Supervisión', icon: 'fas fa-users' },
                { id: 'empleados', label: 'Empleados', icon: 'fas fa-user-friends' },
                { id: 'reportes', label: 'Reportes', icon: 'fas fa-chart-pie' },
                { id: 'database', label: 'Base de Datos', icon: 'fas fa-database', url: 'pages/database.html' },
                { id: 'config', label: 'Configuración', icon: 'fas fa-cog', url: 'pages/config.html' }
            ];
        default:
            return baseItems;
    }
}

function loadInitialView(userRole) {
    // Determinar vista inicial según rol
    const viewMap = {
        'employee': 'registro',
        'supervisor': 'supervision',
        'administrator': 'dashboard',
        'guest': 'dashboard'
    };
    
    const initialView = viewMap[userRole] || 'dashboard';
    loadView(initialView);
}

// Función principal para cargar vistas
async function loadView(viewId) {
    AppState.currentView = viewId;
    const contentArea = document.getElementById('contentArea');
    
    if (!contentArea) {
        console.error('Área de contenido no encontrada');
        return;
    }
    
    // Mostrar loading
    contentArea.innerHTML = '<div class="loading">Cargando...</div>';
    
    try {
        let html = '';
        
        switch (viewId) {
            case 'dashboard':
                if (AppState.currentUser.role === 'supervisor') {
                    html = await Supervisor.renderDashboardView();
                } else {
                    html = await Dashboard.renderDashboardView();
                }
                break;
            case 'registro':
                html = Dashboard.renderRegistroView();
                break;
            case 'supervision':
                html = await Supervisor.renderSupervisionView();
                break;
            case 'empleados':
                html = await Supervisor.renderEmpleadosView();
                break;
            case 'reportes':
                if (AppState.currentUser.role === 'supervisor') {
                    html = await Supervisor.renderReportesView();
                } else {
                    html = await Dashboard.renderReportesView();
                }
                break;
            default:
                html = '<div class="alert alert-warning">Vista no encontrada</div>';
        }
        
        contentArea.innerHTML = html;
        
        // Inicializar la vista después de renderizar
        initializeView(viewId);
        
    } catch (error) {
        console.error('Error cargando vista:', error);
        contentArea.innerHTML = '<div class="alert alert-danger">Error al cargar la vista</div>';
        EventBus.emit('error', { message: 'Error al cargar la vista', error });
    }
}

function initializeView(viewId) {
    try {
        switch (viewId) {
            case 'registro':
                Dashboard.initRegistro();
                break;
            case 'dashboard':
                if (AppState.currentUser.role === 'supervisor') {
                    Supervisor.initDashboard();
                } else {
                    Dashboard.initDashboard();
                }
                break;
            case 'supervision':
                Supervisor.initSupervision();
                break;
            case 'empleados':
                Supervisor.initEmpleados();
                break;
            case 'reportes':
                if (AppState.currentUser.role === 'supervisor') {
                    Supervisor.initReportes();
                } else {
                    Dashboard.initReportes();
                }
                break;
        }
    } catch (error) {
        console.error('Error inicializando vista:', error);
    }
}

// Función de utilidad para refrescar la aplicación
function refreshApp() {
    EventBus.emit('view-refresh');
}

// Agregar estilos CSS para animaciones de toast
if (!document.getElementById('toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .loading::before {
            content: "";
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #666;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}