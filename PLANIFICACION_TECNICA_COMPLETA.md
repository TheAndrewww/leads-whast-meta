# 📋 PLANIFICACIÓN TÉCNICA - SISTEMA DE DISTRIBUCIÓN DE LEADS

## 🎯 OBJETIVO DEL PROYECTO

Crear un sistema backend que automatice la recepción, distribución y notificación de leads de Facebook, con las siguientes características:

- Recibir leads de Facebook Lead Ads vía webhook
- Distribuir leads alternativamente entre 2 asesores (VRJ y DLAB)
- Enviar notificaciones a 3 grupos de WhatsApp
- Guardar en Google Sheets con el asesor asignado
- Manejar verificación de webhook de Facebook

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Stack Tecnológico Recomendado

**Opción 1 - Node.js (Recomendado):**
- Runtime: Node.js 18+
- Framework: Express.js
- Librerías:
  - `axios` - Para llamadas HTTP
  - `dotenv` - Variables de entorno
  - `google-spreadsheet` - Google Sheets API
  - Body parser (incluido en Express)

**Opción 2 - Python:**
- Runtime: Python 3.10+
- Framework: Flask o FastAPI
- Librerías:
  - `requests` - HTTP
  - `python-dotenv` - Variables
  - `gspread` - Google Sheets
  - `oauth2client` - Autenticación Google

### Estructura de Archivos

```
proyecto/
├── src/
│   ├── index.js (o main.py)           # Punto de entrada
│   ├── routes/
│   │   └── webhook.js                 # Endpoint del webhook
│   ├── services/
│   │   ├── facebook.js                # Lógica de Facebook API
│   │   ├── whatsapp.js                # Envío de WhatsApp
│   │   ├── sheets.js                  # Google Sheets
│   │   └── distributor.js             # Lógica de distribución
│   ├── utils/
│   │   ├── logger.js                  # Logging
│   │   └── validator.js               # Validaciones
│   └── config/
│       └── constants.js               # Constantes
├── .env                               # Variables de entorno
├── .env.example                       # Ejemplo de .env
├── package.json (o requirements.txt)
├── README.md
└── .gitignore
```

---

## 📊 FLUJO DE DATOS DETALLADO

### 1. Recepción del Webhook

**Endpoint:** `POST /webhook/facebook-leads`

**Request de Verificación (GET):**
```
GET /webhook/facebook-leads?hub.mode=subscribe&hub.verify_token=TU_TOKEN&hub.challenge=123456
```

**Respuesta esperada:**
```
200 OK
Body: 123456 (el challenge)
```

**Request de Lead Real (POST):**
```json
{
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1234567890,
      "changes": [
        {
          "field": "leadgen",
          "value": {
            "leadgen_id": "LEAD_ID",
            "form_id": "FORM_ID",
            "page_id": "PAGE_ID",
            "created_time": 1234567890
          }
        }
      ]
    }
  ]
}
```

### 2. Obtener Datos del Lead

**Endpoint Facebook:** `GET https://graph.facebook.com/v18.0/{LEAD_ID}`

**Query params:**
- `access_token`: Tu access token de Facebook

**Respuesta de Facebook:**
```json
{
  "id": "LEAD_ID",
  "created_time": "2025-11-18T10:30:00+0000",
  "field_data": [
    {
      "name": "full_name",
      "values": ["Juan Pérez"]
    },
    {
      "name": "phone_number",
      "values": ["+525512345678"]
    },
    {
      "name": "ciudad",
      "values": ["Irapuato"]
    },
    {
      "name": "producto",
      "values": ["Membrana Tensilada"]
    }
  ]
}
```

### 3. Procesar y Distribuir

**Lógica de Distribución:**
```javascript
// Pseudocódigo
let ultimoAsesor = leerDeBaseDeDatos(); // o archivo, o memoria

if (ultimoAsesor === 'VRJ') {
  nuevoAsesor = 'DLAB';
} else {
  nuevoAsesor = 'VRJ';
}

guardarEnBaseDeDatos(nuevoAsesor);
```

