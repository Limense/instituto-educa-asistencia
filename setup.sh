#!/bin/bash

echo "🚀 Preparando proyecto para despliegue..."

# Verificar que node y npm estén instalados
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ Node.js y npm encontrados"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Inicializar base de datos
echo "🗄️ Inicializando base de datos..."
npm run init-db

echo "✅ Proyecto preparado exitosamente"
echo ""
echo "🎯 Para iniciar en desarrollo: npm run dev"
echo "🚀 Para iniciar en producción: npm start"
echo ""
echo "📋 Cuentas por defecto:"
echo "   👨‍💼 Admin: admin@instituto.edu / admin123"
echo "   👤 Empleado: empleado@instituto.edu / empleado123"
echo ""
echo "🌐 El servidor estará en: http://localhost:3000"
