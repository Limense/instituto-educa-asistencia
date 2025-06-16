# Instituto Educa - Frontend

## 🎨 **FRONTEND - Interface Usuario**

Interface de usuario construida con HTML5, CSS3 y JavaScript moderno con patrones de diseño profesionales.

### 🚀 **Inicio Rápido**

```bash
# Servir archivos estáticos
python3 -m http.server 8888

# O con Node.js
npx http-server -p 8888

# O con cualquier servidor web estático
```

### 📊 **Tecnologías**
- **HTML5**: Semántico y accesible
- **CSS3**: Responsive design, Grid, Flexbox
- **JavaScript ES6+**: Módulos, async/await, clases
- **Font Awesome**: Iconografía
- **Sin Framework**: Vanilla JavaScript puro

### 🏗️ **Patrones de Diseño**

#### **1. Singleton Pattern**
```javascript
// ApiService - Una instancia para toda la app
class ApiService {
    static getInstance() { /* ... */ }
}
```

#### **2. Factory Pattern**
```javascript
// DataFactory - Creación consistente de objetos
class DataFactory {
    static createUser(data) { /* ... */ }
    static createAttendanceRecord(data) { /* ... */ }
}
```

#### **3. Observer Pattern**
```javascript
// EventBus - Comunicación desacoplada
class EventBus {
    on(event, callback) { /* ... */ }
    emit(event, data) { /* ... */ }
}
```

#### **4. Service Layer Pattern**
```javascript
// Servicios - Lógica de negocio
class AuthService {
    async login(credentials) { /* ... */ }
}
```

#### **5. Module Pattern**
```javascript
// Módulos - Encapsulación
const AuthManager = (function() {
    // Variables privadas
    let currentUser = null;
    return { /* API pública */ };
})();
```

### 📁 **Estructura**
```
frontend/
├── index.html             # Página principal
├── js/                   # Módulos JavaScript
│   ├── api-service.js    # Singleton - Comunicación API
│   ├── data-factory.js   # Factory - Objetos datos
│   ├── event-bus.js      # Observer - Eventos globales
│   ├── services.js       # Service Layer - Lógica negocio
│   ├── auth.js           # Module Pattern - Autenticación
│   ├── database.js       # Adaptador API
│   ├── dashboard.js      # Vista dashboard
│   ├── supervisor.js     # Vista supervisor
│   ├── app.js            # Inicialización
│   └── utils.js          # Utilidades
├── pages/                # Vistas HTML
│   ├── dashboard.html    # Panel empleados
│   ├── supervisor.html   # Panel supervisores
│   ├── config.html       # Configuración
│   ├── reports.html      # Reportes
│   ├── attendance.html   # Asistencia
│   └── admin.html        # Administración
└── css/                  # Estilos
    ├── styles.css        # Estilos globales
    └── dashboard.css     # Específicos dashboard
```

### 🔄 **Flujo de Datos**

```
User Action → Event → Service → API → Database
    ↓           ↓        ↓       ↓        ↓
  UI Event → EventBus → AuthService → Backend → MySQL
    ↑           ↑        ↑       ↑        ↑
UI Update ← Factory ← Response ← API ← Database
```

### 🎯 **Características**

#### **Sin localStorage**
- ✅ **Persistencia**: Solo vía API/MySQL
- ✅ **Sesiones**: JWT en memoria
- ✅ **Datos**: Siempre desde backend

#### **Comunicación API**
- ✅ **Singleton**: ApiService centralizado
- ✅ **REST**: HTTP methods estándar
- ✅ **JSON**: Formato de intercambio
- ✅ **Async**: Promises y async/await

#### **Responsive Design**
- ✅ **Mobile First**: Diseño adaptativo
- ✅ **Grid/Flexbox**: Layout moderno
- ✅ **Touch Friendly**: Interfaces táctiles

### 🔧 **Configuración**

#### **API Endpoint**
```javascript
// js/api-service.js
const API_BASE_URL = 'http://localhost:3002/api';
```

#### **Módulos JavaScript**
```html
<!-- Orden de carga importante -->
<script src="js/api-service.js"></script>
<script src="js/data-factory.js"></script>
<script src="js/event-bus.js"></script>
<script src="js/services.js"></script>
<script src="js/auth.js"></script>
<script src="js/utils.js"></script>
```

### 📱 **Páginas Disponibles**

#### **Públicas**
- `/` - Página de inicio/login
- `/index.html` - Login principal

#### **Autenticadas**
- `/pages/dashboard.html` - Panel empleados
- `/pages/supervisor.html` - Panel supervisores
- `/pages/config.html` - Configuración sistema
- `/pages/reports.html` - Reportes y estadísticas
- `/pages/attendance.html` - Control asistencia
- `/pages/admin.html` - Administración

### 🎨 **Estilos**

#### **CSS Personalizado**
- Variables CSS para temas
- Grid y Flexbox para layouts
- Transiciones y animaciones
- Componentes reutilizables

#### **Responsive Breakpoints**
```css
/* Mobile First */
@media (min-width: 768px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1200px) { /* Large Desktop */ }
```

### 🧪 **Testing Frontend**

```bash
# Verificar carga de módulos
# Abrir DevTools → Console
console.log(window.ApiService);     // Debe existir
console.log(window.EventBus);       // Debe existir
console.log(window.AuthManager);    // Debe existir
```

### 🔍 **Debugging**

#### **Event Bus Events**
```javascript
// Escuchar todos los eventos
window.EventBus.on('*', (event, data) => {
    console.log('Event:', event, data);
});
```

#### **API Calls**
```javascript
// Ver todas las llamadas API
// Network tab en DevTools
// Filtrar por localhost:3002
```

### 📈 **Performance**

- ✅ **Módulos separados**: Carga optimizada
- ✅ **Sin frameworks**: Menor overhead
- ✅ **Lazy loading**: Carga bajo demanda
- ✅ **Caché**: Headers apropiados

---

**Puerto:** 8888  
**Login:** admin / admin123  
**Estado:** ✅ Funcionando sin localStorage
