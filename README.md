# Sistema de Distribución de Leads - Facebook Lead Ads

Sistema backend automatizado para recibir, distribuir y notificar leads de Facebook Lead Ads usando WhatsApp Web.

## Características

- Recepción de leads de Facebook vía webhook
- Distribución alternada entre 2 asesores (VRJ y DLAB)
- Notificaciones automáticas a 2 grupos de WhatsApp (Principal + Asesor)
- **NO envía mensaje al cliente** (los asesores lo harán manualmente)
- Guardado automático en Google Sheets
- Logging completo de operaciones
- Manejo robusto de errores
- WhatsApp Web con autenticación QR
- Sesión persistente con LocalAuth

## Requisitos Previos

- Node.js 18 o superior
- Cuenta de Facebook Developer con acceso a Facebook Graph API
- Cuenta de WhatsApp personal (para WhatsApp Web)
- Cuenta de servicio de Google Cloud con acceso a Google Sheets API
- URL pública con HTTPS (para el webhook de Facebook)

## Instalación

### 1. Clonar e instalar

```bash
cd Proyecto\ Leads-automaticos
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar el archivo `.env`:

```env
# Facebook
FACEBOOK_ACCESS_TOKEN=tu_token_de_facebook
FACEBOOK_VERIFY_TOKEN=mitoken123

# WhatsApp Web (Los IDs se mostrarán después del primer escaneo)
WHATSAPP_GRUPO_PRINCIPAL=
WHATSAPP_GRUPO_VRJ=
WHATSAPP_GRUPO_DLAB=

# Google Sheets
GOOGLE_SPREADSHEET_ID=tu_spreadsheet_id
GOOGLE_SHEET_NAME=DATOS
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_clave_privada\n-----END PRIVATE KEY-----\n"

# Server
PORT=3000
NODE_ENV=production
```

## Configuración Inicial de WhatsApp

### Primera ejecución - Autenticación

1. Ejecutar el servidor:
```bash
npm run dev
```

2. Aparecerá un código QR en la terminal

3. Escanear el QR con WhatsApp:
   - Abrir WhatsApp en tu teléfono
   - Ir a Configuración → Dispositivos vinculados
   - Escanear el código QR

4. El sistema detectará automáticamente todos tus grupos y mostrará sus IDs:

```
================================================================================
📋 COPIA ESTOS IDs EN TU ARCHIVO .env:
================================================================================
# Grupo Principal
WHATSAPP_GRUPO_PRINCIPAL=120363xxxxxxxxxx@g.us

# Grupo VRJ
WHATSAPP_GRUPO_VRJ=120363yyyyyyyyyy@g.us

# Grupo DLAB
WHATSAPP_GRUPO_DLAB=120363zzzzzzzzzz@g.us
================================================================================
```

5. Copiar los IDs correctos al archivo `.env`

6. Reiniciar el servidor

### Sesión Persistente

La autenticación se guarda en la carpeta `.wwebjs_auth/`, por lo que **solo necesitas escanear el QR una vez**. En siguientes ejecuciones, la sesión se restaurará automáticamente.

## Configuración de Google Sheets

1. Crear un proyecto en Google Cloud Console
2. Habilitar Google Sheets API
3. Crear una cuenta de servicio
4. Descargar las credenciales JSON
5. Compartir tu Google Sheet con el email de la cuenta de servicio (permisos de Editor)
6. El Sheet debe tener las siguientes columnas:
   - CONTACTO
   - CIUDAD
   - PRODUCTO
   - COMO SUPO DE NOSOTROS
   - ATIENDE
   - STATUS
   - TIPO DE PROYECTO

## Configuración del Webhook de Facebook

1. Ir a Facebook Developer Console
2. Configurar el webhook con:
   - URL: `https://tu-dominio.com/webhook/facebook-leads`
   - Verify Token: El mismo que configuraste en `FACEBOOK_VERIFY_TOKEN`
   - Campos a suscribir: `leadgen`

## Uso

### Desarrollo (con auto-reload):
```bash
npm run dev
```

### Producción con PM2:
```bash
# Instalar PM2 globalmente (si no lo tienes)
npm install -g pm2

# Iniciar
npm run pm2:start

# Ver logs
npm run pm2:logs

# Reiniciar
npm run pm2:restart

# Detener
npm run pm2:stop
```

### Producción directa:
```bash
npm start
```

## Endpoints

