/**
 * API Service - Singleton Pattern
 * Maneja todas las comunicaciones con el backend Express
 */
class ApiService {
    static #instance = null;
    
    constructor() {
        if (ApiService.#instance) {
            return ApiService.#instance;
        }
        
        this.baseURL = 'http://localhost:3003/api';
        this.authToken = null;
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        ApiService.#instance = this;
    }
    
    static getInstance() {
        if (!ApiService.#instance) {
            ApiService.#instance = new ApiService();
        }
        return ApiService.#instance;
    }
    
    // Configurar token de autenticación
    setAuthToken(token) {
        this.authToken = token;
    }
    
    // Obtener headers por defecto
    getDefaultHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        return headers;
    }
    
    // Método principal para hacer peticiones
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getDefaultHeaders(),
            ...options,
            headers: {
                ...this.getDefaultHeaders(),
                ...options.headers
            }
        };
        
        try {
            // Aplicar interceptors de request
            for (const interceptor of this.requestInterceptors) {
                await interceptor(config);
            }
            
            const response = await fetch(url, config);
            
            // Manejar errores de autenticación
            if (response.status === 401) {
                this.setAuthToken(null);
                throw new Error('Sesión expirada. Inicia sesión nuevamente.');
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Aplicar interceptors de response
            for (const interceptor of this.responseInterceptors) {
                await interceptor(data);
            }
            
            return data;
        } catch (error) {
            console.error(`Error en ${endpoint}:`, error);
            throw error;
        }
    }
    
    // Métodos HTTP específicos
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }
    
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    
    // Agregar interceptors
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }
    
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }
    
    // Verificar salud del servidor
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/api/health`);
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Export para uso global
window.ApiService = ApiService;
