# Instituto Educa - Backend API

## 🔧 **BACKEND - API REST + MySQL**

API REST construida con Express.js y MySQL para el sistema de control de asistencia.

### 🚀 **Inicio Rápido**

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales MySQL

# Iniciar servidor
npm start  # Puerto 3002
```

### 📊 **Tecnologías**
- **Framework**: Express.js 4.x
- **Base de Datos**: MySQL 8.x
- **Autenticación**: JWT (jsonwebtoken)
- **Middleware**: CORS, helmet, morgan
- **Validación**: bcrypt para passwords

### 🔌 **Endpoints API**

#### **Autenticación**
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

#### **Usuarios**
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

#### **Asistencia**
- `GET /api/attendance` - Obtener registros
- `POST /api/attendance` - Marcar asistencia
- `GET /api/attendance/user/:id` - Por usuario

#### **Reportes**
- `GET /api/reports/daily` - Reporte diario
- `GET /api/reports/monthly` - Reporte mensual
- `GET /api/reports/user/:id` - Por usuario

#### **Configuración**
- `GET /api/settings` - Obtener configuración
- `POST /api/settings` - Actualizar configuración

#### **Sistema**
- `GET /api/health` - Health check

### 🔐 **Seguridad**
- Autenticación JWT
- Middleware de validación
- CORS configurado
- Sanitización de datos
- Hashing de contraseñas con bcrypt

### 📁 **Estructura**
```
backend/
├── server.js              # Servidor principal
├── config/
│   └── database.js        # Configuración MySQL
├── routes/                # Rutas de la API
│   ├── auth.js           # Autenticación
│   ├── users.js          # CRUD usuarios
│   ├── attendance.js     # Asistencia
│   ├── departments.js    # Departamentos
│   ├── reports.js        # Reportes
│   └── settings.js       # Configuración
├── middleware/
│   ├── auth.js           # Middleware JWT
│   └── errorHandler.js   # Manejo errores
├── package.json          # Dependencias
└── .env                  # Variables entorno
```

### 🗄️ **Base de Datos**

```sql
-- Crear base de datos
CREATE DATABASE instituto_educa_asistencia;

-- Usar base de datos
USE instituto_educa_asistencia;

-- Crear tablas (ejecutar migrate_simple.js)
node migrate_simple.js
```

### ⚙️ **Variables de Entorno (.env)**
```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=instituto_educa_asistencia
DB_PORT=3306

# JWT
JWT_SECRET=your_jwt_secret_key

# Servidor
PORT=3002
NODE_ENV=development
```

### 🧪 **Testing**
```bash
# Health check
curl http://localhost:3002/api/health

# Login test
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 📈 **Monitoring**
- Logs con Morgan
- Health check endpoint
- Error handling centralizado
- CORS configurado para frontend

---

**Puerto:** 3002  
**Documentación API:** Endpoints documentados arriba  
**Estado:** ✅ Funcionando
