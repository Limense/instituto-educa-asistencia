// Servidor simple para servir archivos estáticos del frontend
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(cors());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Ruta para index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Manejo de rutas SPA - redirigir todo a index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
    🌐 Servidor Frontend Instituto Educa iniciado
    
    📍 Puerto: ${PORT}
    🔗 URL: http://localhost:${PORT}
    📁 Sirviendo archivos desde: ${__dirname}
    
    ⏰ ${new Date().toLocaleString()}
    `);
});

module.exports = app;
