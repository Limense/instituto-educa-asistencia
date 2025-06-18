# 🌐 Guía de Despliegue a Producción

## 🚀 Railway (Opción Recomendada - Más Fácil)

Railway es ideal para proyectos Node.js y maneja SQLite sin problemas.

### Pasos:
1. **Crear cuenta en Railway:**
   - Ir a [railway.app](https://railway.app)
   - Registrarse con GitHub

2. **Subir código a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Sistema de asistencia completo"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/sistema-asistencia.git
   git push -u origin main
   ```

3. **Conectar en Railway:**
   - Hacer clic en "New Project"
   - Seleccionar "Deploy from GitHub repo"
   - Elegir tu repositorio
   - Railway detectará automáticamente que es Node.js

4. **Configurar variables de entorno:**
   - En el dashboard de Railway, ir a Variables
   - Agregar:
     ```
     NODE_ENV=production
     SESSION_SECRET=tu_clave_super_segura_para_produccion_2024
     ```

5. **¡Listo!** Railway te dará una URL como: `https://tu-proyecto.railway.app`

---

## 🔥 Render (Alternativa Gratuita)

### Pasos:
1. **Crear cuenta en Render:**
   - Ir a [render.com](https://render.com)
   - Registrarse con GitHub

2. **Crear Web Service:**
   - Clic en "New +" → "Web Service"
   - Conectar repositorio de GitHub
   - Configurar:
     - **Build Command:** `npm install`
     - **Start Command:** `npm run init-db && npm start`

3. **Variables de entorno:**
   ```
   NODE_ENV=production
   SESSION_SECRET=tu_clave_super_segura_para_produccion_2024
   ```

4. **Desplegar** - Render construirá y desplegará automáticamente

---

## ⚡ Vercel (Para Proyectos Serverless)

### Pasos:
1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Desde la carpeta del proyecto:**
   ```bash
   vercel
   ```

3. **Seguir instrucciones:**
   - Confirmar configuración
   - Vercel detectará automáticamente la configuración

---

## 🔧 Configuración Adicional para Producción

### 1. Cambiar Credenciales por Defecto
Después del primer despliegue, **inmediatamente**:
- Ingresar como admin: `admin@instituto.edu / admin123`
- Ir al Panel Admin
- Crear nuevos usuarios con credenciales seguras
- ⚠️ Eliminar o cambiar las cuentas por defecto

### 2. Variables de Entorno Importantes
```env
NODE_ENV=production
SESSION_SECRET=clave_muy_larga_y_segura_para_produccion_2024
PORT=3000
```

### 3. Base de Datos en Producción
- SQLite funciona perfectamente para equipos pequeños (hasta 50 empleados)
- Los datos se almacenan en el servidor
- Para equipos más grandes, considerar PostgreSQL

---

## 📊 Monitoreo en Producción

### Railway:
- Dashboard automático con logs
- Métricas de CPU y memoria
- Reinicio automático en caso de fallas

### Render:
- Logs en tiempo real
- Métricas básicas incluidas
- SSL automático

### Vercel:
- Dashboard de analytics
- Funciones serverless
- CDN global

---

## ✅ Checklist Post-Despliegue

- [ ] ✅ Sistema accesible en la URL de producción
- [ ] 🔐 Credenciales por defecto cambiadas
- [ ] 👥 Empleados creados con sus cuentas
- [ ] 📧 URLs compartidas con el equipo
- [ ] 🔔 Notificación al equipo sobre el nuevo sistema
- [ ] 📱 Prueba desde móviles
- [ ] 🕒 Prueba de marcado de asistencias

---

## 🆘 Solución de Problemas Comunes

### "Application Error" / "Build Failed"
```bash
# Verificar logs en el dashboard de la plataforma
# Común: dependencias faltantes
npm install
```

### "Session Secret Required"
- Agregar variable `SESSION_SECRET` con valor seguro

### "Database Error"
- En Railway/Render la BD se crea automáticamente
- Verificar que `npm run init-db` se ejecute en el deploy

### "404 Not Found"
- Verificar que el `start command` sea: `npm start`
- O: `npm run init-db && npm start`

---

## 📞 Soporte Rápido

Si algo no funciona:

1. **Verificar logs** en el dashboard de la plataforma
2. **Variables de entorno** configuradas correctamente
3. **Build logs** para errores de instalación
4. **Runtime logs** para errores de ejecución

---

**¡Tu sistema estará listo para usar en menos de 10 minutos! 🚀**
