# 🎉 Sistema de Leads - Completamente Configurado

## ✅ Estado del Sistema

**Fecha de configuración:** 19 de Noviembre, 2025

### Railway (Cloud) ✅
- **URL:** https://leads-whast-meta-production.up.railway.app
- **GitHub:** https://github.com/TheAndrewww/leads-whast-meta
- **Estado:** Activo y funcionando
- **Webhook Facebook:** Configurado y verificado

### Cliente Local (WhatsApp) ✅
- **Estado:** Conectado a WhatsApp Web
- **Polling:** Cada 10 segundos
- **Grupos configurados:** Principal, VRJ, DLAB

---

## 🔄 Flujo del Sistema

```
1. Facebook Lead Ads envía lead
         ↓
2. Railway recibe webhook
         ↓
3. Procesa lead (consulta Facebook API)
         ↓
4. Asigna asesor (VRJ ↔ DLAB alternado)
         ↓
5. Guarda en Google Sheets (hoja DATOS)
         ↓
6. Almacena en base de datos SQLite
         ↓
7. Cliente local consulta cada 10 segundos
         ↓
8. Detecta mensaje pendiente
         ↓
9. Envía a grupos de WhatsApp
         ↓
10. Marca como procesado
```

---

## 📊 URLs y Endpoints

### Railway - Públicos

**Health Check:**
```bash
curl https://leads-whast-meta-production.up.railway.app/health
```

**Estadísticas:**
```bash
curl https://leads-whast-meta-production.up.railway.app/stats
```

**Webhook Facebook:**
```
GET/POST: https://leads-whast-meta-production.up.railway.app/webhook/facebook-leads
```

### Railway - API Protegida

**API Key:** `0f75901005b036b1ed75ee359075fc017bae298b0c3d85169766fbd1b836468f`

**Stats:**
```bash
curl -H "x-api-key: 0f75901005b036b1ed75ee359075fc017bae298b0c3d85169766fbd1b836468f" \
  https://leads-whast-meta-production.up.railway.app/api/stats
```

**Mensajes Pendientes:**
```bash
curl -H "x-api-key: 0f75901005b036b1ed75ee359075fc017bae298b0c3d85169766fbd1b836468f" \
  https://leads-whast-meta-production.up.railway.app/api/pending-messages
```

---

## 🔑 Credenciales y Configuración

### Facebook
- **Access Token:** Configurado en Railway
- **Verify Token:** `mitoken123`
- **Campos suscritos:** `leadgen`

### Google Sheets
- **Spreadsheet ID:** `1AA4KXK8wQK6QI-3feptFPopN_mlztMlfio069IMqzdU`
- **Hoja:** `DATOS`
- **Service Account:** `leads-distributor@leads-automatizacion-478718.iam.gserviceaccount.com`

### WhatsApp
- **Grupo Principal:** `5214621654009-1551387794@g.us`
- **Grupo VRJ:** `5214626329312-1607543001@g.us`
- **Grupo DLAB:** `5214626329312-1610481856@g.us`

---

## 🚀 Operación Diaria

### Cliente Local (Debe estar corriendo 24/7)

**Iniciar:**
```bash
cd /Users/nicholasandrewguidoarroyo/Downloads/Proyecto\ Leads-automaticos/whatsapp-local
node src/index.js
```

**O con PM2 (recomendado):**
```bash
pm2 start src/index.js --name whatsapp-local
pm2 save
pm2 startup
```

**Ver logs:**
```bash
pm2 logs whatsapp-local
```

**Reiniciar:**
```bash
pm2 restart whatsapp-local
```

### Railway

- **Auto-deploy:** Cada vez que hagas push a GitHub
- **Ver logs:** Railway Dashboard → Deployments → Click en deployment activo
- **Reiniciar:** Railway hace auto-restart si hay errores

---

## 🧪 Pruebas

### Enviar Lead de Prueba

```bash
curl -X POST https://leads-whast-meta-production.up.railway.app/webhook/facebook-leads \
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

**Resultado esperado:**
1. Railway procesa el lead
2. Se guarda en Google Sheets
3. En máximo 10 segundos, llega a WhatsApp
4. Aparece en grupos configurados

### Verificar Estadísticas

```bash
curl https://leads-whast-meta-production.up.railway.app/stats
```

---

## 🔧 Mantenimiento

### Actualizar Código Railway

```bash
cd railway-webhook
# Hacer cambios
git add .
git commit -m "Descripción del cambio"
git push origin main
# Railway hace auto-deploy
```

### Actualizar Cliente Local

```bash
cd whatsapp-local
# Hacer cambios
pm2 restart whatsapp-local
```

### Revisar Logs

**Railway:**
- Dashboard → Deployments → Logs

**Local:**
```bash
tail -f /Users/nicholasandrewguidoarroyo/Downloads/Proyecto\ Leads-automaticos/whatsapp-local/logs/*.log
```

---

## ⚠️ Troubleshooting

### Railway no recibe webhooks
1. Verifica URL en Facebook: `https://leads-whast-meta-production.up.railway.app/webhook/facebook-leads`
2. Verifica Verify Token: `mitoken123`
3. Revisa logs en Railway

### Cliente local no envía mensajes
1. Verifica que esté corriendo: `pm2 list`
2. Verifica WhatsApp conectado en logs
3. Verifica API_KEY sea correcta
4. Prueba conectividad: `curl -H "x-api-key: KEY" https://leads-whast-meta-production.up.railway.app/api/stats`

### WhatsApp desconectado
1. Para el cliente: `pm2 stop whatsapp-local`
2. Elimina sesión: `rm -rf whatsapp-local/.wwebjs_auth`
3. Reinicia: `pm2 start whatsapp-local`
4. Escanea QR nuevamente

### Leads no se guardan en Google Sheets
1. Verifica credenciales en Railway
2. Verifica que el Sheet esté compartido con: `leads-distributor@leads-automatizacion-478718.iam.gserviceaccount.com`
3. Revisa logs en Railway

---

## 📈 Monitoreo

### Métricas Importantes

- **Total de leads procesados:** Ver `/stats`
- **Distribución VRJ/DLAB:** Ver `/stats`
- **Mensajes pendientes:** Ver `/api/pending-messages`
- **Estado WhatsApp:** Logs del cliente local

### Frecuencia de Revisión

- **Diariamente:** Verificar que cliente local esté corriendo
- **Semanalmente:** Revisar logs por errores
- **Mensualmente:** Limpiar logs antiguos

---

## 🎯 Sistema Listo Para:

✅ Recibir leads de Facebook 24/7
✅ Procesarlos automáticamente
✅ Distribuirlos alternadamente entre VRJ y DLAB
✅ Enviarlos a WhatsApp
✅ Guardarlos en Google Sheets
✅ Escalar sin problemas

---

## 📞 Soporte

**Documentación:**
- `README.md` - Vista general
- `QUICK-START.md` - Setup rápido
- `README-DEPLOYMENT.md` - Deployment completo
- `STRUCTURE.md` - Estructura del proyecto
- `RAILWAY_DEPLOYMENT_INFO.md` - Info de Railway

**Archivos de referencia:**
- `RAILWAY_VARIABLES_COMPLETAS.txt` - Todas las variables
- `OLD_VERSION/` - Versión anterior para referencia

---

**¡Sistema 100% Funcional!** 🎉