**Datos a extraer:**
```javascript
{
  contacto: "Juan Pérez",
  telefono: "5512345678",
  ciudad: "Irapuato",
  producto: "Membrana Tensilada",
  fuente: "FACEBOOK",
  asesor: "VRJ" o "DLAB",
  status: "NUEVO",
  fecha_hora: "18/11/2025 15:30:00"
}
```

### 4. Enviar a WhatsApp (3 mensajes)

**Endpoint WhatsApp:** `POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`

**Headers:**
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

**Mensaje 1 - Grupo Principal:**
```json
{
  "messaging_product": "whatsapp",
  "to": "120363XXXXX@g.us",
  "type": "text",
  "text": {
    "body": "🆕 NUEVO LEAD\n\n👤 Contacto: Juan Pérez\n📱 Teléfono: 5512345678\n📍 Ciudad: Irapuato\n🎯 Producto: Membrana\n📊 Fuente: FACEBOOK\n👨‍💼 Asesor: VRJ\n⏰ Fecha: 18/11/2025 15:30"
  }
}
```

**Mensaje 2 - Grupo del Asesor:**
```json
{
  "messaging_product": "whatsapp",
  "to": "120363YYYYY@g.us",
  "type": "text",
  "text": {
    "body": "📞 LEAD ASIGNADO A VRJ\n\n👤 Juan Pérez\n📱 5512345678\n📍 Irapuato\n🎯 Membrana"
  }
}
```

**Mensaje 3 - Cliente:**
```json
{
  "messaging_product": "whatsapp",
  "to": "5512345678",
  "type": "template",
  "template": {
    "name": "hello_world",
    "language": {
      "code": "es_MX"
    }
  }
}
```

### 5. Guardar en Google Sheets

**API:** Google Sheets API v4

**Operación:** Append row

**Spreadsheet ID:** `1AA4KXK8wQK6QI-3feptFPopN_mlztMlfio069IMqzdU`

**Sheet Name:** `DATOS`

**Datos a insertar:**
```javascript
[
  "Juan Pérez",        // CONTACTO
  "Irapuato",         // CIUDAD
  "Membrana",         // PRODUCTO
  "FACEBOOK",         // COMO SUPO DE NOSOTROS
  "VRJ",              // ATIENDE
  "NUEVO",            // STATUS
  ""                  // TIPO DE PROYECTO
]
```

---

## 🔐 VARIABLES DE ENTORNO REQUERIDAS

```env
# Facebook
FACEBOOK_ACCESS_TOKEN=EAAeIDW40f8QBP6FbZBnJBfIXGyMzj0HHOdy5gVZAS22FcxDAE6SqJKYC17hfSVmrS5ebvjZB9akdcQ7VCfoIDfDpBzsS0wTRLorZAK67pht9uUbeOrlaQM8S1fwMFc3BpbfayJggbW2N6a8EV099412e1G0bHV3hyxZAtf8xJWnbd23AilWubAJzunbHQgSS6zVZARfZBEaMFoqX9vn6JPJ1Q96ZCiGCOkRtYyciL82ih5CLVAzPolZBH1XuVSZA1Bg4rrsuiFfGExHtWHEhGmuhee
FACEBOOK_VERIFY_TOKEN=mitoken123

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=804238736116457
WHATSAPP_ACCESS_TOKEN=EAAeIDW40f8Q... (mismo que Facebook)
WHATSAPP_GRUPO_PRINCIPAL=120363XXXXX@g.us
WHATSAPP_GRUPO_VRJ=120363YYYYY@g.us
WHATSAPP_GRUPO_DLAB=120363ZZZZZ@g.us

# Google Sheets
GOOGLE_SPREADSHEET_ID=1AA4KXK8wQK6QI-3feptFPopN_mlztMlfio069IMqzdU
GOOGLE_SHEET_NAME=DATOS
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Servidor
PORT=3000
NODE_ENV=production
```

---

## 📝 ENDPOINTS A IMPLEMENTAR

