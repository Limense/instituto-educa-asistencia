/**
 * Verificador de Sistema - Instituto Educa
 * Script para verificar la integridad de todos los archivos
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando integridad del sistema Instituto Educa...\n');

const requiredFiles = {
    'Backend': [
        'server.js',
        'package.json',
        'config/database.js',
        'routes/auth.js',
        'routes/attendance.js',
        'routes/users.js',
        'routes/reports.js',
        'routes/departments.js',
        'routes/settings.js',
        'middleware/auth.js',
        'middleware/errorHandler.js',
        'migrate-complete.js'
    ],
    'Frontend': [
        '../frontend/index.html',
        '../frontend/js/api-service.js',
        '../frontend/js/auth.js',
        '../frontend/js/app-fixed.js',
        '../frontend/js/attendance-functions.js',
        '../frontend/js/dashboard.js',
        '../frontend/js/supervisor.js',
        '../frontend/js/services.js',
        '../frontend/js/utils.js',
        '../frontend/js/event-bus.js',
        '../frontend/js/data-factory.js',
        '../frontend/js/database.js',
        '../frontend/css/styles.css',
        '../frontend/css/theme-educa.css',
        '../frontend/css/dashboard.css'
    ],
    'Scripts': [
        '../iniciar.bat',
        '../instalar.bat',
        '../verificar.bat',
        '../README.md',
        '../CAMBIOS.md'
    ]
};

let allGood = true;
let totalFiles = 0;
let existingFiles = 0;

for (const [category, files] of Object.entries(requiredFiles)) {
    console.log(`📂 ${category}:`);
    
    for (const file of files) {
        totalFiles++;
        const fullPath = path.join(__dirname, file);
        
        if (fs.existsSync(fullPath)) {
            console.log(`  ✅ ${file}`);
            existingFiles++;
        } else {
            console.log(`  ❌ ${file} - FALTANTE`);
            allGood = false;
        }
    }
    console.log('');
}

// Verificar estructura de directorios
const requiredDirs = [
    'config',
    'routes', 
    'middleware',
    '../frontend',
    '../frontend/js',
    '../frontend/css',
    '../frontend/pages'
];

console.log('📁 Estructura de directorios:');
for (const dir of requiredDirs) {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
        console.log(`  ✅ ${dir}/`);
    } else {
        console.log(`  ❌ ${dir}/ - FALTANTE`);
        allGood = false;
    }
}

console.log('\n📊 Resumen:');
console.log(`Archivos verificados: ${existingFiles}/${totalFiles}`);
console.log(`Porcentaje de completitud: ${Math.round((existingFiles/totalFiles) * 100)}%`);

if (allGood) {
    console.log('\n🎉 ¡SISTEMA COMPLETO Y VERIFICADO!');
    console.log('✅ Todos los archivos necesarios están presentes');
    console.log('🚀 El sistema está listo para usar');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Ejecutar: npm install');
    console.log('2. Configurar base de datos MySQL');
    console.log('3. Ejecutar: ../iniciar.bat');
    console.log('4. Abrir: http://localhost:8888');
} else {
    console.log('\n⚠️  SISTEMA INCOMPLETO');
    console.log('❌ Algunos archivos están faltantes');
    console.log('🔧 Revisa los archivos marcados como FALTANTE');
}

console.log('\n📚 Para más información, consulta README.md');

process.exit(allGood ? 0 : 1);
