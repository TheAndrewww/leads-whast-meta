# Quick Start - Sistema de Leads

## 🚀 Setup Rápido

### 1️⃣ Railway (5 minutos)

```bash
cd railway-webhook
cp .env.example .env
# Edita .env con tus credenciales
```

**Variables críticas:**
- `FACEBOOK_ACCESS_TOKEN` y `FACEBOOK_VERIFY_TOKEN`
- `GOOGLE_*` (credenciales de Google Sheets)
- `API_KEY` (genera una con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

**Deployment:**
1. Sube a Railway: https://railway.app
2. Conecta tu repo o usa Railway CLI
3. Railway te dará una URL: `https://tu-proyecto.up.railway.app`
4. Configura webhook en Facebook Developer Console

### 2️⃣ Local (5 minutos)

```bash
cd whatsapp-local
cp .env.example .env
# Edita .env
```

**Variables críticas:**
- `RAILWAY_API_URL=https://tu-proyecto.up.railway.app` (la URL de Railway)
- `API_KEY=...` (la MISMA que pusiste en Railway)
- `WHATSAPP_GRUPO_*` (IDs de tus grupos)

**Iniciar:**
```bash
npm install
node src/index.js
# Escanea el QR que aparece
```

## ✅ Verificar que funciona

1. **RailwayHealth Check:**
   ```bash
   curl https://tu-proyecto.up.railway.app/health
   ```

2. **API Stats:**
   ```bash
   curl -H "x-api-key: tu-api-key" https://tu-proyecto.up.railway.app/api/stats
   ```

3. **Logs locales:**
   - Debes ver: "✅ WhatsApp Web está listo"
   - Debes ver: "🔄 Iniciando polling cada 10 segundos..."

## 🧪 Enviar Lead de Prueba

Puedes crear un lead de prueba directo desde el código:

```bash
# En Railway o local con .env configurado
curl -X POST https://tu-proyecto.up.railway.app/webhook/facebook-leads \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "field": "leadgen",
        "value": {
          "leadgen_id": "TEST_LEAD_123"
        }
      }]
    }]
  }'
```

En 10 segundos deberías recibir el mensaje en WhatsApp!

## 🛠️ Comandos Útiles

### Railway (via CLI)
```bash
railway logs
railway variables
railway status
```

### Local (PM2)
```bash
pm2 start src/index.js --name whatsapp-local
pm2 logs whatsapp-local
pm2 restart whatsapp-local
pm2 stop whatsapp-local
```

## 📊 Estructura

```
railway-webhook/     → Sube esto a Railway
whatsapp-local/      → Ejecuta esto en tu computadora 24/7
```

## ❓ Problemas Comunes

**Railway no recibe webhooks:**
- Verifica URL en Facebook Developer Console
- Verifica `FACEBOOK_VERIFY_TOKEN`

**Local no envía mensajes:**
- Verifica `RAILWAY_API_URL` y `API_KEY`
- Prueba: `curl -H "x-api-key: KEY" URL/api/stats`

**WhatsApp desconectado:**
- Elimina `.wwebjs_auth/` y vuelve a escanear QR

## 📖 Documentación Completa

Lee `README-DEPLOYMENT.md` para todos los detalles.