### 1. Webhook de Facebook

```
GET /webhook/facebook-leads
- Verificación del webhook
- Responde con hub.challenge

POST /webhook/facebook-leads
- Recibe el lead
- Procesa y distribuye
- Responde 200 OK rápidamente
```

### 2. Health Check (Opcional pero recomendado)

```
GET /health
- Verifica que el servidor esté funcionando
- Responde: { "status": "ok", "timestamp": "..." }
```

### 3. Status/Stats (Opcional)

```
GET /api/stats
- Retorna estadísticas de leads procesados
- Distribución por asesor
- Últimos leads
```

---

## 🔄 LÓGICA DE DISTRIBUCIÓN DETALLADA

### Persistencia del Estado

**Opción 1 - Archivo JSON (Más simple):**
```json
// distributor-state.json
{
  "ultimoAsesor": "VRJ",
  "contador": {
    "VRJ": 45,
    "DLAB": 44
  },
  "ultimaActualizacion": "2025-11-18T15:30:00Z"
}
```

**Opción 2 - Base de Datos SQLite (Recomendado):**
```sql
CREATE TABLE distributor_state (
  id INTEGER PRIMARY KEY,
  ultimo_asesor TEXT,
  fecha_actualizacion TIMESTAMP
);

CREATE TABLE leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT UNIQUE,
  contacto TEXT,
  telefono TEXT,
  ciudad TEXT,
  producto TEXT,
  fuente TEXT,
  asesor TEXT,
  status TEXT,
  fecha_creacion TIMESTAMP
);
```

**Opción 3 - Redis (Para producción escalable):**
```
GET ultimo_asesor
SET ultimo_asesor "DLAB"
INCR contador:VRJ
INCR contador:DLAB
```

### Algoritmo de Distribución

```javascript
async function asignarAsesor() {
  // 1. Leer último asesor
  const ultimoAsesor = await leerUltimoAsesor();
  
  // 2. Alternar
  const nuevoAsesor = ultimoAsesor === 'VRJ' ? 'DLAB' : 'VRJ';
  
  // 3. Guardar
  await guardarUltimoAsesor(nuevoAsesor);
  
  // 4. Obtener ID del grupo
  const grupoAsesor = nuevoAsesor === 'VRJ' 
    ? process.env.WHATSAPP_GRUPO_VRJ 
    : process.env.WHATSAPP_GRUPO_DLAB;
  
  return {
    asesor: nuevoAsesor,
    grupoAsesor: grupoAsesor
  };
}
```

---

## 🛡️ MANEJO DE ERRORES

### Casos a Manejar

1. **Facebook no responde:**
   - Retry 3 veces con backoff exponencial
   - Log del error
   - Responder 200 OK a Facebook (para no reintentar)
   - Guardar lead en cola de "fallidos"

2. **WhatsApp falla:**
   - No bloquear el flujo principal
   - Log del error
   - Continuar con Google Sheets
   - (Opcional) Cola de reintentos

3. **Google Sheets falla:**
   - Retry 2 veces
   - Log del error
   - Guardar localmente en JSON de backup

4. **Campos faltantes en lead:**
   - Valores por defecto:
     - nombre: "Sin nombre"
     - ciudad: "No especificada"
     - producto: "CONSULTA"
     - teléfono: requerido (validar)

### Estructura de Logs

```javascript
{
  timestamp: "2025-11-18T15:30:00Z",
  level: "error",
  service: "whatsapp",
  leadId: "123456789",
  error: "Failed to send message",
  details: {
    to: "120363XXXXX@g.us",
    statusCode: 500,
    response: "..."
  }
}
```

---

## 📊 VALIDACIONES REQUERIDAS

### Validación del Webhook de Facebook