### GET /health
Health check del servidor y estado de WhatsApp.

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "whatsapp": {
    "ready": true,
    "groups": 3
  }
}
```

### GET /stats
Estadísticas de distribución de leads.

**Respuesta:**
```json
{
  "distributor": {
    "ultimoAsesor": "VRJ",
    "contador": {
      "VRJ": 45,
      "DLAB": 44
    },
    "total": 89
  },
  "whatsapp": {
    "isReady": true,
    "groupsCount": 3,
    "groups": [...]
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

### GET /webhook/facebook-leads
Verificación del webhook de Facebook.

### POST /webhook/facebook-leads
Recepción de leads de Facebook.

## Estructura del Proyecto

```
proyecto/
├── src/
│   ├── index.js                    # Punto de entrada
│   ├── whatsapp-client.js          # Cliente WhatsApp Web
│   ├── routes/
│   │   └── webhook.js              # Rutas del webhook
│   ├── services/
│   │   ├── facebook.js             # Servicio de Facebook API
│   │   ├── whatsapp-sender.js      # Servicio de WhatsApp
│   │   ├── sheets.js               # Servicio de Google Sheets
│   │   └── distributor.js          # Lógica de distribución
│   └── utils/
│       └── logger.js               # Sistema de logging
├── data/
│   └── distributor-state.json      # Estado de distribución
├── logs/                           # Archivos de log
├── .wwebjs_auth/                   # Sesión de WhatsApp (auto-generado)
├── .env                            # Variables de entorno
├── .env.example                    # Ejemplo de variables
├── ecosystem.config.js             # Configuración PM2
├── package.json                    # Dependencias
└── README.md                       # Este archivo
```

## Flujo de Datos

1. **Facebook envía webhook** → Lead recibido
2. **Sistema obtiene datos** → Llamada a Facebook Graph API
3. **Asignación de asesor** → Distribución alternada (VRJ ↔ DLAB)
4. **Notificaciones** → 2 mensajes de WhatsApp:
   - Grupo principal (información completa)
   - Grupo del asesor asignado
   - **NO se envía mensaje al cliente** ✓
5. **Guardado** → Nueva fila en Google Sheets

## Formato de Mensajes WhatsApp

### Mensaje al Grupo Principal:
```
🆕 NUEVO LEAD

👤 Contacto: Juan Pérez
📱 Teléfono: 5512345678
📍 Ciudad: Irapuato
🎯 Producto: Membrana Tensilada
📊 Fuente: FACEBOOK
👨‍💼 Asesor Asignado: VRJ
⏰ Fecha: 18/11/2025 15:30:00

El asesor VRJ contactará al cliente.
```

### Mensaje al Grupo del Asesor:
```
📞 LEAD ASIGNADO A TI

👤 Nombre: Juan Pérez
📱 Teléfono: 5512345678
📍 Ciudad: Irapuato
🎯 Producto: Membrana Tensilada
📊 Fuente: FACEBOOK

⚡ ACCIÓN REQUERIDA: Contacta al cliente lo antes posible.
```

## Logs

Los logs se guardan en:
- Consola (tiempo real)
- Archivo: `logs/YYYY-MM-DD.log`

Formato de log:
```json
{
  "timestamp": "2025-11-18T10:30:00.000Z",
  "level": "info",
  "message": "Nuevo lead recibido: 123456",
  "leadId": "123456"
}
```

## Manejo de Errores

El sistema está diseñado para ser resiliente:

- **Facebook API falla**: Se loguea el error y se intenta continuar
- **WhatsApp desconectado**: Se loguea advertencia, pero se guarda en Sheets
- **WhatsApp falla al enviar**: No bloquea el flujo, se loguea el error
- **Google Sheets falla**: Se loguea el error
- **Datos faltantes**: Se usan valores por defecto

## Troubleshooting

### El QR no aparece
- Verifica que tienes buena conexión a internet
- Revisa los logs en `logs/`
- Asegúrate de tener instaladas todas las dependencias

### WhatsApp se desconecta constantemente
- Verifica que tu teléfono tenga conexión estable
- Asegúrate de no tener muchas sesiones abiertas
- Revisa que `.wwebjs_auth/` tenga permisos correctos

### No se reciben leads
- Verifica que el webhook esté suscrito al campo `leadgen`
- Revisa los logs en `logs/` para ver errores
- Verifica que el `FACEBOOK_ACCESS_TOKEN` sea válido

### Error al guardar en Google Sheets
- Verifica que el Sheet esté compartido con la cuenta de servicio
- Asegúrate de que las columnas del Sheet coincidan exactamente
- Verifica que `GOOGLE_PRIVATE_KEY` esté correctamente formateado

### Los mensajes de WhatsApp no se envían
- Verifica que WhatsApp esté conectado (endpoint `/health`)
- Asegúrate de que los IDs de grupos estén configurados correctamente
- Revisa los logs para ver errores específicos

## Comandos Útiles

```bash
# Ver logs en tiempo real
tail -f logs/$(date +%Y-%m-%d).log

# Ver estado del sistema
curl http://localhost:3000/health

# Ver estadísticas
curl http://localhost:3000/stats

# Verificar el estado del distributor
cat data/distributor-state.json

# Ver logs de PM2
npm run pm2:logs

# Reiniciar servicio PM2
npm run pm2:restart
```

## Deployment en Producción

### Consideraciones importantes:

1. **Puppeteer en servidor**: Los args ya están configurados para headless
2. **Persistencia de sesión**: La carpeta `.wwebjs_auth/` debe persistir entre deploys
3. **Memoria**: Asegurar al menos 1GB de RAM
4. **Puerto**: Por defecto 3000, configurable via `PORT` en .env

### Opciones de Hosting:

- **VPS (DigitalOcean, AWS EC2)**: Recomendado para producción
- **Railway**: Compatible con whatsapp-web.js
- **Render**: Compatible
- ⚠️ **Heroku**: Puede tener problemas con Puppeteer

### Configuración VPS:

```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
npm install -g pm2

# Clonar proyecto
git clone <repo>
cd proyecto

# Instalar dependencias
npm install

# Configurar .env
nano .env

# Iniciar con PM2
npm run pm2:start

# Configurar PM2 para auto-start
pm2 startup
pm2 save
```

## Próximas Mejoras

- [ ] Panel de administración web
- [ ] API para estadísticas avanzadas
- [ ] Sistema de reintentos automáticos
- [ ] Validación de duplicados
- [ ] Notificaciones por email
- [ ] Tests automatizados
- [ ] Dashboard de métricas en tiempo real
- [ ] Integración con CRM

## Soporte

Para reportar problemas o sugerencias, crear un issue en el repositorio.

## Licencia

ISC
