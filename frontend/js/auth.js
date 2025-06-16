/**
 * Authentication Module - Completamente basado en API
 * Sin localStorage, solo manejo de sesión con JWT
 */
class AuthManager {
    static #instance = null;
    
    constructor() {
        if (AuthManager.#instance) {
            return AuthManager.#instance;
        }
        
        this.authService = null; // Se inicializará después
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Suscribirse a eventos de autenticación
        EventBus.on(EventBus.EVENTS.AUTH_LOGIN, (user) => {
            this.currentUser = user;
            this.isAuthenticated = true;
        });
        
        EventBus.on(EventBus.EVENTS.AUTH_LOGOUT, () => {
            this.currentUser = null;
            this.isAuthenticated = false;
        });
        
        AuthManager.#instance = this;
    }
    
    // Inicializar AuthService después de que esté disponible
    initializeService() {
        if (!this.authService && window.authService) {
            this.authService = window.authService;
        }
    }
    
    static getInstance() {
        if (!AuthManager.#instance) {
            AuthManager.#instance = new AuthManager();
        }
        return AuthManager.#instance;
    }
    
    // Login principal
    async login(username, password) {
        try {
            // Asegurar que el servicio esté inicializado
            this.initializeService();
            
            if (!this.authService) {
                throw new Error('AuthService no está disponible');
            }
            
            const result = await this.authService.login(username, password);
            
            if (result.success) {
                console.log('✅ Login exitoso:', result.user.username);
                return result.user;
            } else {
                console.error('❌ Error de login:', result.message);
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Error en autenticación:', error);
            throw error;
        }
    }
    
    // Logout
    async logout() {
        try {
            this.initializeService();
            
            if (!this.authService) {
                throw new Error('AuthService no está disponible');
            }
            
            await this.authService.logout();
            console.log('👋 Logout exitoso');
            return true;
        } catch (error) {
            console.error('❌ Error en logout:', error);
            return false;
        }
    }
    
    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Verificar si está autenticado
    isUserAuthenticated() {
        return this.isAuthenticated && !!this.currentUser;
    }
    
    // Verificar permisos
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const role = this.currentUser.role;
        
        // Administrador tiene todos los permisos
        if (role === 'administrator') return true;
        
        // Verificar permisos específicos del rol
        const rolePermissions = {
            supervisor: [
                'attendance.view_team',
                'reports.view_basic',
                'users.view_team'
            ],
            employee: [
                'attendance.view_own',
                'attendance.record_own'
            ],
            guest: [
                'attendance.view_own'
            ]
        };
        
        return rolePermissions[role]?.includes(permission) || false;
    }
    
    // Verificar si puede ver datos de otro usuario
    canViewUser(targetUserId) {
        if (!this.currentUser) return false;
        
        const currentRole = this.currentUser.role;
        const currentUserId = this.currentUser.id;
        
        // Admin puede ver todo
        if (currentRole === 'administrator') return true;
        
        // Usuario puede ver sus propios datos
        if (currentUserId === targetUserId) return true;
        
        // Supervisor puede ver empleados a su cargo (implementar lógica según jerarquía)
        if (currentRole === 'supervisor') {
            // TODO: Implementar lógica de jerarquía
            return true;
        }
        
        return false;
    }
    
    // En este sistema no persistimos tokens, solo sesión en memoria
    async initializeFromToken() {
        // Sin localStorage, no hay inicialización de token persistente
        // El usuario debe hacer login en cada sesión
        return false;
    }
}

// Auth object para compatibilidad con código existente
const Auth = {
    manager: AuthManager.getInstance(),
    
    async login(username, password) {
        return await this.manager.login(username, password);
    },
    
    async logout() {
        return await this.manager.logout();
    },
    
    getCurrentUser() {
        return this.manager.getCurrentUser();
    },
    
    isAuthenticated() {
        return this.manager.isUserAuthenticated();
    },
    
    hasPermission(permission) {
        return this.manager.hasPermission(permission);
    },
    
    canViewUser(userId) {
        return this.manager.canViewUser(userId);
    },
    
    async initialize() {
        return await this.manager.initializeFromToken();
    }
};

// Export para uso global
window.Auth = Auth;
window.AuthManager = AuthManager;
