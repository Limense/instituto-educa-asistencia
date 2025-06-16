/**
 * Service Layer - Patrón Service para lógica de negocio
 */

// Authentication Service
class AuthService {
    constructor() {
        this.api = window.apiService || ApiService.getInstance();
        this.currentUser = null;
    }
    
    async login(username, password) {
        try {
            const response = await this.api.post('/auth/login', { username, password });
            
            if (response.success && response.token) {
                this.api.setAuthToken(response.token);
                this.currentUser = response.user;
                
                // Emitir evento de login exitoso
                EventBus.emit('auth:login', response.user);
                
                return { success: true, user: response.user };
            }
            
            return { success: false, message: response.message || 'Credenciales inválidas' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    async logout() {
        try {
            // Limpiar datos locales
            this.api.setAuthToken(null);
            this.currentUser = null;
            
            // Emitir evento de logout
            EventBus.emit('auth:logout');
            
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    async getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        // En este sistema no persistimos usuarios en localStorage
        // Solo mantenemos el estado en memoria durante la sesión
        return null;
    }
    
    async refreshToken() {
        try {
            const response = await this.api.post('/auth/refresh');
            if (response.token) {
                this.api.setAuthToken(response.token);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
    
    isAuthenticated() {
        return !!this.api.authToken && !!this.currentUser;
    }
}

// User Service
class UserService {
    constructor() {
        this.api = ApiService.getInstance();
    }
    
    async getUsers(filters = {}) {
        try {
            const response = await this.api.get('/users', filters);
            return response.users || [];
        } catch (error) {
            console.error('Error obteniendo usuarios:', error);
            return [];
        }
    }
    
    async getUserById(id) {
        try {
            const response = await this.api.get(`/users/${id}`);
            return response.user || null;
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            return null;
        }
    }
    
    async createUser(userData) {
        try {
            const user = DataFactory.createUser(userData);
            const response = await this.api.post('/users', user);
            
            if (response.success) {
                EventBus.emit('user:created', response.user);
                return { success: true, user: response.user };
            }
            
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    async updateUser(id, userData) {
        try {
            const response = await this.api.put(`/users/${id}`, userData);
            
            if (response.success) {
                EventBus.emit('user:updated', response.user);
                return { success: true, user: response.user };
            }
            
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    async deleteUser(id) {
        try {
            const response = await this.api.delete(`/users/${id}`);
            
            if (response.success) {
                EventBus.emit('user:deleted', { id });
                return { success: true };
            }
            
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Attendance Service
class AttendanceService {
    constructor() {
        this.api = ApiService.getInstance();
    }
    
    async clockIn(userId, location = null) {
        try {
            const attendanceData = {
                user_id: userId,
                date: new Date().toISOString().split('T')[0],
                clock_in: new Date().toISOString(),
                location: location,
                type: 'manual',
                status: 'present'
            };
            
            const response = await this.api.post('/attendance', attendanceData);
            
            if (response.success) {
                EventBus.emit('attendance:clockin', response.attendance);
                return { success: true, attendance: response.attendance };
            }
            
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    async clockOut(userId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await this.api.put(`/attendance/${userId}/${today}`, {
                clock_out: new Date().toISOString()
            });
            
            if (response.success) {
                EventBus.emit('attendance:clockout', response.attendance);
                return { success: true, attendance: response.attendance };
            }
            
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    async getAttendanceRecords(filters = {}) {
        try {
            const response = await this.api.get('/attendance', filters);
            return response.records || [];
        } catch (error) {
            console.error('Error obteniendo registros de asistencia:', error);
            return [];
        }
    }
    
    async getUserAttendance(userId, startDate, endDate) {
        try {
            const filters = {
                user_id: userId,
                start_date: startDate,
                end_date: endDate
            };
            return await this.getAttendanceRecords(filters);
        } catch (error) {
            console.error('Error obteniendo asistencia del usuario:', error);
            return [];
        }
    }
}

// Reports Service
class ReportsService {
    constructor() {
        this.api = ApiService.getInstance();
    }
    
    async getAttendanceSummary(filters = {}) {
        try {
            const response = await this.api.get('/reports/attendance-summary', filters);
            return response.data || {};
        } catch (error) {
            console.error('Error obteniendo resumen de asistencia:', error);
            return {};
        }
    }
    
    async getDashboardKPIs() {
        try {
            const response = await this.api.get('/reports/dashboard-kpis');
            return response.data || {};
        } catch (error) {
            console.error('Error obteniendo KPIs:', error);
            return {};
        }
    }
    
    async exportReport(type, filters = {}) {
        try {
            const response = await this.api.get(`/reports/export/${type}`, filters);
            return response.data || null;
        } catch (error) {
            console.error('Error exportando reporte:', error);
            return null;
        }
    }
}

// Export services
window.AuthService = AuthService;
window.UserService = UserService;
window.AttendanceService = AttendanceService;
window.ReportsService = ReportsService;

// Crear instancias globales
document.addEventListener('DOMContentLoaded', function() {
    // Asegurar que ApiService esté disponible antes de crear servicios
    if (typeof window.apiService === 'undefined' && typeof ApiService !== 'undefined') {
        window.apiService = ApiService.getInstance();
    }
    
    // Crear instancias de servicios
    window.authService = new AuthService();
    window.userService = new UserService();
    window.attendanceService = new AttendanceService();
    window.reportsService = new ReportsService();
    
    console.log('✅ Servicios inicializados correctamente');
});
