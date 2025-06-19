# 🏫 Sistema de Asistencia - Arquitectura Refactorizada

Un sistema de asistencia moderno y bien estructurado para instituciones educativas.

## 🏗️ Nueva Arquitectura

El proyecto ha sido refactorizado desde un monolito simple a una **arquitectura monolítica organizada** con separación clara de responsabilidades:

### 📁 Estructura del Proyecto

```
instituto-educa-asistencia/
├── 📁 src/                          # Código fuente del backend
│   ├── 📁 config/                   # Configuraciones
│   │   └── database.js              # Configuración de base de datos
│   ├── 📁 controllers/              # Controladores (lógica de negocio)
│   │   ├── AuthController.js        # Autenticación
│   │   ├── EmployeeController.js    # Gestión de empleados
│   │   └── AttendanceController.js  # Gestión de asistencias
│   ├── 📁 models/                   # Modelos de datos
│   │   ├── Employee.js              # Modelo de empleados
│   │   └── Attendance.js            # Modelo de asistencias
│   ├── 📁 routes/                   # Rutas API
│   │   ├── auth.js                  # Rutas de autenticación
│   │   ├── employees.js             # Rutas de empleados
│   │   └── attendances.js           # Rutas de asistencias
│   └── 📁 middleware/               # Middlewares
│       └── auth.js                  # Middleware de autenticación
├── 📁 public/                       # Frontend estático
│   ├── 📁 css/                      # Estilos separados
│   │   ├── login.css               # Estilos del login
│   │   ├── dashboard.css           # Estilos del dashboard
│   │   └── admin.css               # Estilos del admin
│   ├── 📁 js/                       # JavaScript separado
│   │   ├── login.js                # Lógica del login
│   │   ├── dashboard.js            # Lógica del dashboard
│   │   └── admin.js                # Lógica del admin
│   ├── 📁 pages/                    # Páginas HTML limpias
│   │   ├── login.html              # Página de login
│   │   ├── dashboard.html          # Dashboard de empleados
│   │   └── admin.html              # Panel administrativo
│   └── 📁 assets/                   # Recursos estáticos (imágenes, etc.)
├── 📁 database/                     # Base de datos
│   ├── database.sqlite             # Archivo de base de datos
│   └── init-db.js                  # Script de inicialización
├── 📁 scripts/                      # Scripts de utilidad (legacy)
├── server-new.js                    # Servidor principal refactorizado
├── server.js                        # Servidor original (mantener como backup)
└── package.json                     # Dependencias y scripts
```

## 🔄 Mejoras Implementadas

### ✅ **Separación de Responsabilidades**
- **Modelos**: Lógica de datos y validaciones
- **Controladores**: Lógica de negocio y manejo de requests
- **Rutas**: Definición de endpoints y middlewares
- **Vistas**: HTML, CSS y JS separados y organizados

### ✅ **Organización del Frontend**
- CSS extraído a archivos separados por página
- JavaScript modularizado por funcionalidad
- HTML limpio sin código incrustado
- Estructura de carpetas clara (`css/`, `js/`, `pages/`, `assets/`)

### ✅ **Base de Datos Organizada**
- Configuración centralizada en `src/config/database.js`
- Clase Database reutilizable
- Scripts de inicialización mejorados
- Ubicación clara en `database/`

### ✅ **Código Limpio**
- Eliminación de código duplicado
- Funciones reutilizables
- Manejo de errores consistente
- Nomenclatura clara y consistente

## 🚀 Instalación y Uso

### 1. Instalar dependencias
```bash
npm install
```

### 2. Inicializar base de datos
```bash
npm run init-db
```

### 3. Ejecutar la aplicación
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

### 4. Acceder a la aplicación
- **Dashboard**: http://localhost:3000
- **Login**: http://localhost:3000/login  
- **Admin**: http://localhost:3000/admin

## 👥 Usuarios por Defecto

### Administrador
- **Email**: admin@instituto.edu
- **Contraseña**: admin123

### Empleados de Ejemplo
- **Email**: maria@instituto.edu, juan@instituto.edu, ana@instituto.edu
- **Contraseña**: empleado123

## 🛠️ Scripts Disponibles

```bash
npm start          # Ejecutar servidor refactorizado
npm run dev        # Modo desarrollo con nodemon
npm run init-db    # Inicializar base de datos
npm run setup      # Instalar e inicializar todo
npm run start-old  # Ejecutar servidor original (backup)
```

## 📊 Características

### Para Empleados
- ✅ Marcar entrada y salida
- ✅ Ver historial personal de asistencias
- ✅ Estadísticas mensuales
- ✅ Interfaz intuitiva y responsive

### Para Administradores  
- ✅ Gestión completa de empleados
- ✅ Reportes de asistencia con filtros
- ✅ Exportación a CSV
- ✅ Panel administrativo completo

## 🔧 Tecnologías

- **Backend**: Node.js + Express.js
- **Base de Datos**: SQLite
- **Frontend**: HTML5 + CSS3 + JavaScript (Vanilla)
- **Autenticación**: Express Sessions + bcryptjs
- **Arquitectura**: Monolito Organizado (MVC)

## 🔄 Migración

El proyecto mantiene compatibilidad completa:
- El servidor original (`server.js`) sigue disponible como backup
- Todas las funcionalidades se mantienen
- La base de datos es totalmente compatible
- No se requiere migración de datos

## 🎯 Próximos Pasos

Con esta nueva arquitectura, es fácil:
- Añadir nuevas funcionalidades
- Implementar tests unitarios
- Migrar a TypeScript
- Separar frontend y backend completamente
- Añadir más middlewares de seguridad
- Implementar sistema de logs estructurado

## 📝 Notas de Desarrollo

- La arquitectura sigue siendo **monolítica** pero **bien organizada**
- Fácil de mantener y escalar
- Código más legible y profesional
- Preparado para futuras refactorizaciones
