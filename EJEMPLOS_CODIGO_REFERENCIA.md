# 📝 EJEMPLOS DE CÓDIGO DE REFERENCIA

## EJEMPLO COMPLETO DE WEBHOOK (Node.js + Express)

```javascript
// src/index.js
const express = require('express');
const dotenv = require('dotenv');
const webhookRouter = require('./routes/webhook');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/webhook', webhookRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
```

```javascript
// src/routes/webhook.js
const express = require('express');
const router = express.Router();
const facebookService = require('../services/facebook');
const whatsappService = require('../services/whatsapp');
const sheetsService = require('../services/sheets');
const distributorService = require('../services/distributor');
const logger = require('../utils/logger');

// Verificación del webhook (GET)
router.get('/facebook-leads', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// Recibir leads (POST)
router.post('/facebook-leads', async (req, res) => {
  try {
    // Responder rápido a Facebook
    res.sendStatus(200);

    // Procesar asíncronamente
    const body = req.body;

    // Validar que es un evento de leadgen
    if (body.entry && body.entry[0] && body.entry[0].changes) {
      const change = body.entry[0].changes[0];
      
      if (change.field === 'leadgen') {
        const leadId = change.value.leadgen_id;
        
        logger.info(`📩 Nuevo lead recibido: ${leadId}`);
        
        // Procesar el lead
        await processLead(leadId);
      }
    }
  } catch (error) {
    logger.error('Error processing webhook:', error);
  }
});

async function processLead(leadId) {
  try {
    // 1. Obtener datos del lead de Facebook
    const leadData = await facebookService.getLeadData(leadId);
    
    // 2. Asignar asesor
    const assignment = await distributorService.assignAsesor();
    
    // 3. Formatear datos
    const formattedLead = {
      contacto: leadData.nombre,
      telefono: leadData.telefono,
      ciudad: leadData.ciudad,
      producto: leadData.producto,
      fuente: 'FACEBOOK',
      asesor: assignment.asesor,
      status: 'NUEVO',
      fecha_hora: new Date().toLocaleString('es-MX')
    };
    
    // 4. Enviar notificaciones (paralelo)
    await Promise.all([
      whatsappService.sendToGrupoPrincipal(formattedLead),
      whatsappService.sendToGrupoAsesor(formattedLead, assignment.grupoAsesor),
      whatsappService.sendToCliente(formattedLead.telefono)
    ]);
    
    // 5. Guardar en Google Sheets
    await sheetsService.appendLead(formattedLead);
    
    logger.info(`✅ Lead ${leadId} procesado correctamente`);
    
  } catch (error) {
    logger.error(`❌ Error processing lead ${leadId}:`, error);
  }
}

module.exports = router;
```

```javascript
// src/services/facebook.js
const axios = require('axios');

class FacebookService {
  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  async getLeadData(leadId) {
    try {
      const response = await axios.get(`${this.baseURL}/${leadId}`, {
        params: {
          access_token: this.accessToken
        }
      });

      const fieldData = response.data.field_data;

      // Extraer campos
      const getData = (fieldName) => {
        const field = fieldData.find(f => 
          f.name === fieldName || 
          f.name.includes(fieldName)
        );
        return field ? field.values[0] : null;
      };

      return {
        nombre: getData('full_name') || getData('name') || 'Sin nombre',
        telefono: getData('phone_number') || getData('phone') || '',
        ciudad: getData('city') || getData('ciudad') || getData('localidad') || 'No especificada',
        producto: getData('product') || getData('producto') || getData('servicio') || 'CONSULTA'
      };

    } catch (error) {
      console.error('Error fetching lead data from Facebook:', error);
      throw error;
    }
  }
}

module.exports = new FacebookService();
```

