@echo off
echo.
echo ========================================================
echo    INSTITUTO EDUCA - INICIO RAPIDO
echo    Sistema de Control de Asistencia v2.0
echo ========================================================
echo.

:: Verificar que estamos en el directorio correcto
if not exist "backend\server.js" (
    echo ❌ ERROR: No se encuentra el archivo backend\server.js
    echo    Asegúrate de ejecutar este script desde el directorio raíz del proyecto
    pause
    exit /b 1
)

if not exist "frontend\index.html" (
    echo ❌ ERROR: No se encuentra el archivo frontend\index.html
    echo    Asegúrate de ejecutar este script desde el directorio raíz del proyecto
    pause
    exit /b 1
)

echo 🚀 Iniciando servicios...
echo.

:: Crear archivos de comandos temporales
echo cd "%~dp0backend" > start_backend.bat
echo npm start >> start_backend.bat

echo cd "%~dp0frontend" > start_frontend.bat
echo python -m http.server 8888 >> start_frontend.bat

:: Iniciar backend en nueva ventana
echo 📡 Iniciando Backend (Puerto 3003)...
start "Instituto Educa - Backend" start_backend.bat

:: Esperar un momento para que el backend inicie
timeout /t 3 /nobreak >nul

:: Iniciar frontend en nueva ventana
echo 🌐 Iniciando Frontend (Puerto 8888)...
start "Instituto Educa - Frontend" start_frontend.bat

:: Esperar un momento más
timeout /t 2 /nobreak >nul

echo.
echo ========================================================
echo ✅ SERVICIOS INICIADOS
echo ========================================================
echo.
echo 🌐 URLs disponibles:
echo    - Sistema:  http://localhost:8888
echo    - API:      http://localhost:3003
echo    - Health:   http://localhost:3003/api/health
echo.
echo 👤 Credenciales de prueba:
echo    - Admin:      admin / admin123
echo    - Supervisor: supervisor1 / admin123
echo    - Empleado:   empleado1 / admin123
echo.
echo 🔧 Comandos útiles:
echo    - Ver logs: consulta las ventanas abiertas
echo    - Detener: cierra las ventanas del backend y frontend
echo.
echo ¿Deseas abrir el sistema en el navegador? (S/N)
set /p choice=

if /i "%choice%"=="S" (
    echo 🌐 Abriendo navegador...
    start http://localhost:8888
)

echo.
echo 📖 Para más información, consulta GUIA_INSTALACION.md
echo.

:: Limpiar archivos temporales
timeout /t 1 /nobreak >nul
del start_backend.bat 2>nul
del start_frontend.bat 2>nul

pause
