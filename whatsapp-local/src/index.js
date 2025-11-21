// src/index.js
const dotenv = require('dotenv');
dotenv.config();

const whatsappClient = require('./services/whatsapp-client');
const messageSender = require('./services/message-sender');
const logger = require('./utils/logger');

async function start() {
  try {
    logger.info('🚀 Iniciando cliente local de WhatsApp...');

    // Inicializar cliente de WhatsApp
    logger.info('📱 Inicializando cliente de WhatsApp...');
    await whatsappClient.initialize();

    // Iniciar el message sender (polling)
    logger.info('🔄 Iniciando servicio de envío de mensajes...');
    await messageSender.start();

    logger.info('✅ Sistema completamente inicializado y corriendo');
    logger.info('📊 El sistema está consultando Google Sheets periódicamente');

  } catch (error) {
    logger.error('❌ Error al iniciar el sistema:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Cerrando sistema...');
  messageSender.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Cerrando sistema...');
  messageSender.stop();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection:', reason);
});

// Start the application
start();

module.exports = { whatsappClient, messageSender };