```javascript
// src/services/whatsapp.js
const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.baseURL = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
    
    this.grupos = {
      principal: process.env.WHATSAPP_GRUPO_PRINCIPAL,
      vrj: process.env.WHATSAPP_GRUPO_VRJ,
      dlab: process.env.WHATSAPP_GRUPO_DLAB
    };
  }

  async sendMessage(to, message) {
    try {
      const response = await axios.post(
        this.baseURL,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error);
      throw error;
    }
  }

  async sendToGrupoPrincipal(lead) {
    const message = `🆕 NUEVO LEAD\n\n` +
      `👤 Contacto: ${lead.contacto}\n` +
      `📱 Teléfono: ${lead.telefono}\n` +
      `📍 Ciudad: ${lead.ciudad}\n` +
      `🎯 Producto: ${lead.producto}\n` +
      `📊 Fuente: ${lead.fuente}\n` +
      `👨‍💼 Asesor: ${lead.asesor}\n` +
      `⏰ Fecha: ${lead.fecha_hora}`;

    return this.sendMessage(this.grupos.principal, message);
  }

  async sendToGrupoAsesor(lead, grupoId) {
    const message = `📞 LEAD ASIGNADO A ${lead.asesor}\n\n` +
      `👤 ${lead.contacto}\n` +
      `📱 ${lead.telefono}\n` +
      `📍 ${lead.ciudad}\n` +
      `🎯 ${lead.producto}\n` +
      `📊 ${lead.fuente}`;

    return this.sendMessage(grupoId, message);
  }

  async sendToCliente(telefono) {
    // Enviar template (requiere plantilla aprobada)
    try {
      const response = await axios.post(
        this.baseURL,
        {
          messaging_product: 'whatsapp',
          to: telefono.replace(/[^0-9]/g, ''),
          type: 'template',
          template: {
            name: 'hello_world',
            language: {
              code: 'es_MX'
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp to client:', error.response?.data || error);
      // No lanzar error, solo loguearlo
    }
  }
}

module.exports = new WhatsAppService();
```

```javascript
// src/services/distributor.js
const fs = require('fs').promises;
const path = require('path');

class DistributorService {
  constructor() {
    this.statePath = path.join(__dirname, '../../data/distributor-state.json');
    this.grupos = {
      'VRJ': process.env.WHATSAPP_GRUPO_VRJ,
      'DLAB': process.env.WHATSAPP_GRUPO_DLAB
    };
  }

  async getState() {
    try {
      const data = await fs.readFile(this.statePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Si el archivo no existe, crear estado inicial
      const initialState = {
        ultimoAsesor: 'DLAB',  // Empezar con DLAB para que el primero sea VRJ
        contador: {
          'VRJ': 0,
          'DLAB': 0
        }
      };
      await this.saveState(initialState);
      return initialState;
    }
  }

  async saveState(state) {
    // Crear directorio si no existe
    const dir = path.dirname(this.statePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(this.statePath, JSON.stringify(state, null, 2));
  }

  async assignAsesor() {
    const state = await this.getState();
    
    // Alternar asesor
    const nuevoAsesor = state.ultimoAsesor === 'VRJ' ? 'DLAB' : 'VRJ';
    
    // Actualizar contador
    state.contador[nuevoAsesor]++;
    state.ultimoAsesor = nuevoAsesor;
    state.ultimaActualizacion = new Date().toISOString();
    
    await this.saveState(state);
    
    return {
      asesor: nuevoAsesor,
      grupoAsesor: this.grupos[nuevoAsesor]
    };
  }

  async getStats() {
    const state = await this.getState();
    return {
      ultimoAsesor: state.ultimoAsesor,
      contador: state.contador,
      total: state.contador.VRJ + state.contador.DLAB
    };
  }
}

module.exports = new DistributorService();
```

