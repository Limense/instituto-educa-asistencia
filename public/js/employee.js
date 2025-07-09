// Variables globales
let currentUser = null;
let todayAttendance = null;

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    updateClock();
    setInterval(updateClock, 1000); // Actualizar reloj cada segundo
});

// Inicializar página
async function initializePage() {
    try {
        // Cargar usuario primero
        await loadUserInfo();
        
        // Solo si no es admin, cargar el resto de datos
        if (!currentUser || !currentUser.es_admin) {
            await loadTodayStatus();
            await loadMonthlyStats();
            await loadRecentAttendances();
        }
    } catch (error) {
        console.error('Error inicializando página:', error);
        showMessage('Error cargando datos', 'error');
    }
}

// Cargar información del usuario
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
            currentUser = await response.json();
            document.getElementById('userName').textContent = currentUser.nombre;
            
            // Si es admin, mostrar mensaje especial
            if (currentUser.es_admin) {
                showAdminMessage();
            }
        }
    } catch (error) {
        console.error('Error cargando usuario:', error);
    }
}

// Cargar estado de hoy
async function loadTodayStatus() {
    // Si es admin, no cargar estado de asistencia
    if (currentUser && currentUser.es_admin) {
        return;
    }
    
    try {
        const response = await fetch('/api/attendances/hoy');
        if (response.ok) {
            todayAttendance = await response.json();
            updateTodayStatus();
        }
    } catch (error) {
        console.error('Error cargando estado de hoy:', error);
    }
}

// Actualizar estado de hoy
function updateTodayStatus() {
    const statusLabel = document.getElementById('statusLabel');
    const entryTime = document.getElementById('entryTime');
    const exitTime = document.getElementById('exitTime');
    const entryBtn = document.getElementById('entryBtn');
    const exitBtn = document.getElementById('exitBtn');

    if (!todayAttendance || !todayAttendance.hora_entrada) {
        statusLabel.textContent = 'Sin marcar entrada';
        entryTime.textContent = '--:--';
        exitTime.textContent = '--:--';
        entryBtn.style.display = 'block';
        entryBtn.disabled = false;
        entryBtn.textContent = '⏰ Marcar Entrada';
        exitBtn.style.display = 'none';
    } else if (todayAttendance.hora_entrada && !todayAttendance.hora_salida) {
        statusLabel.textContent = 'Trabajando';
        entryTime.textContent = todayAttendance.hora_entrada;
        exitTime.textContent = '--:--';
        entryBtn.style.display = 'none';
        exitBtn.style.display = 'block';
        exitBtn.disabled = false;
        exitBtn.textContent = '🚪 Marcar Salida';
    } else {
        statusLabel.textContent = 'Jornada completa';
        entryTime.textContent = todayAttendance.hora_entrada;
        exitTime.textContent = todayAttendance.hora_salida;
        entryBtn.style.display = 'block';
        entryBtn.disabled = true;
        entryBtn.textContent = '✅ Entrada Marcada';
        entryBtn.style.opacity = '0.6';
        exitBtn.style.display = 'block';
        exitBtn.disabled = true;
        exitBtn.textContent = '✅ Salida Marcada';
        exitBtn.style.opacity = '0.6';
    }
}

// Actualizar reloj
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

