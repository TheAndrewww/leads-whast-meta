# Estructura del Proyecto

## 📁 Directorio Raíz

```
Proyecto Leads-automaticos/
│
├── railway-webhook/          ← DEPLOY ESTO A RAILWAY
│   ├── src/
│   │   ├── routes/
│   │   │   ├── webhook.js           # Webhook de Facebook
│   │   │   └── api.js               # API REST para cliente local
│   │   ├── services/
│   │   │   ├── database.js          # SQLite (cola de mensajes)
│   │   │   ├── facebook.js          # Consulta Facebook Graph API
│   │   │   ├── distributor.js       # Alterna VRJ/DLAB
│   │   │   ├── sheets.js            # Guarda en Google Sheets
│   │   │   └── lead-processor.js    # Procesa leads completos
│   │   ├── utils/
│   │   │   └── logger.js
│   │   └── index.js                 # Entry point
│   ├── package.json
│   ├── railway.toml
│   ├── nixpacks.toml
│   ├── .env.example                 # ← COPIA A .env Y CONFIGURA
│   └── .gitignore
│
├── whatsapp-local/           ← EJECUTA ESTO EN TU COMPUTADORA
│   ├── src/
│   │   ├── services/
│   │   │   ├── whatsapp-client.js   # Cliente WhatsApp Web
│   │   │   ├── api-client.js        # Consulta API de Railway
│   │   │   └── message-sender.js    # Polling y envío mensajes
│   │   ├── utils/
│   │   │   └── logger.js
│   │   └── index.js                 # Entry point
│   ├── package.json
│   ├── start-local.sh               # Script de inicio
│   ├── .env.example                 # ← COPIA A .env Y CONFIGURA
│   └── .gitignore
│
├── OLD_VERSION/              ← Versión anterior (SOLO REFERENCIA)
│   └── README.md
│
├── README.md                 ← Lee esto primero
├── QUICK-START.md            ← Setup rápido en 10 minutos
├── README-DEPLOYMENT.md      ← Guía completa de deployment
├── STRUCTURE.md              ← Este archivo
└── .gitignore
```

## 🔄 Flujo de Trabajo

### 1. Setup Railway (Una sola vez)

```bash
cd railway-webhook
cp .env.example .env
# Edita .env con tus credenciales
# Sube a Railway
```

**Necesitas configurar:**
- `FACEBOOK_ACCESS_TOKEN`
- `FACEBOOK_VERIFY_TOKEN`
- `GOOGLE_*` (credenciales de Google Sheets)
- `WHATSAPP_GRUPO_VRJ` y `WHATSAPP_GRUPO_DLAB` (IDs de grupos)
- `API_KEY` (genera una segura)

### 2. Setup Local (Una sola vez)

```bash
cd whatsapp-local
cp .env.example .env
# Edita .env con:
#   - RAILWAY_API_URL (la URL que te dio Railway)
#   - API_KEY (la MISMA que pusiste en Railway)
#   - WHATSAPP_GRUPO_* (IDs de tus grupos)

npm install
./start-local.sh
# Escanea el QR que aparece
```

### 3. Uso Diario

Una vez configurado:

**Railway:**
- Corre automáticamente 24/7 en Railway
- Recibe leads de Facebook
- Los guarda en Google Sheets
- Los pone en cola (base de datos SQLite)

**Local:**
- Debe estar corriendo en tu computadora 24/7
- Consulta Railway cada 10 segundos
- Envía mensajes a WhatsApp
- Marca como procesados

## 📊 Archivos Importantes

### Railway Webhook

| Archivo | Propósito |
|---------|-----------|
| `src/routes/webhook.js` | Recibe webhooks de Facebook |
| `src/routes/api.js` | API REST para cliente local |
| `src/services/database.js` | Base de datos SQLite |
| `src/services/lead-processor.js` | Lógica principal |
| `.env` | Variables de entorno (NO SUBIR A GIT) |

### WhatsApp Local

| Archivo | Propósito |
|---------|-----------|
| `src/services/whatsapp-client.js` | Maneja WhatsApp Web |
| `src/services/api-client.js` | Consulta Railway |
| `src/services/message-sender.js` | Polling y envío |
| `.env` | Variables de entorno (NO SUBIR A GIT) |

## 🔐 Seguridad

**Archivos que NUNCA debes commitear:**
- `.env` (en ambos proyectos)
- `*.json` (credenciales de Google)
- `.wwebjs_auth/` (sesión de WhatsApp)
- `data/` (base de datos local)
- `logs/` (archivos de log)

## 🚀 Comandos Rápidos

### Railway (después de deployment)
```bash
# Ver logs
railway logs

# Ver variables
railway variables

# Reiniciar
railway up
```

### Local
```bash
# Inicio simple
cd whatsapp-local && node src/index.js

# Con PM2 (recomendado para 24/7)
pm2 start src/index.js --name whatsapp-local
pm2 logs whatsapp-local
pm2 restart whatsapp-local
```

## ✅ Checklist de Verificación

### Railway está corriendo si:
- [ ] `curl https://tu-proyecto.up.railway.app/health` responde OK
- [ ] Logs muestran "Servidor HTTP corriendo en puerto 3000"
- [ ] Facebook webhook está verificado

### Local está corriendo si:
- [ ] Logs muestran "✅ WhatsApp Web está listo"
- [ ] Logs muestran "🔄 Iniciando polling cada 10 segundos..."
- [ ] No hay errores de conexión a Railway API

### Sistema funciona si:
- [ ] Un lead de prueba llega a Railway
- [ ] Se guarda en Google Sheets
- [ ] En máximo 10 segundos llega a WhatsApp
- [ ] Se marca como procesado en Railway

## 🔧 Mantenimiento

### Cada semana:
- Revisar logs de Railway para errores
- Verificar que local siga corriendo
- Revisar que WhatsApp siga conectado

### Cada mes:
- Limpiar logs antiguos
- Verificar espacio en disco (base de datos)
- Actualizar dependencias si es necesario

## 📞 Soporte

Si algo no funciona:
1. Lee `README-DEPLOYMENT.md` sección Troubleshooting
2. Revisa los logs (Railway y local)
3. Verifica que `API_KEY` sea la misma en ambos lados
4. Verifica conectividad: `curl -H "x-api-key: KEY" URL/api/stats`
