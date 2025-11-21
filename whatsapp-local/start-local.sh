#!/bin/bash

# Script para iniciar el cliente local de WhatsApp

echo "🚀 Iniciando cliente local de WhatsApp..."

# Verificar que existe el .env
if [ ! -f .env ]; then
    echo "❌ Error: No existe el archivo .env"
    echo "Por favor copia .env.example a .env y configura las variables"
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Iniciar el servicio
echo "▶️ Iniciando servicio..."
node src/index.js