```javascript
function validarWebhookFacebook(req) {
  // Verificar firma HMAC (recomendado)
  const signature = req.headers['x-hub-signature-256'];
  const expectedSignature = crypto
    .createHmac('sha256', APP_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

### Validación de Datos del Lead

```javascript
function validarLead(leadData) {
  const errores = [];
  
  // Teléfono requerido
  if (!leadData.telefono || leadData.telefono.length < 10) {
    errores.push("Teléfono inválido");
  }
  
  // Nombre requerido
  if (!leadData.contacto || leadData.contacto.trim() === '') {
    errores.push("Nombre requerido");
  }
  
  return {
    valido: errores.length === 0,
    errores: errores
  };
}
```

### Validación de Números de WhatsApp

```javascript
function formatearNumeroWhatsApp(numero) {
  // Remover todo excepto números
  let limpio = numero.replace(/[^0-9]/g, '');
  
  // Para México: agregar código de país si falta
  if (limpio.length === 10) {
    limpio = '52' + limpio;
  }
  
  // Validar longitud mínima
  if (limpio.length < 10) {
    throw new Error('Número inválido');
  }
  
  return limpio;
}
```

---

## 🚀 DEPLOYMENT

### Opciones de Hosting

**Opción 1 - Heroku (Más fácil):**
```bash
# Pasos:
1. Crear app en Heroku
2. Configurar variables de entorno
3. git push heroku main
4. URL: https://tu-app.herokuapp.com/webhook/facebook-leads
```

**Opción 2 - Railway (Moderno):**
```bash
# Similar a Heroku pero más rápido
1. Conectar repo de GitHub
2. Configurar variables
3. Deploy automático
```

**Opción 3 - DigitalOcean App Platform:**
```bash
# Más control, buen precio
1. Crear App
2. Conectar repo
3. Configurar variables
4. Deploy
```

**Opción 4 - VPS (Máximo control):**
```bash
# DigitalOcean Droplet, AWS EC2, etc.
1. Instalar Node.js/Python
2. Configurar Nginx como proxy inverso
3. PM2 para mantener app corriendo
4. Configurar SSL con Let's Encrypt
```

### Configuración de SSL

**Requerido:** Facebook requiere HTTPS

**Opciones:**
1. Let's Encrypt (gratis)
2. Cloudflare (gratis + CDN)
3. Certificado incluido en plataforma (Heroku, Railway)

---

## 🧪 TESTING

### Tests a Implementar

1. **Test del webhook de verificación:**
```javascript
test('Debe responder con challenge', async () => {
  const response = await request(app)
    .get('/webhook/facebook-leads')
    .query({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'mitoken123',
      'hub.challenge': '12345'
    });
  
  expect(response.status).toBe(200);
  expect(response.text).toBe('12345');
});
```

2. **Test de procesamiento de lead:**
```javascript
test('Debe procesar lead correctamente', async () => {
  const mockLead = {
    entry: [{
      changes: [{
        value: {
          leadgen_id: 'test123',
          form_id: 'form123',
          page_id: 'page123'
        }
      }]
    }]
  };
  
  const response = await request(app)
    .post('/webhook/facebook-leads')
    .send(mockLead);
  
  expect(response.status).toBe(200);
});
```

3. **Test de distribución alternada:**
```javascript
test('Debe alternar entre asesores', async () => {
  const asesor1 = await asignarAsesor();
  const asesor2 = await asignarAsesor();
  const asesor3 = await asignarAsesor();
  
  expect(asesor1.asesor).not.toBe(asesor2.asesor);
  expect(asesor1.asesor).toBe(asesor3.asesor);
});
```

---

## 📚 DOCUMENTACIÓN A INCLUIR

### README.md debe contener:

1. Descripción del proyecto
2. Requisitos previos
3. Instalación paso a paso
4. Configuración de variables de entorno
5. Cómo ejecutar en desarrollo
6. Cómo deployar
7. Troubleshooting común
8. Estructura del proyecto

### API Documentation:

Documentar todos los endpoints con:
- URL
- Método HTTP
- Headers requeridos
- Body esperado
- Respuestas posibles
- Ejemplos

---

## ⚡ OPTIMIZACIONES RECOMENDADAS

### Performance

1. **Procesamiento asíncrono:**
   - No esperar respuesta de WhatsApp para responder a Facebook
   - Usar Promise.all() para envíos paralelos

2. **Caching:**
   - Cachear datos de distribución en memoria
   - Evitar lecturas de archivo/DB en cada request

3. **Rate Limiting:**
   - Limitar requests al webhook (prevenir spam)
   - Usar express-rate-limit

### Seguridad

1. **Validar firma de Facebook** (HMAC)
2. **HTTPS obligatorio**
3. **Variables de entorno** (nunca en código)
4. **Sanitizar inputs**
5. **Rate limiting**
6. **Helmet.js** para headers de seguridad

---

## 🔄 MEJORAS FUTURAS (Fase 2)

1. **Panel de administración:**
   - Ver leads en tiempo real
   - Estadísticas por asesor
   - Cambiar distribución manual

2. **Reintentos inteligentes:**
   - Cola de mensajes fallidos
   - Reintento automático

3. **Notificaciones adicionales:**
   - Email al lead
   - SMS de confirmación
   - Slack/Discord para equipo

4. **Validación de duplicados:**
   - Verificar si teléfono ya existe
   - Evitar leads repetidos

5. **Multi-tenant:**
   - Soportar múltiples empresas
   - Múltiples formularios

---

## 📋 CHECKLIST DE DESARROLLO

### Setup Inicial
- [ ] Crear estructura de carpetas
- [ ] Inicializar proyecto (npm/pip)
- [ ] Instalar dependencias
- [ ] Configurar .gitignore
- [ ] Crear .env.example

### Core Features
- [ ] Implementar endpoint de verificación webhook
- [ ] Implementar recepción de leads
- [ ] Implementar llamada a Facebook API
- [ ] Implementar extracción de datos
- [ ] Implementar lógica de distribución
- [ ] Implementar persistencia del estado
- [ ] Implementar envío a WhatsApp (3 mensajes)
- [ ] Implementar guardado en Google Sheets

### Error Handling
- [ ] Manejo de errores de Facebook API
- [ ] Manejo de errores de WhatsApp
- [ ] Manejo de errores de Google Sheets
- [ ] Logging de errores
- [ ] Validaciones de datos

### Testing
- [ ] Tests unitarios de distribución
- [ ] Tests de integración de webhook
- [ ] Tests de servicios externos (mocked)

### Documentation
- [ ] README completo
- [ ] Comentarios en código
- [ ] API documentation
- [ ] Guía de deployment

### Deployment
- [ ] Configurar hosting
- [ ] Configurar SSL
- [ ] Configurar variables de entorno
- [ ] Deploy inicial
- [ ] Probar en producción
- [ ] Configurar webhook en Facebook

---

## 🎯 PRIORIDADES

### Must Have (MVP):
1. ✅ Recibir webhook de Facebook
2. ✅ Distribuir leads alternativamente
3. ✅ Enviar a grupos de WhatsApp
4. ✅ Guardar en Google Sheets

### Nice to Have:
1. 📊 Panel de estadísticas
2. 🔄 Reintentos automáticos
3. 📧 Notificaciones por email
4. 🔍 Validación de duplicados

### Can Wait:
1. 🎨 UI/Frontend
2. 📱 App móvil
3. 🤖 Chatbot de respuestas
4. 📈 Analytics avanzado

---

## 💰 ESTIMACIÓN DE COSTOS

### Hosting
- Heroku/Railway Hobby: $5-7/mes
- DigitalOcean Droplet: $6/mes
- AWS Lambda: ~$0/mes (bajo volumen)

### APIs
- Facebook/WhatsApp: $0 (hasta 1,000 conversaciones/mes)
- Google Sheets: $0

### Total Estimado: $5-10/mes

---

## ⏱️ ESTIMACIÓN DE TIEMPO

- Setup inicial: 30 min
- Core features: 3-4 horas
- Error handling: 1 hora
- Testing: 1 hora
- Documentation: 30 min
- Deployment: 1 hora

**Total: 6-8 horas de desarrollo**

---

¡Listo para darle a Claude Code! 🚀
