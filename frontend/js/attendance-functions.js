/**
 * Funciones de Asistencia - Instituto Educa
 * Funciones específicas para el manejo de asistencia
 */

// Función para marcar entrada
async function clockIn() {
    try {
        showToast('Marcando entrada...', 'info');
        
        const apiService = new ApiService();
        
        // Verificar estado actual primero
        const statusResult = await apiService.get('/attendance/status');
        if (statusResult.success && !statusResult.data.canClockIn) {
            showToast('Ya has marcado entrada hoy', 'warning');
            return;
        }
        
        const result = await apiService.post('/attendance/clock-in', {
            location: {
                latitude: null,
                longitude: null,
                address: 'Oficina Principal'
            },
            observations: 'Entrada manual desde dashboard'
        });
        
        if (result.success) {
            showToast('✅ Entrada registrada correctamente', 'success');
            // Recargar datos del dashboard
            loadDashboardData();
            loadRecentActivity();
            updateAttendanceButtons();
        } else {
            throw new Error(result.message || 'Error al registrar entrada');
        }
        
    } catch (error) {
        console.error('Error marcando entrada:', error);
        let errorMsg = 'Error al marcar entrada';
        
        if (error.message && error.message.includes('429')) {
            errorMsg = 'Demasiadas peticiones. Espera un momento y vuelve a intentar.';
        } else if (error.message && error.message.includes('Ya existe un registro')) {
            errorMsg = 'Ya has marcado entrada hoy';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        showToast('❌ ' + errorMsg, 'error');
    }
}

// Función para marcar salida
async function clockOut() {
    try {
        showToast('Marcando salida...', 'info');
        
        const apiService = new ApiService();
        
        // Verificar estado actual primero
        const statusResult = await apiService.get('/attendance/status');
        if (statusResult.success && !statusResult.data.canClockOut) {
            showToast('No puedes marcar salida sin haber marcado entrada', 'warning');
            return;
        }
        
        const result = await apiService.post('/attendance/clock-out', {
            location: {
                latitude: null,
                longitude: null,
                address: 'Oficina Principal'
            },
            observations: 'Salida manual desde dashboard'
        });
        
        if (result.success) {
            showToast('✅ Salida registrada correctamente', 'success');
            // Recargar datos del dashboard
            loadDashboardData();
            loadRecentActivity();
            updateAttendanceButtons();
        } else {
            throw new Error(result.message || 'Error al registrar salida');
        }
        
    } catch (error) {
        console.error('Error marcando salida:', error);
        let errorMsg = 'Error al marcar salida';
        
        if (error.message && error.message.includes('429')) {
            errorMsg = 'Demasiadas peticiones. Espera un momento y vuelve a intentar.';
        } else if (error.message && error.message.includes('No se encontró registro')) {
            errorMsg = 'Debes marcar entrada antes de marcar salida';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        showToast('❌ ' + errorMsg, 'error');
    }
}

// Función para actualizar el estado de los botones de asistencia
async function updateAttendanceButtons() {
    try {
        const apiService = new ApiService();
        const statusResult = await apiService.get('/attendance/status');
        
        if (statusResult.success) {
            const clockInBtn = document.getElementById('clockInBtn');
            const clockOutBtn = document.getElementById('clockOutBtn');
            
            if (clockInBtn) {
                clockInBtn.disabled = !statusResult.data.canClockIn;
                clockInBtn.style.opacity = statusResult.data.canClockIn ? '1' : '0.5';
                clockInBtn.title = statusResult.data.canClockIn ? 
                    'Marcar entrada' : 'Ya has marcado entrada hoy';
            }
            
            if (clockOutBtn) {
                clockOutBtn.disabled = !statusResult.data.canClockOut;
                clockOutBtn.style.opacity = statusResult.data.canClockOut ? '1' : '0.5';
                clockOutBtn.title = statusResult.data.canClockOut ? 
                    'Marcar salida' : 'Debes marcar entrada primero';
            }
        }
    } catch (error) {
        console.error('Error updating attendance buttons:', error);
    }
}

// Función para obtener resumen de asistencia
async function getAttendanceSummary() {
    try {
        const apiService = new ApiService();
        const summary = await apiService.get('/attendance/summary');
        
        if (summary.success) {
            return summary.data;
        }
        return null;
    } catch (error) {
        console.error('Error getting attendance summary:', error);
        return null;
    }
}

// Función para obtener datos semanales
async function getWeeklyData() {
    try {
        const apiService = new ApiService();
        const weekly = await apiService.get('/attendance/weekly');
        
        if (weekly.success) {
            return weekly.data;
        }
        return null;
    } catch (error) {
        console.error('Error getting weekly data:', error);
        return null;
    }
}

// Función para obtener datos mensuales
async function getMonthlyData(year = null, month = null) {
    try {
        const apiService = new ApiService();
        let url = '/attendance/monthly';
        
        if (year && month) {
            url += `?year=${year}&month=${month}`;
        }
        
        const monthly = await apiService.get(url);
        
        if (monthly.success) {
            return monthly.data;
        }
        return null;
    } catch (error) {
        console.error('Error getting monthly data:', error);
        return null;
    }
}