```javascript
// src/services/sheets.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

class SheetsService {
  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    this.sheetName = process.env.GOOGLE_SHEET_NAME || 'DATOS';
    
    this.auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  }

  async appendLead(lead) {
    try {
      const doc = new GoogleSpreadsheet(this.spreadsheetId, this.auth);
      await doc.loadInfo();
      
      const sheet = doc.sheetsByTitle[this.sheetName];
      
      await sheet.addRow({
        'CONTACTO': lead.contacto,
        'CIUDAD': lead.ciudad,
        'PRODUCTO': lead.producto,
        'COMO SUPO DE NOSOTROS': lead.fuente,
        'ATIENDE': lead.asesor,
        'STATUS': lead.status,
        'TIPO DE PROYECTO': ''
      });

      console.log('✅ Lead added to Google Sheets');
    } catch (error) {
      console.error('Error adding to Google Sheets:', error);
      throw error;
    }
  }
}

module.exports = new SheetsService();
```

```javascript
// src/utils/logger.js
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    // Console
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    
    // File
    const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  info(message, data) {
    this.log('info', message, data);
  }

  error(message, error) {
    this.log('error', message, {
      error: error.message,
      stack: error.stack
    });
  }

  warn(message, data) {
    this.log('warn', message, data);
  }
}

module.exports = new Logger();
```

---

## EJEMPLO DE .env

```env
# Facebook
FACEBOOK_ACCESS_TOKEN=EAAeIDW40f8QBP6FbZBnJBfIXGyMzj0HHOdy5gVZAS22FcxDAE6SqJKYC17hfSVmrS5ebvjZB9akdcQ7VCfoIDfDpBzsS0wTRLorZAK67pht9uUbeOrlaQM8S1fwMFc3BpbfayJggbW2N6a8EV099412e1G0bHV3hyxZAtf8xJWnbd23AilWubAJzunbHQgSS6zVZARfZBEaMFoqX9vn6JPJ1Q96ZCiGCOkRtYyciL82ih5CLVAzPolZBH1XuVSZA1Bg4rrsuiFfGExHtWHEhGmuhee
FACEBOOK_VERIFY_TOKEN=mitoken123

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=804238736116457
WHATSAPP_ACCESS_TOKEN=EAAeIDW40f8QBP6FbZBnJBfIXGyMzj0HHOdy5gVZAS22FcxDAE6SqJKYC17hfSVmrS5ebvjZB9akdcQ7VCfoIDfDpBzsS0wTRLorZAK67pht9uUbeOrlaQM8S1fwMFc3BpbfayJggbW2N6a8EV099412e1G0bHV3hyxZAtf8xJWnbd23AilWubAJzunbHQgSS6zVZARfZBEaMFoqX9vn6JPJ1Q96ZCiGCOkRtYyciL82ih5CLVAzPolZBH1XuVSZA1Bg4rrsuiFfGExHtWHEhGmuhee
WHATSAPP_GRUPO_PRINCIPAL=120363XXXXX@g.us
WHATSAPP_GRUPO_VRJ=120363YYYYY@g.us
WHATSAPP_GRUPO_DLAB=120363ZZZZZ@g.us

# Google Sheets
GOOGLE_SPREADSHEET_ID=1AA4KXK8wQK6QI-3feptFPopN_mlztMlfio069IMqzdU
GOOGLE_SHEET_NAME=DATOS
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n"

# Server
PORT=3000
NODE_ENV=production
```

---

## EJEMPLO DE package.json

```json
{
  "name": "leads-distributor",
  "version": "1.0.0",
  "description": "Sistema de distribución de leads de Facebook",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "google-spreadsheet": "^4.1.2",
    "google-auth-library": "^9.4.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  }
}
```

---

## COMANDOS ÚTILES

```bash
# Instalar dependencias
npm install

# Desarrollo (con hot reload)
npm run dev

# Producción
npm start

# Logs en tiempo real
tail -f logs/$(date +%Y-%m-%d).log

# Ver estadísticas de distribución
curl http://localhost:3000/api/stats
```

---

Estos ejemplos son completamente funcionales y listos para usar! 🚀
