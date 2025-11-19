// src/index.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const webhookRouter = require('./routes/webhook');
const apiRouter = require('./routes/api');
const distributorService = require('./services/distributor');
const database = require('./services/database');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/webhook', webhookRouter);
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'railway-webhook',
    timestamp: new Date().toISOString()
  });
});

// Stats endpoint
app.get('/stats', async (req, res) => {
  try {
    const stats = await distributorService.getStats();
    const dbStats = database.getStats();
    res.json({
      distributor: stats,
      database: dbStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
async function start() {
  try {
    logger.info('🚀 Iniciando Railway Webhook Service...');

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`✅ Servidor HTTP corriendo en puerto ${PORT}`);
      logger.info('📡 Listo para recibir webhooks de Facebook');
    });

  } catch (error) {
    logger.error('❌ Error al iniciar el sistema:', error);
    process.exit(1);
  }
}

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

module.exports = app;
