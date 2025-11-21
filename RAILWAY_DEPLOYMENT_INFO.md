# 🚀 Railway Deployment - Información

## ✅ Estado del Deployment

**URL Pública:** https://leads-whast-meta-production.up.railway.app

**Repositorio GitHub:** https://github.com/TheAndrewww/leads-whast-meta

**Estado:** ✅ Servicio funcionando correctamente

## 🔍 Endpoints Disponibles

### 1. Health Check (Público)
```bash
curl https://leads-whast-meta-production.up.railway.app/health
```
**Respuesta:**
```json
{
  "status": "ok",
  "service": "railway-webhook",
  "timestamp": "2025-11-19T..."
}
```

### 2. Estadísticas (Público)
```bash
curl https://leads-whast-meta-production.up.railway.app/stats
```

### 3. API Protegida (Requiere API_KEY)
```bash
curl -H "x-api-key: TU_API_KEY" https://leads-whast-meta-production.up.railway.app/api/stats
```

### 4. Webhook de Facebook (POST)
```
URL: https://leads-whast-meta-production.up.railway.app/webhook/facebook-leads
Método: GET (verificación) y POST (recibir leads)
```

## 🔑 API Key

**Tu API Key para el cliente local:**
```
0f75901005b036b1ed75ee359075fc017bae298b0c3d85169766fbd1b836468f
```

**⚠️ IMPORTANTE:**
- Esta API_KEY debe estar configurada **EXACTAMENTE IGUAL** en Railway
- Sin espacios, sin comillas
- La necesitarás para configurar el cliente local de WhatsApp

## 📋 Configuración para Facebook Webhook

Una vez que verifiques que la API_KEY funciona:

**Callback URL:**
```
https://leads-whast-meta-production.up.railway.app/webhook/facebook-leads
```

**Verify Token:**
```
mitoken123
```

**Campos a suscribir:**
- `leadgen`

## 🔄 Próximos Pasos

1. ✅ Verificar que API_KEY esté correctamente configurada en Railway
2. ⏳ Configurar webhook en Facebook Developer Console
3. ⏳ Configurar cliente local de WhatsApp
4. ⏳ Probar el flujo completo

## 🛠️ Para Actualizaciones Futuras

Cada vez que hagas cambios en el código:

```bash
cd railway-webhook
# Hacer tus cambios
git add .
git commit -m "Descripción del cambio"
git push origin main
```

Railway detectará automáticamente el push y hará re-deploy.

## 📊 Monitoreo

**Ver logs en Railway:**
- Ve a tu proyecto en Railway
- Click en "Deployments"
- Click en el deployment activo
- Verás los logs en tiempo real

**Ver estadísticas:**
```bash
curl https://leads-whast-meta-production.up.railway.app/stats
```

## ⚠️ Troubleshooting

### API_KEY no funciona
1. Ve a Railway → Variables
2. Verifica que `API_KEY` esté sin espacios ni comillas
3. Debe ser exactamente: `0f75901005b036b1ed75ee359075fc017bae298b0c3d85169766fbd1b836468f`
4. Si la cambias, Railway hará re-deploy automáticamente

### Servicio no responde
1. Verifica que el deployment esté "Active" en Railway
2. Revisa los logs en Railway
3. Verifica las variables de entorno

### Facebook no puede conectar
1. Verifica que la URL sea HTTPS (Railway siempre es HTTPS)
2. Verifica que `FACEBOOK_VERIFY_TOKEN` sea correcto en Railway
3. Revisa los logs cuando Facebook intente verificar
