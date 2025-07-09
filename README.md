# Sistema de Asistencia - Instituto Educa

Sistema web para el control de asistencias de empleados, desarrollado con Node.js, Express y Supabase.

## 🚀 Características

- **Autenticación segura** con bcrypt
- **Gestión de empleados** (CRUD completo)
- **Registro de asistencias** (entrada y salida)
- **Panel administrativo** para gestión
- **Portal de empleados** para registro de asistencias

## 🛠️ Tecnologías

- **Backend**: Node.js, Express
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Sessions con bcrypt
- **Frontend**: HTML, CSS, JavaScript vanilla
- **Despliegue**: Vercel

## 📋 Instalación

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno
4. Iniciar el servidor: `npm start`

## 🔧 Configuración

### Variables de entorno requeridas:
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_SERVICE_KEY`: Service key de Supabase
- `SESSION_SECRET`: Clave secreta para sesiones

## 📱 Uso

### Administrador:
- **Login**: admin@instituto.com / password
- **Panel**: /admin

### Empleados:
- **Portal**: /employee

## 🚀 Despliegue en Vercel

1. Conectar repositorio en Vercel
2. Configurar variables de entorno
3. Desplegar

---

*Desarrollado para Instituto Educa*