// Marcar entrada
async function markEntry() {
    try {
        const response = await fetch('/api/attendances/entrada', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();
        
        if (response.ok) {
            showMessage('✅ Entrada marcada exitosamente', 'success');
            await loadTodayStatus();
            await loadRecentAttendances();
        } else {
            showMessage(result.error || 'Error al marcar entrada', 'error');
        }
    } catch (error) {
        console.error('Error marcando entrada:', error);
        showMessage('Error al marcar entrada', 'error');
    }
}

// Marcar salida
async function markExit() {
    try {
        const response = await fetch('/api/attendances/salida', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();
        
        if (response.ok) {
            showMessage('✅ Salida marcada exitosamente', 'success');
            await loadTodayStatus();
            await loadRecentAttendances();
        } else {
            showMessage(result.error || 'Error al marcar salida', 'error');
        }
    } catch (error) {
        console.error('Error marcando salida:', error);
        showMessage('Error al marcar salida', 'error');
    }
}

// Cargar estadísticas mensuales
async function loadMonthlyStats() {
    // Si es admin, no cargar estadísticas personales
    if (currentUser && currentUser.es_admin) {
        return;
    }
    
    try {
        const response = await fetch('/api/attendances/estadisticas');
        if (response.ok) {
            const stats = await response.json();
            updateMonthlyStats(stats);
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Actualizar estadísticas mensuales
function updateMonthlyStats(stats) {
    document.getElementById('diasTrabajados').textContent = stats.diasTrabajados || 0;
    document.getElementById('horasTotales').textContent = (stats.horasTotales || 0) + 'h';
    document.getElementById('promedioHoras').textContent = (stats.promedioHoras || 0) + 'h';
    document.getElementById('puntualidad').textContent = (stats.puntualidad || 100) + '%';
}

// Cargar asistencias recientes
async function loadRecentAttendances() {
    // Si es admin, no cargar asistencias personales
    if (currentUser && currentUser.es_admin) {
        return;
    }
    
    try {
        const response = await fetch('/api/attendances/mis-asistencias');
        if (response.ok) {
            const attendances = await response.json();
            renderRecentAttendances(attendances);
        }
    } catch (error) {
        console.error('Error cargando asistencias:', error);
    }
}

// Renderizar asistencias recientes
function renderRecentAttendances(attendances) {
    const tbody = document.getElementById('attendanceTable');
    
    if (attendances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay asistencias registradas</td></tr>';
        return;
    }

    tbody.innerHTML = attendances.slice(0, 10).map(att => {
        const fecha = new Date(att.fecha).toLocaleDateString('es-ES');
        const entrada = att.hora_entrada || '--:--';
        const salida = att.hora_salida || '--:--';
        
        let total = '--:--';
        if (att.hora_entrada && att.hora_salida) {
            const entryTime = new Date(`2000-01-01 ${att.hora_entrada}`);
            const exitTime = new Date(`2000-01-01 ${att.hora_salida}`);
            const diff = exitTime - entryTime;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            total = `${hours}h ${minutes}m`;
        }

        let estado = 'pendiente';
        let estadoText = 'Pendiente';
        if (att.hora_entrada && att.hora_salida) {
            estado = 'completa';
            estadoText = 'Completa';
        } else if (att.hora_entrada) {
            estado = 'trabajando';
            estadoText = 'En curso';
        }

        return `
            <tr>
                <td>${fecha}</td>
                <td>${entrada}</td>
                <td>${salida}</td>
                <td>${total}</td>
                <td>
                    <span class="status-badge status-${estado}">
                        ${estadoText}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Mostrar mensaje especial para administradores
function showAdminMessage() {
    // Ocultar secciones de empleado
    document.querySelector('.today-status').style.display = 'none';
    document.querySelector('.stats-section').style.display = 'none';
    document.querySelector('.attendance-section').style.display = 'none';
    
    // Crear mensaje para administrador
    const container = document.querySelector('.container');
    const adminMessage = document.createElement('div');
    adminMessage.className = 'admin-message';
    adminMessage.innerHTML = `
        <div class="admin-welcome">
            <div class="admin-icon">👑</div>
            <h2>¡Bienvenido, Administrador!</h2>
            <p>Como administrador, tu rol es supervisar y gestionar el sistema de asistencia.</p>
            <p>No necesitas marcar asistencia personal.</p>
            
            <div class="admin-actions">
                <a href="/admin" class="btn btn-primary">
                    🏛️ Ir al Panel de Administración
                </a>
                <button onclick="showSystemOverview()" class="btn btn-secondary">
                    📊 Ver Resumen del Sistema
                </button>
            </div>
        </div>
        
        <div class="system-overview" id="systemOverview" style="display: none;">
            <h3>📈 Resumen del Sistema Hoy</h3>
            <div class="overview-stats" id="overviewStats">
                <div class="overview-card">
                    <div class="overview-number" id="totalEmployees">0</div>
                    <div class="overview-label">Total Empleados</div>
                </div>
                <div class="overview-card">
                    <div class="overview-number" id="presentToday">0</div>
                    <div class="overview-label">Presentes Hoy</div>
                </div>
                <div class="overview-card">
                    <div class="overview-number" id="workingNow">0</div>
                    <div class="overview-label">Trabajando Ahora</div>
                </div>
                <div class="overview-card">
                    <div class="overview-number" id="completedDay">0</div>
                    <div class="overview-label">Jornada Completa</div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(adminMessage);
}

// Mostrar resumen del sistema
async function showSystemOverview() {
    const systemOverview = document.getElementById('systemOverview');
    systemOverview.style.display = 'block';
    
    try {
        const response = await fetch('/api/attendances/dashboard');
        if (response.ok) {
            const data = await response.json();
            updateSystemOverview(data);
        }
    } catch (error) {
        console.error('Error cargando resumen del sistema:', error);
    }
}

// Actualizar resumen del sistema
function updateSystemOverview(data) {
    const totalEmployees = data.length;
    let presentToday = 0;
    let workingNow = 0;
    let completedDay = 0;
    
    data.forEach(emp => {
        if (emp.hora_entrada) {
            presentToday++;
            if (emp.hora_salida) {
                completedDay++;
            } else {
                workingNow++;
            }
        }
    });
    
    document.getElementById('totalEmployees').textContent = totalEmployees;
    document.getElementById('presentToday').textContent = presentToday;
    document.getElementById('workingNow').textContent = workingNow;
    document.getElementById('completedDay').textContent = completedDay;
}

// Mostrar mensajes
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Logout
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        window.location.href = '/login';
    }
}
