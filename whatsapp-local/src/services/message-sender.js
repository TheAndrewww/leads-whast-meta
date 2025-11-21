// src/services/message-sender.js
const whatsappClient = require('./whatsapp-client');
const apiClient = require('./api-client');
const logger = require('../utils/logger');

class MessageSender {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.pollingIntervalMs = parseInt(process.env.POLLING_INTERVAL_MS) || 10000;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('MessageSender ya está corriendo');
      return;
    }

    this.isRunning = true;
    logger.info(`🔄 Iniciando polling cada ${this.pollingIntervalMs / 1000} segundos...`);

    // Primera ejecución inmediata
    await this.checkAndSendMessages();

    // Polling periódico
    this.interval = setInterval(async () => {
      await this.checkAndSendMessages();
    }, this.pollingIntervalMs);
  }

  async checkAndSendMessages() {
    try {
      if (!whatsappClient.isReady) {
        logger.warn('WhatsApp no está listo, saltando polling...');
        return;
      }

      const pendingMessages = await apiClient.getPendingMessages();

      if (pendingMessages.length === 0) {
        logger.info('✅ No hay mensajes pendientes');
        return;
      }

      logger.info(`📬 ${pendingMessages.length} mensaje(s) pendiente(s) encontrado(s)`);

      for (const message of pendingMessages) {
        try {
          logger.info(`📤 Enviando mensaje para lead ${message.leadgen_id} a ${message.asesor}...`);

          // Enviar mensaje al grupo de WhatsApp
          await whatsappClient.sendToGroup(message.grupo_asesor, message.mensaje);

          // También enviar al grupo principal si existe
          const grupoPrincipal = process.env.WHATSAPP_GRUPO_PRINCIPAL;
          if (grupoPrincipal) {
            await whatsappClient.sendToGroup(grupoPrincipal, message.mensaje);
          }

          // Marcar como procesado en la API de Railway
          await apiClient.markAsProcessed(message.id);

          logger.info(`✅ Mensaje enviado y marcado como procesado: ${message.leadgen_id}`);

        } catch (error) {
          logger.error(`❌ Error enviando mensaje ${message.leadgen_id}:`, error);
          await apiClient.markAsFailed(message.id, error.message);
        }
      }

    } catch (error) {
      logger.error('Error en checkAndSendMessages:', error);
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.isRunning = false;
      logger.info('🛑 MessageSender detenido');
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      pollingIntervalMs: this.pollingIntervalMs
    };
  }
}

module.exports = new MessageSender();
