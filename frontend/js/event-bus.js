/**
 * Event Bus - Observer Pattern
 * Sistema de eventos centralizado para comunicación entre componentes
 */
class EventBus {
    static #instance = null;
    #events = new Map();
    
    constructor() {
        if (EventBus.#instance) {
            return EventBus.#instance;
        }
        EventBus.#instance = this;
    }
    
    static getInstance() {
        if (!EventBus.#instance) {
            EventBus.#instance = new EventBus();
        }
        return EventBus.#instance;
    }
    
    // Suscribirse a un evento
    static on(eventName, callback) {
        const instance = EventBus.getInstance();
        
        if (!instance.#events.has(eventName)) {
            instance.#events.set(eventName, []);
        }
        
        instance.#events.get(eventName).push(callback);
        
        // Retornar función para desuscribirse
        return () => {
            const callbacks = instance.#events.get(eventName);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }
    
    // Emitir un evento
    static emit(eventName, data = null) {
        const instance = EventBus.getInstance();
        const callbacks = instance.#events.get(eventName);
        
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en callback del evento ${eventName}:`, error);
                }
            });
        }
    }
    
    // Desuscribirse de todos los eventos de un tipo
    static off(eventName) {
        const instance = EventBus.getInstance();
        instance.#events.delete(eventName);
    }
    
    // Limpiar todos los eventos
    static clear() {
        const instance = EventBus.getInstance();
        instance.#events.clear();
    }
    
    // Suscribirse a un evento una sola vez
    static once(eventName, callback) {
        const unsubscribe = EventBus.on(eventName, (data) => {
            callback(data);
            unsubscribe();
        });
        return unsubscribe;
    }
    
    // Obtener lista de eventos registrados
    static getRegisteredEvents() {
        const instance = EventBus.getInstance();
        return Array.from(instance.#events.keys());
    }
    
    // Obtener número de suscriptores de un evento
    static getSubscriberCount(eventName) {
        const instance = EventBus.getInstance();
        const callbacks = instance.#events.get(eventName);
        return callbacks ? callbacks.length : 0;
    }
}

// Eventos predefinidos del sistema
EventBus.EVENTS = {
    // Autenticación
    AUTH_LOGIN: 'auth:login',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_TOKEN_EXPIRED: 'auth:token_expired',
    
    // Usuarios
    USER_CREATED: 'user:created',
    USER_UPDATED: 'user:updated',
    USER_DELETED: 'user:deleted',
    
    // Asistencia
    ATTENDANCE_CLOCKIN: 'attendance:clockin',
    ATTENDANCE_CLOCKOUT: 'attendance:clockout',
    ATTENDANCE_UPDATED: 'attendance:updated',
    
    // UI
    UI_NOTIFICATION: 'ui:notification',
    UI_LOADING: 'ui:loading',
    UI_ERROR: 'ui:error',
    UI_SUCCESS: 'ui:success',
    
    // Sistema
    SYSTEM_ERROR: 'system:error',
    SYSTEM_OFFLINE: 'system:offline',
    SYSTEM_ONLINE: 'system:online'
};

// Export para uso global
window.EventBus = EventBus;
