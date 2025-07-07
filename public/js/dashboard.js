let estadoActual = null;

// Sonidos de confirmación
function playSound(type) {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    let frequency, duration;
    
    switch(type) {
        case 'entrada':
            frequency = 800; // Sonido agudo para entrada
            duration = 0.3;
            break;
        case 'salida':
            frequency = 600; // Sonido medio para salida
            duration = 0.5;
            break;
        case 'error':
            frequency = 300; // Sonido grave para error
            duration = 0.3;
            break;
        default:
            frequency = 700;
            duration = 0.3;
    }
    
    try {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + duration);
    } catch (e) {
        // Silenciosamente fallar si no hay soporte de audio
    }
}

// Actualizar reloj
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES');
    const dateString = now.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('currentTime').textContent = `${timeString}`;
}

// Actualizar cada segundo
setInterval(updateTime, 1000);
updateTime();

// Cargar datos iniciales
async function loadUserData() {
    try {
        // Obtener información del usuario actual desde el servidor
        const response = await fetch('/api/auth/user');
        if (response.ok) {
            const user = await response.json();
            document.getElementById('userName').textContent = user.nombre;
            
            // Mostrar enlace admin solo si es administrador
            if (user.es_admin) {
                document.getElementById('adminLink').style.display = 'inline-block';
            }
        }
    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
        document.getElementById('userName').textContent = 'Empleado';
    }
}

// Cargar estado de hoy
async function loadEstadoHoy() {
    try {
        const response = await fetch('/api/attendances/hoy');
        const data = await response.json();
        
        estadoActual = data;
        updateStatusDisplay(data);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Actualizar display de estado
function updateStatusDisplay(asistencia) {
    const statusBadge = document.getElementById('statusBadge');
    const btnEntrada = document.getElementById('btnEntrada');
    const btnSalida = document.getElementById('btnSalida');

    if (!asistencia.hora_entrada) {
        statusBadge.textContent = 'Sin marcar';
        statusBadge.className = 'status-badge status-sin-marcar';
        btnEntrada.disabled = false;
        btnSalida.disabled = true;
    } else if (!asistencia.hora_salida) {
        statusBadge.textContent = `Trabajando desde ${asistencia.hora_entrada}`;
        statusBadge.className = 'status-badge status-trabajando';
        btnEntrada.disabled = true;
        btnSalida.disabled = false;
    } else {
        statusBadge.textContent = `Jornada completa (${asistencia.hora_entrada} - ${asistencia.hora_salida})`;
        statusBadge.className = 'status-badge status-completo';
        btnEntrada.disabled = true;
        btnSalida.disabled = true;
    }
}

// Marcar asistencia
async function marcarAsistencia(tipo) {
    const button = tipo === 'entrada' ? document.getElementById('btnEntrada') : document.getElementById('btnSalida');
    const originalText = button.textContent;
    
    button.disabled = true;
    button.textContent = 'Marcando...';

    try {
        const response = await fetch(`/api/attendances/${tipo}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.success) {
            playSound(tipo);
            showMessage(data.message, 'success');
            
            // Efecto visual
            button.style.background = '#10b981';
            button.textContent = tipo === 'entrada' ? '✅ Entrada Marcada' : '✅ Salida Marcada';
            
            // Vibración en móvil
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
            
            setTimeout(() => {
                loadEstadoHoy();
                loadAsistencias();
                loadEstadisticas();
            }, 1000);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        playSound('error');
        showMessage(error.message, 'error');
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    } finally {
        setTimeout(() => {
            button.disabled = false;
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }
}

// Mostrar mensaje
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message message-${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Cargar asistencias
async function loadAsistencias() {
    try {
        const response = await fetch('/api/attendances/mis-asistencias');
        const data = await response.json();
        
        const tbody = document.getElementById('asistenciasTable');
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No hay registros de asistencia</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(row => {
            let estado = 'Sin completar';
            let badgeClass = 'badge-incompleto';
            
            if (row.hora_entrada && row.hora_salida) {
                estado = 'Completo';
                badgeClass = 'badge-completo';
            } else if (row.hora_entrada) {
                estado = 'Solo entrada';
            }

            return `
                <tr>
                    <td>${new Date(row.fecha).toLocaleDateString('es-ES')}</td>
                    <td>${row.hora_entrada || '-'}</td>
                    <td>${row.hora_salida || '-'}</td>
                    <td>
                        <span class="badge ${badgeClass}">
                            ${estado}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error:', error);
    }
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

// Cargar estadísticas
async function loadEstadisticas() {
    try {
        const response = await fetch('/api/attendances/estadisticas');
        const stats = await response.json();
        
        // Estado de hoy
        document.getElementById('statHoy').textContent = stats.tiene_asistencia_hoy ? 'Sí' : 'No';
        
        // Días esta semana
        document.getElementById('statSemana').textContent = stats.dias_trabajados_semana || 0;
        
        // Días este mes
        document.getElementById('statMes').textContent = stats.dias_trabajados_mes || 0;
        
        // Promedio mensual
        document.getElementById('statPromedio').textContent = `${stats.promedio_mensual || 0}%`;
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        // Valores por defecto en caso de error
        document.getElementById('statHoy').textContent = 'No';
        document.getElementById('statSemana').textContent = '0';
        document.getElementById('statMes').textContent = '0';
        document.getElementById('statPromedio').textContent = 'NaN%';
    }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadEstadoHoy();
    loadAsistencias();
    loadEstadisticas();
});
