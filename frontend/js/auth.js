/**
 * Instituto Educa - Gestor de Autenticación
 * Sistema de Control de Asistencia v2.0
 */

class AuthManager {
    constructor() {
        this.apiService = new ApiService();
        this.currentUser = null;
        this.sessionId = null;
        this.storageKey = 'instituto_educa_session';
        this.userKey = 'instituto_educa_user';
        
        console.log('🔐 AuthManager inicializado');
        this.loadStoredSession();
    }

    loadStoredSession() {
        try {
            const storedUser = localStorage.getItem(this.userKey);
            const storedSession = localStorage.getItem(this.storageKey);

            if (storedUser && storedSession) {
                this.currentUser = JSON.parse(storedUser);
                this.sessionId = storedSession;
                console.log('📦 Sesión cargada desde localStorage:', this.currentUser.username);
            }
        } catch (error) {
            console.error('Error cargando sesión almacenada:', error);
            this.clearStoredSession();
        }
    }

    saveSession(user, sessionId) {
        try {
            localStorage.setItem(this.userKey, JSON.stringify(user));
            localStorage.setItem(this.storageKey, sessionId);
            this.currentUser = user;
            this.sessionId = sessionId;
            console.log('💾 Sesión guardada en localStorage');
        } catch (error) {
            console.error('Error guardando sesión:', error);
        }
    }

    clearStoredSession() {
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.storageKey);
        this.currentUser = null;
        this.sessionId = null;
        console.log('🗑️ Sesión eliminada de localStorage');
    }    async login(username, password) {
        try {
            console.log(`🔑 Intentando login para: ${username}`);
            
            const response = await this.apiService.post('/auth/login', {
                username,
                password
            });

            if (response.success) {
                // El backend devuelve user y token directamente en la respuesta, no en response.data
                const { user, token } = response;
                
                // Guardar sesión
                this.saveSession(user, token);
                
                console.log('✅ Login exitoso:', user.username);
                return user;
            } else {
                throw new Error(response.message || 'Error de autenticación');
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            throw new Error(error.message || 'Error de conexión al servidor');
        }
    }

    async logout() {
        try {
            console.log('🚪 Cerrando sesión...');
            
            // Notificar al servidor (opcional, puede fallar si no hay conexión)
            try {
                await this.apiService.post('/auth/logout');
            } catch (error) {
                console.warn('No se pudo notificar logout al servidor:', error);
            }

            // Limpiar sesión local
            this.clearStoredSession();
            
            console.log('✅ Sesión cerrada correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error en logout:', error);
            // Aún así limpiar sesión local
            this.clearStoredSession();
            throw error;
        }
    }

    async verifySession() {
        if (!this.currentUser || !this.sessionId) {
            console.log('❌ No hay sesión para verificar');
            return false;
        }

        try {
            console.log('🔍 Verificando sesión con el servidor...');
            
            const response = await this.apiService.get('/auth/verify');
            
            if (response.success) {
                console.log('✅ Sesión válida');
                return true;
            } else {
                console.log('❌ Sesión inválida');
                this.clearStoredSession();
                return false;
            }
        } catch (error) {
            console.error('❌ Error verificando sesión:', error);
            // En caso de error de conexión, mantener sesión local temporalmente
            console.log('⚠️ Manteniendo sesión local debido a error de conexión');
            return true;
        }
    }

    isUserAuthenticated() {
        return !!(this.currentUser && this.sessionId);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getSessionId() {
        return this.sessionId;
    }

    getUserRole() {
        return this.currentUser?.role || null;
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const rolePermissions = {
            administrator: ['*'], // Todos los permisos
            supervisor: ['view_team', 'manage_attendance', 'view_reports'],
            employee: ['view_own_attendance', 'clock_in_out'],
            guest: ['view_basic_info']
        };

        const userPermissions = rolePermissions[this.currentUser.role] || [];
        
        return userPermissions.includes('*') || userPermissions.includes(permission);
    }

    getAuthHeaders() {
        if (!this.sessionId) {
            return {};
        }

        return {
            'Authorization': `Bearer ${this.sessionId}`,
            'Content-Type': 'application/json'
        };
    }

    // Método para debug/testing
    getDebugInfo() {
        return {
            isAuthenticated: this.isUserAuthenticated(),
            currentUser: this.currentUser?.username || null,
            userRole: this.getUserRole(),
            hasSession: !!this.sessionId,
            sessionLength: this.sessionId?.length || 0
        };
    }
}

// Exportar para uso global
window.AuthManager = AuthManager;

console.log('🔐 AuthManager clase definida y disponible globalmente');
