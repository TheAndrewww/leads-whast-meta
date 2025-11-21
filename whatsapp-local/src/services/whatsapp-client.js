// src/services/whatsapp-client.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');

class WhatsAppClient {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.groups = [];
  }

  async initialize() {
    try {
      logger.info('Inicializando cliente de WhatsApp Web...');

      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: '.wwebjs_auth'
        }),
        puppeteer: {
          headless: true,
          executablePath: '/Applications/Opera.app/Contents/MacOS/Opera',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled'
          ],
          ignoreDefaultArgs: ['--enable-automation']
        }
      });

      // Event: QR Code
      this.client.on('qr', (qr) => {
        logger.info('Escanea el código QR con tu WhatsApp:');
        qrcode.generate(qr, { small: true });
      });

      // Event: Authenticated
      this.client.on('authenticated', () => {
        logger.info('✅ WhatsApp autenticado correctamente');
      });

      // Event: Auth failure
      this.client.on('auth_failure', (msg) => {
        logger.error('❌ Error de autenticación:', msg);
      });

      // Event: Ready
      this.client.on('ready', async () => {
        logger.info('✅ WhatsApp Web está listo');
        this.isReady = true;
        await this.loadGroups();
      });

      // Event: Disconnected
      this.client.on('disconnected', async (reason) => {
        logger.warn('⚠️ WhatsApp desconectado:', reason);
        this.isReady = false;

        logger.info('🔄 Intentando reconexión en 5 segundos...');
        setTimeout(async () => {
          try {
            logger.info('🔄 Reconectando WhatsApp...');
            await this.client.initialize();
          } catch (error) {
            logger.error('Error en reconexión automática:', error);
          }
        }, 5000);
      });

      await this.client.initialize();

    } catch (error) {
      logger.error('Error inicializando WhatsApp client:', error);
      throw error;
    }
  }

  async loadGroups() {
    try {
      const chats = await this.client.getChats();
      this.groups = chats.filter(chat => chat.isGroup);

      logger.info(`📱 Grupos de WhatsApp cargados: ${this.groups.length}`);
      this.groups.forEach(g => {
        logger.info(`  - ${g.name} (${g.id._serialized})`);
      });

    } catch (error) {
      logger.error('Error cargando grupos:', error);
    }
  }

  async sendToGroup(groupId, message) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp client no está listo');
      }

      await this.client.sendMessage(groupId, message);
      logger.info(`✅ Mensaje enviado al grupo ${groupId}`);

      // Esperar 2 segundos
      await new Promise(resolve => setTimeout(resolve, 2000));

      return true;

    } catch (error) {
      logger.error(`Error enviando mensaje al grupo ${groupId}:`, error.message);
      throw error;
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      groupsCount: this.groups.length,
      groups: this.groups.map(g => ({ name: g.name, id: g.id._serialized }))
    };
  }
}

module.exports = new WhatsAppClient();
