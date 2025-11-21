# Sistema de Distribución de Leads - Facebook → WhatsApp

Sistema automatizado para recibir leads de Facebook Lead Ads y distribuirlos alternadamente entre asesores VRJ y DLAB vía WhatsApp.

## 🏗️ Arquitectura

El sistema está dividido en **dos componentes independientes**:

### 1. Railway Webhook (Cloud)
Servicio en Railway que:
- ✅ Recibe webhooks de Facebook Lead Ads
- ✅ Procesa y almacena leads en Google Sheets
- ✅ Alterna distribución entre VRJ y DLAB
- ✅ Expone API REST para consultar mensajes pendientes
- ✅ Base de datos SQLite para cola de mensajes

📁 **Directorio:** `railway-webhook/`

### 2. Cliente WhatsApp Local (Tu Computadora)
Servicio local que:
- ✅ Conecta WhatsApp Web usando whatsapp-web.js
- ✅ Consulta API de Railway cada 10 segundos
- ✅ Envía mensajes a grupos de WhatsApp
- ✅ Marca mensajes como procesados

📁 **Directorio:** `whatsapp-local/`

## 🚀 Quick Start

### Opción 1: Leer Guía Rápida
```bash
cat QUICK-START.md
```

### Opción 2: Deployment Completo
```bash
cat README-DEPLOYMENT.md
```

## 📂 Estructura del Proyecto

```
.
├── railway-webhook/          # Servicio para Railway (Cloud)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── webhook.js   # Recibe webhooks de Facebook
│   │   │   └── api.js       # API REST protegida
│   │   ├── services/
│   │   │   ├── database.js  # SQLite para mensajes pendientes
│   │   │   ├── facebook.js  # Consulta API de Facebook
│   │   │   ├── distributor.js  # Alterna VRJ/DLAB
│   │   │   ├── sheets.js    # Google Sheets (solo DATOS)
│   │   │   └── lead-processor.js  # Procesa leads completos
│   │   └── utils/
│   ├── package.json
│   ├── railway.toml
│   └── .env.example
│
├── whatsapp-local/          # Cliente local (Tu computadora)
│   ├── src/
│   │   ├── services/
│   │   │   ├── whatsapp-client.js  # Cliente WhatsApp Web
│   │   │   ├── api-client.js       # Cliente API Railway
│   │   │   └── message-sender.js   # Polling y envío
│   │   └── utils/
│   ├── package.json
│   ├── start-local.sh
│   └── .env.example
│
├── QUICK-START.md           # Guía rápida de setup
├── README-DEPLOYMENT.md     # Guía detallada de deployment
└── README.md               # Este archivo
```

## 🔑 Variables de Entorno

### Railway Webhook
```bash
FACEBOOK_ACCESS_TOKEN=...
FACEBOOK_VERIFY_TOKEN=...
GOOGLE_SPREADSHEET_ID=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="..."
WHATSAPP_GRUPO_VRJ=...
WHATSAPP_GRUPO_DLAB=...
API_KEY=...  # Genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
PORT=3000
```

### WhatsApp Local
```bash
WHATSAPP_GRUPO_PRINCIPAL=...
WHATSAPP_GRUPO_VRJ=...
WHATSAPP_GRUPO_DLAB=...
RAILWAY_API_URL=https://tu-proyecto.up.railway.app
API_KEY=...  # LA MISMA que en Railway
POLLING_INTERVAL_MS=10000
```

## 📊 Flujo de Datos

```
Facebook Lead → Railway Webhook → Google Sheets (DATOS)
                       ↓
                SQLite Database
                       ↓
                   API REST
                       ↓
             WhatsApp Local (polling)
                       ↓
              Grupos de WhatsApp
```

## 🛠️ Instalación

### 1. Railway
```bash
cd railway-webhook
cp .env.example .env
# Editar .env con tus credenciales
# Subir a Railway
```

### 2. Local
```bash
cd whatsapp-local
cp .env.example .env
# Editar .env con Railway URL y API_KEY
npm install
./start-local.sh
# Escanear QR code
```

## 🔍 Verificación

### Health Check
```bash
curl https://tu-proyecto.up.railway.app/health
```

### Estadísticas
```bash
curl -H "x-api-key: tu-api-key" https://tu-proyecto.up.railway.app/api/stats
```

### Mensajes Pendientes
```bash
curl -H "x-api-key: tu-api-key" https://tu-proyecto.up.railway.app/api/pending-messages
```

## 📖 Documentación

- **[QUICK-START.md](./QUICK-START.md)** - Setup en 10 minutos
- **[README-DEPLOYMENT.md](./README-DEPLOYMENT.md)** - Guía completa de deployment

## 🚨 Troubleshooting

**Railway no recibe webhooks:**
```bash
# Verifica configuración en Facebook Developer Console
# URL: https://tu-proyecto.up.railway.app/webhook/facebook-leads
# Verify Token: el valor de FACEBOOK_VERIFY_TOKEN
```

**Local no conecta con Railway:**
```bash
# Verifica conectividad
curl -H "x-api-key: tu-api-key" https://tu-proyecto.up.railway.app/api/stats

# Verifica que API_KEY sea la misma en ambos lados
```

**WhatsApp desconectado:**
```bash
# Elimina la carpeta de autenticación y vuelve a escanear QR
rm -rf whatsapp-local/.wwebjs_auth
cd whatsapp-local && node src/index.js
```

## 💡 Características

✅ **Sin modificar Google Sheets** - Solo se escribe en la hoja DATOS
✅ **Base de datos local** - SQLite en Railway para mensajes pendientes
✅ **API REST segura** - Autenticación con API Key
✅ **Polling eficiente** - Consulta cada 10 segundos
✅ **Reconexión automática** - WhatsApp se reconecta automáticamente
✅ **Logging completo** - Logs en archivos y consola
✅ **Distribución alternada** - VRJ y DLAB reciben leads alternadamente

## 📝 Licencia

ISC
