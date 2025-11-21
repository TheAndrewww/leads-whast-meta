# Railway Webhook Service

Servicio para recibir webhooks de Facebook Lead Ads y distribuir leads alternadamente entre asesores VRJ y DLAB.

## Características

- ✅ Recibe webhooks de Facebook Lead Ads
- ✅ Distribuye leads alternadamente (VRJ ↔ DLAB)
- ✅ Guarda en Google Sheets
- ✅ Cola persistente en SQLite
- ✅ API para consulta de mensajes pendientes
- ✅ Logging detallado de errores
- ✅ Manejo robusto de errores (no bloqueante)

## Endpoints

### Públicos
- `GET /health` - Health check
- `GET /stats` - Estadísticas generales
- `GET /webhook` - Verificación de Facebook
- `POST /webhook` - Recepción de leads

### Protegidos (requieren `x-api-key`)
- `GET /api/pending` - Obtener mensajes pendientes
- `POST /api/mark-sent/:id` - Marcar mensaje como enviado
- `GET /api/stats` - Estadísticas detalladas

## Deployment

Este servicio está desplegado en Railway.

**URL:** https://leads-whast-meta-production.up.railway.app

## Variables de Entorno Requeridas

Ver `RAILWAY_ENV_VARIABLES.txt` en el directorio padre para la lista completa.

## Logs Mejorados

El sistema ahora incluye logging detallado:
- Errores de Google Sheets muestran: mensaje, spreadsheet ID, nombre de hoja, hojas disponibles
- Errores de SQLite muestran: lead ID, asesor, grupo, código de error
- Errores de Facebook API muestran: lead ID, status HTTP, respuesta completa
- Los errores de Sheets y DB no bloquean el procesamiento del lead

## Actualizado

Última actualización: 2025-11-21
- Mejoras en logging y manejo de errores
- Sistema no bloqueante para Google Sheets y SQLite
- Detección mejorada de leads de prueba (TEST_* y test_*)
