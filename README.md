# 🏫 Sistema de Asistencia - Instituto Educativo

Sistema básico y simple para el control de asistencia de empleados que trabajan remotamente.

## 📋 Características

- ✅ **Login seguro** con email y contraseña
- ⏰ **Marcado de entrada/salida** para trabajo remoto
- 📊 **Historial de asistencias** para cada empleado
- 👨‍💼 **Panel administrativo** para gestión
- 📱 **Responsive** - funciona en móviles y escritorio
- 🔒 **Sesiones seguras** con autenticación

## 🚀 Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Inicializar base de datos
```bash
npm run init-db
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

### 4. Ejecutar en producción
```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## 👥 Cuentas por Defecto

### Administrador
- **Email:** admin@instituto.edu
- **Contraseña:** admin123

### Empleado de Prueba
- **Email:** empleado@instituto.edu
- **Contraseña:** empleado123

> ⚠️ **IMPORTANTE:** Cambia estas contraseñas después del primer uso

## 📖 Uso del Sistema

### Para Empleados:
1. Ingresar con email y contraseña
2. Marcar **entrada** al iniciar trabajo remoto
3. Marcar **salida** al finalizar la jornada
4. Ver historial de asistencias

### Para Administradores:
1. Acceder al **Panel Admin** desde el dashboard
2. **Crear nuevos empleados** con sus cuentas
3. **Ver reportes** de asistencia por fechas
4. **Gestionar usuarios** del sistema

## 🌐 Despliegue a Producción

### Opción 1: Railway (Recomendado)
1. Crear cuenta en [Railway.app](https://railway.app)
2. Conectar repositorio de GitHub
3. Las variables de entorno se configuran automáticamente
4. Railway detecta Node.js y despliega automáticamente

### Opción 2: Render
1. Crear cuenta en [Render.com](https://render.com)
2. Crear nuevo Web Service
3. Conectar repositorio
4. Configurar variables de entorno:
   ```
   NODE_ENV=production
   SESSION_SECRET=tu_clave_super_segura_para_produccion
   ```

### Opción 3: Vercel
1. Instalar Vercel CLI: `npm i -g vercel`
2. Ejecutar: `vercel`
3. Seguir las instrucciones

### Variables de Entorno para Producción
```env
NODE_ENV=production
SESSION_SECRET=clave_muy_segura_para_produccion_cambiar_por_valor_unico
PORT=3000
```

## 📁 Estructura del Proyecto

```
sistema-asistencia/
├── server.js              # Servidor principal
├── package.json           # Dependencias
├── .env                   # Variables de entorno
├── database.sqlite        # Base de datos (se crea automáticamente)
├── public/                # Frontend
│   ├── login.html         # Página de login
│   ├── dashboard.html     # Panel empleado
│   └── admin.html         # Panel administrador
└── scripts/
    └── init-db.js         # Inicialización de BD
```

## 🔧 Tecnologías Utilizadas

- **Backend:** Node.js + Express
- **Base de Datos:** SQLite (simple, sin configuración)
- **Frontend:** HTML5 + CSS3 + JavaScript vanilla
- **Autenticación:** bcryptjs + express-session
- **Estilo:** CSS moderno con gradientes y animaciones

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt
- Sesiones seguras con express-session
- Validación de entrada en servidor
- Middleware de autenticación y autorización

## 📱 Responsive Design

El sistema está optimizado para:
- 📱 **Móviles** (empleados marcando desde teléfono)
- 💻 **Escritorio** (administradores gestionando)
- 📊 **Tablets** (consulta de reportes)

## 🆘 Soporte

### Problemas Comunes:

**Error: Cannot find module**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Base de datos no inicializada**
```bash
npm run init-db
```

**Puerto ocupado**
```bash
# Cambiar puerto en .env
PORT=3001
```

## 🔄 Actualizaciones

Para actualizar el sistema:
1. Respaldar `database.sqlite`
2. Actualizar código
3. Ejecutar: `npm install`
4. Reiniciar servidor

## 📞 Contacto

Sistema desarrollado para control básico de asistencia remota.
Para personalización adicional, contactar al equipo de desarrollo.

---

**¡El sistema está listo para usar en producción! 🚀**
