// Sonidos para feedback
function playSound(type) {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    if (type === 'success') {
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        oscillator.frequency.setValueAtTime(1000, context.currentTime + 0.1);
    } else {
        oscillator.frequency.setValueAtTime(400, context.currentTime);
        oscillator.frequency.setValueAtTime(200, context.currentTime + 0.1);
    }
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.2);
}

// Manejo del formulario de login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    const loadingDiv = document.getElementById('loading');
    const loginBtn = document.getElementById('loginBtn');
    
    // Limpiar errores previos
    errorDiv.style.display = 'none';
    
    // Mostrar loading
    loadingDiv.style.display = 'block';
    loginBtn.disabled = true;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            playSound('success');
            // Efecto visual de éxito
            loginBtn.style.background = '#10b981';
            loginBtn.textContent = '✅ ¡Bienvenido!';
            setTimeout(() => {
                // Redirigir según el rol del usuario
                if (data.user && data.user.es_admin) {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/employee';
                }
            }, 1000);
        } else {
            throw new Error(data.error || 'Error al iniciar sesión');
        }
    } catch (error) {
        playSound('error');
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        // Efecto de vibración en mobile
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    } finally {
        if (!document.querySelector('.success')) {
            loadingDiv.style.display = 'none';
            loginBtn.disabled = false;
        }
    }
});

// Auto-focus en el campo de email
document.getElementById('email').focus();

// Efecto de tecleo
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});
