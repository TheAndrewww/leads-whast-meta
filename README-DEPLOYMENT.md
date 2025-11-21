# Guía de Deployment - Sistema de Leads

Este sistema está dividido en dos partes:

## 🏗️ Arquitectura

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Facebook Lead  │  ───>   │  Railway Webhook │  ───>   │  Google Sheets  │
│      Ads        │         │   (Cloud API)     │         │     (DATOS)     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                      │
                                      │ Guarda en
                                      ▼
                            ┌──────────────────┐
                            │  SQLite Database │
                            │  (mensajes cola) │
                            └──────────────────┘
                                      │
                                      │ API REST
                                      ▼
                            ┌──────────────────┐
                            │  WhatsApp Local  │
                            │ (Tu Computadora) │
                            └──────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  Grupos WhatsApp │
                            └──────────────────┘
```

### Parte 1: Railway Webhook (Cloud)
- Recibe webhooks de Facebook
- Procesa leads y los guarda en Google Sheets (hoja DATOS)
- Almacena mensajes pendientes en base de datos SQLite local
- Expone API REST para consultar mensajes pendientes
- **NO** incluye whatsapp-web.js (más estable en cloud)

### Parte 2: WhatsApp Local (Tu Computadora)
- Ejecuta whatsapp-web.js 24/7
- Consulta API de Railway cada 10 segundos
- Envía mensajes a grupos de WhatsApp
- Marca mensajes como procesados vía API

---

## 📦 Parte 1: Deployment en Railway

### Paso 1: Preparar el proyecto

```bash
cd railway-webhook
cp .env.example .env
```

### Paso 2: Configurar variables de entorno

Edita el archivo `.env` con tus credenciales:

```bash
# Facebook
FACEBOOK_ACCESS_TOKEN=tu_token_aqui
FACEBOOK_VERIFY_TOKEN=mitoken123

# Google Sheets (mismas credenciales que usas localmente)
GOOGLE_SPREADSHEET_ID=tu_spreadsheet_id
GOOGLE_SHEET_NAME=DATOS
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu_email@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# WhatsApp (solo IDs, no se envían mensajes desde Railway)
WHATSAPP_GRUPO_VRJ=5214626329312-1607543001@g.us
WHATSAPP_GRUPO_DLAB=5214626329312-1610481856@g.us

# Server
PORT=3000
NODE_ENV=production

# API Security (crea una clave segura y guárdala)
API_KEY=genera-una-clave-segura-aqui-ejemplo-abc123xyz456
```

### Paso 3: Inicializar Git (si no lo has hecho)

```bash
git init
git add .
git commit -m "Initial commit: Railway webhook"
```

### Paso 4: Deploy en Railway

1. Ve a https://railway.app
2. Crea una nueva cuenta o inicia sesión
3. Haz clic en **"New Project"**
4. Selecciona **"Deploy from GitHub repo"** o **"Deploy from local"**

#### Opción A: Desde GitHub
1. Conecta tu repositorio de GitHub
2. Railway detectará automáticamente el proyecto Node.js
3. Configura las variables de entorno en Railway:
   - Ve a **Variables**
   - Agrega todas las variables del `.env`

#### Opción B: Desde CLI de Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway init

# Agregar variables de entorno
railway variables set FACEBOOK_ACCESS_TOKEN="tu_token"
railway variables set FACEBOOK_VERIFY_TOKEN="mitoken123"
railway variables set GOOGLE_SPREADSHEET_ID="tu_id"
# ... agrega todas las variables

# Deploy
railway up
```

### Paso 5: Obtener la URL del webhook

Después del deployment, Railway te dará una URL como:
```
https://tu-proyecto.up.railway.app
```

Tu webhook URL será:
```
https://tu-proyecto.up.railway.app/webhook/facebook-leads
```

### Paso 6: Configurar el webhook en Facebook

1. Ve a Facebook Developer Console
2. Selecciona tu app
3. Ve a **Webhooks**
4. Edita tu webhook de Lead Ads:
   - **Callback URL**: `https://tu-proyecto.up.railway.app/webhook/facebook-leads`
   - **Verify Token**: `mitoken123` (el mismo que pusiste en FACEBOOK_VERIFY_TOKEN)
5. Guarda y verifica el webhook

---

## 💻 Parte 2: Cliente WhatsApp Local

### Paso 1: Preparar el proyecto local

```bash
cd whatsapp-local
cp .env.example .env
```

### Paso 2: Configurar variables de entorno

Edita el archivo `.env`:

```bash
# WhatsApp Web
WHATSAPP_GRUPO_PRINCIPAL=5214621654009-1551387794@g.us
WHATSAPP_GRUPO_VRJ=5214626329312-1607543001@g.us
WHATSAPP_GRUPO_DLAB=5214626329312-1610481856@g.us

# Railway API
RAILWAY_API_URL=https://tu-proyecto.up.railway.app
API_KEY=la-misma-api-key-que-configuraste-en-railway

# Polling (cada cuántos ms consultar la API)
POLLING_INTERVAL_MS=10000

# Configuración
NODE_ENV=production
```

**IMPORTANTE:**
- `RAILWAY_API_URL` debe ser la URL que te dio Railway (sin el `/` al final)
- `API_KEY` debe ser **exactamente la misma** que configuraste en Railway

### Paso 3: Instalar dependencias

```bash
npm install
```

### Paso 4: Iniciar el cliente

```bash
# Opción 1: Directamente
node src/index.js

# Opción 2: Con el script
./start-local.sh
```

