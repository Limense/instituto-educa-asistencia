@echo off
echo.
echo ========================================================
echo    INSTITUTO EDUCA - INSTALACION AUTOMATICA v2.0
echo    Sistema de Control de Asistencia
echo ========================================================
echo.

:: Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo    Descarga Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detectado: 
node --version

:: Verificar si MySQL está disponible
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ADVERTENCIA: MySQL no está en el PATH
    echo    Asegúrate de que MySQL esté instalado y funcionando
)

echo.
echo 📦 Instalando dependencias del backend...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló la instalación de dependencias
    pause
    exit /b 1
)

echo.
echo 🗄️ Configurando base de datos...
node migrate_simple.js
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló la migración de base de datos
    pause
    exit /b 1
)

echo.
echo 📊 Agregando datos de prueba...
mysql -u root -p248633 < add-sample-data.sql
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló la inserción de datos de prueba
    echo    Verifica que MySQL esté corriendo y las credenciales sean correctas
)

echo.
echo ========================================================
echo ✅ INSTALACION COMPLETADA EXITOSAMENTE
echo ========================================================
echo.
echo 🚀 Para iniciar el sistema:
echo.
echo    1. Backend (Terminal 1):
echo       cd backend
echo       npm start
echo.
echo    2. Frontend (Terminal 2):
echo       cd frontend
echo       python -m http.server 8888
echo.
echo 🌐 URLs de acceso:
echo    - Frontend: http://localhost:8888
echo    - Backend:  http://localhost:3003
echo    - Health:   http://localhost:3003/api/health
echo.
echo 👤 Credenciales:
echo    - Usuario: admin
echo    - Contraseña: admin123
echo.
echo 📖 Ver GUIA_INSTALACION.md para más detalles
echo.
pause
