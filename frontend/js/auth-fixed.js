/**
 * Authentication Module - Con persistencia y manejo de estado
 * Incluye localStorage para mantener sesión después de F5
 */
class AuthManager {
    static #instance = null;
    
    constructor() {
        if (AuthManager.#instance) {
            return AuthManager.#instance;
        }
        
        this.apiService = new ApiService();
        this.currentUser = null;
        this.isAuthenticated = false;
        this.token = null;
        
        // Cargar sesión existente al inicializar
        this.loadStoredSession();
        
        AuthManager.#instance = this;
    }
    
    static getInstance() {
        if (!AuthManager.#instance) {
            AuthManager.#instance = new AuthManager();
        }
        return AuthManager.#instance;
    }
    
    // Cargar sesión almacenada
    loadStoredSession() {
        try {
            const storedToken = localStorage.getItem('auth_token');
            const storedUser = localStorage.getItem('user_data');
            
            if (storedToken && storedUser) {
                this.token = storedToken;
                this.currentUser = JSON.parse(storedUser);
                this.isAuthenticated = true;
                this.apiService.setAuthToken(storedToken);
                console.log('✅ Sesión cargada desde localStorage');
                return true;
            }
        } catch (error) {
            console.error('❌ Error cargando sesión:', error);
            this.clearStoredSession();
        }
        return false;
    }
    
    // Guardar sesión en localStorage
    saveSession(token, userData) {
        try {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(userData));
            this.token = token;
            this.currentUser = userData;
            this.isAuthenticated = true;
            this.apiService.setAuthToken(token);
        } catch (error) {
            console.error('❌ Error guardando sesión:', error);
        }
    }
    
    // Limpiar sesión almacenada
    clearStoredSession() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        this.token = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.apiService.setAuthToken(null);
    }
    
    // Login principal
    async login(username, password) {
        try {
            const result = await this.apiService.post('/auth/login', {
                username,
                password
            });
            
            if (result.success) {
                // Guardar sesión
                this.saveSession(result.token, result.user);
                
                console.log('✅ Login exitoso:', result.user.username);
                
                // Emitir evento de login si EventBus está disponible
                if (typeof EventBus !== 'undefined' && EventBus.emit) {
                    EventBus.emit('user-login', result.user);
                }
                
                return result.user;
            } else {
                console.error('❌ Error de login:', result.message);
                throw new Error(result.message || 'Error de autenticación');
            }
        } catch (error) {
            console.error('❌ Error en autenticación:', error);
            throw error;
        }
    }
    
    // Logout
    async logout() {
        try {
            // Intentar hacer logout en el servidor
            if (this.token) {
                await this.apiService.post('/auth/logout');
            }
        } catch (error) {
            console.warn('⚠️ Error en logout del servidor:', error);
        } finally {
            // Siempre limpiar sesión local
            this.clearStoredSession();
            console.log('👋 Logout exitoso');
            
            // Emitir evento de logout si EventBus está disponible
            if (typeof EventBus !== 'undefined' && EventBus.emit) {
                EventBus.emit('user-logout');
            }
            
            return true;
        }
    }
    
    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Verificar si está autenticado
    isUserAuthenticated() {
        return this.isAuthenticated && !!this.currentUser && !!this.token;
    }
    
    // Verificar sesión con el servidor
    async verifySession() {
        if (!this.token) {
            return false;
        }
        
        try {
            const result = await this.apiService.get('/users/me');
            if (result && result.user) {
                // Actualizar datos del usuario
                this.currentUser = result.user;
                this.saveSession(this.token, result.user);
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Sesión inválida:', error);
            this.clearStoredSession();
        }
        
        return false;
    }
    
    // Verificar permisos
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const permissions = this.currentUser.permissions || {};
        return permissions[permission] === true;
    }
    
    // Verificar rol
    hasRole(role) {
        if (!this.currentUser) return false;
        return this.currentUser.role === role;
    }
    
    // Verificar múltiples roles
    hasAnyRole(roles) {
        if (!this.currentUser) return false;
        return roles.includes(this.currentUser.role);
    }
    
    // Obtener token actual
    getToken() {
        return this.token;
    }
    
    // Verificar permisos específicos para ver otros usuarios
    canViewUser(targetUserId) {
        if (!this.currentUser) return false;
        
        // Admin puede ver a todos
        if (this.hasRole('administrator')) return true;
        
        // Supervisores pueden ver a empleados de su departamento
        if (this.hasRole('supervisor')) {
            return true; // Por ahora permitir a todos los supervisores
        }
        
        // Usuarios pueden verse a sí mismos
        return this.currentUser.id === targetUserId;
    }
    
    // Obtener header de autorización
    getAuthHeader() {
        return this.token ? `Bearer ${this.token}` : null;
    }
}

// Crear instancia global
window.AuthManager = AuthManager;