### Paso 5: Escanear código QR

1. Cuando el cliente inicie, verás un código QR en la terminal
2. Abre WhatsApp en tu teléfono
3. Ve a **Configuración > Dispositivos vinculados**
4. Escanea el código QR
5. ¡Listo! El cliente quedará autenticado

### Paso 6: Mantener corriendo 24/7

Para que el cliente siga corriendo incluso si cierras la terminal:

```bash
# Opción 1: Usar screen (recomendado para desarrollo)
screen -S whatsapp
node src/index.js
# Presiona Ctrl+A, luego D para detach
# Para volver: screen -r whatsapp

# Opción 2: Usar PM2 (recomendado para producción)
npm install -g pm2
pm2 start src/index.js --name whatsapp-local
pm2 save
pm2 startup  # Sigue las instrucciones para auto-inicio

# Ver logs
pm2 logs whatsapp-local

# Reiniciar
pm2 restart whatsapp-local
```

---

## 🔍 Verificación y Testing

### Verificar Railway

```bash
# Health check
curl https://tu-proyecto.up.railway.app/health

# Ver stats
curl https://tu-proyecto.up.railway.app/stats
```

### Verificar Cliente Local

Los logs mostrarán:
```
✅ WhatsApp Web está listo
📱 Grupos de WhatsApp cargados: 3
  - VRJ (5214626329312-1607543001@g.us)
  - DLAB (5214626329312-1610481856@g.us)
  - PRINCIPAL (5214621654009-1551387794@g.us)
🔄 Iniciando polling cada 10 segundos...
```

### Test completo

1. Envía un lead de prueba a Facebook
2. Railway debe recibirlo y guardarlo en Google Sheets (hoja DATOS)
3. Railway debe crear un registro en la base de datos SQLite
4. El cliente local debe detectarlo en los próximos 10 segundos (consultando la API)
5. El mensaje debe llegar a WhatsApp
6. El cliente local debe marcar el mensaje como procesado vía API

---

## 📊 Monitoreo

### Railway
- Ve a tu dashboard en Railway
- Revisa los logs en tiempo real
- Configura alertas de errores

### Local
```bash
# Ver logs del día
tail -f logs/$(date +%Y-%m-%d).log

# Con PM2
pm2 logs whatsapp-local --lines 100
```

### Base de Datos
Puedes consultar las estadísticas de la base de datos:
```bash
curl -H "x-api-key: tu-api-key" https://tu-proyecto.up.railway.app/api/stats
```

Esto te mostrará:
- Total de mensajes
- Mensajes pendientes
- Mensajes procesados
- Mensajes con error

---

## 🚨 Troubleshooting

### Railway no recibe webhooks
1. Verifica que la URL esté configurada en Facebook
2. Revisa los logs de Railway
3. Verifica el FACEBOOK_VERIFY_TOKEN

### Cliente local no envía mensajes
1. Verifica que WhatsApp esté conectado (logs deben decir "✅ WhatsApp Web está listo")
2. Verifica que `RAILWAY_API_URL` esté correcta y accesible
3. Verifica que `API_KEY` sea la misma en Railway y en local
4. Prueba la conexión manualmente:
   ```bash
   curl -H "x-api-key: tu-api-key" https://tu-proyecto.up.railway.app/api/stats
   ```
5. Verifica los IDs de los grupos de WhatsApp

### WhatsApp se desconecta
- El cliente tiene reconexión automática
- Si persiste, elimina la carpeta `.wwebjs_auth` y vuelve a escanear el QR

---

## 🔄 Actualizar el Sistema

### Railway
```bash
cd railway-webhook
git add .
git commit -m "Update webhook"
git push  # Railway hace auto-deploy
```

### Local
```bash
cd whatsapp-local
git pull
pm2 restart whatsapp-local
```

---

## 💡 Ventajas de esta Arquitectura

1. **Estabilidad**: Railway es más estable que ejecutar todo localmente
2. **Escalabilidad**: Railway puede manejar muchos webhooks simultáneos
3. **Simplicidad**: Solo necesitas mantener tu computadora corriendo para WhatsApp
4. **Persistencia**: Los mensajes quedan en base de datos SQLite si el cliente está offline
5. **Monitoreo**: Fácil de monitorear ambas partes por separado
6. **Sin modificar Google Sheets**: La hoja DATOS permanece intacta, solo para consulta
7. **API REST**: Comunicación moderna y eficiente entre Railway y tu computadora

---

## 📝 Notas Importantes

- **Base de datos SQLite en Railway**: Almacena la cola de mensajes pendientes
- **API REST protegida**: Usa `API_KEY` para autenticación segura
- **Polling cada 10 segundos**: Puedes ajustar `POLLING_INTERVAL_MS` si quieres más/menos frecuencia
- **Google Sheets solo para DATOS**: La hoja de Google Sheets NO se modifica, solo almacena leads
- **Persistencia**: Railway usa volumen persistente para la base de datos
- **Estados de mensajes**:
  - `0` = Pendiente
  - `1` = Procesado exitosamente
  - `-1` = Error al enviar

## 🔐 Seguridad

La API está protegida con `API_KEY`. Para generar una clave segura:

```bash
# Genera una clave aleatoria
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Usa esta clave en:
1. Variable `API_KEY` en Railway
2. Variable `API_KEY` en tu `.env` local

**IMPORTANTE**: Nunca compartas tu `API_KEY` públicamente.
