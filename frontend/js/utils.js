const Utils = {
    // Obtener la fecha de hoy en formato YYYY-MM-DD
    getToday() {
        const date = new Date();
        return date.toISOString().split('T')[0];
    },

    // Calcular horas trabajadas
    calculateHours(checkIn, checkOut) {
        if (!checkIn || !checkOut) return '0.00';
        
        const [inHours, inMinutes] = checkIn.split(':').map(Number);
        const [outHours, outMinutes] = checkOut.split(':').map(Number);

        // Validar que las horas sean válidas
        if (isNaN(inHours) || isNaN(inMinutes) || isNaN(outHours) || isNaN(outMinutes)) {
            return '0.00';
        }

        const start = new Date(0, 0, 0, inHours, inMinutes);
        const end = new Date(0, 0, 0, outHours, outMinutes);

        // Si la hora de salida es menor que la de entrada, asumimos que es del día siguiente
        if (end < start) {
            end.setDate(end.getDate() + 1);
        }

        const diff = (end - start) / (1000 * 60 * 60);
        return Math.max(0, diff).toFixed(2); // Evitar valores negativos
    },

    // Descargar un archivo JSON
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    // Crear modal dinámico
    createModal(title, content, options = {}) {
        // Remover modal existente si existe
        const existingModal = document.getElementById('dynamicModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'dynamicModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content ${options.size || 'medium'}">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="Utils.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
            </div>
        `;

        document.body.appendChild(modal);

        // Agregar event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Event listener para ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        return modal;
    },

    // Cerrar modal
    closeModal() {
        const modal = document.getElementById('dynamicModal');
        if (modal) {
            modal.remove();
        }
    },

    // Mostrar confirmación
    confirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            const content = `
                <p>${message}</p>
                <div class="confirmation-buttons">
                    <button class="btn btn-secondary" onclick="Utils.resolveConfirm(false)">Cancelar</button>
                    <button class="btn btn-danger" onclick="Utils.resolveConfirm(true)">Confirmar</button>
                </div>
            `;
            
            this.createModal(title, content, { size: 'small' });
            this._confirmResolve = resolve;
        });
    },

    // Resolver confirmación
    resolveConfirm(result) {
        if (this._confirmResolve) {
            this._confirmResolve(result);
            this._confirmResolve = null;
        }
        this.closeModal();
    },

    // Formatear fecha para mostrar
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    },

    // Formatear tiempo
    formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    },

    // Validar hora en formato HH:MM
    isValidTime(timeString) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeString);
    },

    // Generar ID único
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export para uso global
window.Utils = Utils;