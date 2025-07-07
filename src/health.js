const express = require('express');
const path = require('path');

// Crear una mini app para health check
const healthApp = express();

// Health check endpoint
healthApp.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Verificar que los archivos críticos existen
healthApp.get('/health/detailed', (req, res) => {
    const fs = require('fs');
    const checks = {
        database_dir: fs.existsSync(path.join(__dirname, '../database')),
        public_dir: fs.existsSync(path.join(__dirname, '../public')),
        src_dir: fs.existsSync(path.join(__dirname, '../src')),
        package_json: fs.existsSync(path.join(__dirname, '../package.json'))
    };
    
    const allHealthy = Object.values(checks).every(check => check === true);
    
    res.status(allHealthy ? 200 : 500).json({
        status: allHealthy ? 'OK' : 'ERROR',
        timestamp: new Date().toISOString(),
        checks,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});

module.exports = healthApp;
