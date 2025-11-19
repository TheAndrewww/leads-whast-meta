// src/index.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const webhookRouter = require('./routes/webhook');
const whatsappClient = require('./whatsapp-client');
const distributorService = require('./services/distributor');
const queueService = require('./services/queue');
const queueWorker = require('./services/queue-worker');
const syncService = require('./services/sync');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/webhook', webhookRouter);

// Health check
app.get('/health', (req, res) => {
  const whatsappStatus = whatsappClient.getStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    whatsapp: {
      ready: whatsappStatus.isReady,
      groups: whatsappStatus.groupsCount
    }
  });
});

// Stats endpoint
app.get('/stats', async (req, res) => {
  try {
    const stats = await distributorService.getStats();
    const whatsappStatus = whatsappClient.getStatus();
    const queueStats = await queueService.getStats();

    res.json({
      distributor: stats,
      whatsapp: whatsappStatus,
      queue: queueStats,
      worker: queueWorker.getStatus(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Queue endpoints
app.get('/queue', async (req, res) => {
  try {
    const stats = await queueService.getStats();
    const recentLeads = await queueService.getRecentLeads(20);

    res.json({
      stats,
      recentLeads,
      worker: queueWorker.getStatus()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queue/pending', async (req, res) => {
  try {
    const pendingLeads = await queueService.getPendingLeads();
    res.json({ count: pendingLeads.length, leads: pendingLeads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queue/failed', async (req, res) => {
  try {
    const failedLeads = await queueService.getFailedLeads();
    res.json({ count: failedLeads.length, leads: failedLeads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retry all failed leads
app.post('/queue/retry-all', async (req, res) => {
  try {
    const result = await queueWorker.retryFailed();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retry specific lead
app.post('/queue/retry/:leadgenId', async (req, res) => {
  try {
    const lead = await queueWorker.retryOne(req.params.leadgenId);
    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync endpoints
app.get('/sync/status', async (req, res) => {
  try {
    const status = await syncService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/sync', async (req, res) => {
  try {
    logger.info('Iniciando sincronización manual...');
    const result = await syncService.syncLocalWithSheets();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add lead manually by leadgen_id
app.post('/queue/add/:leadgenId', async (req, res) => {
  try {
    const lead = await queueService.addLead(req.params.leadgenId);
    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize WhatsApp client and start server
async function start() {
  try {
    logger.info('🚀 Iniciando sistema de distribución de leads...');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`✅ Servidor HTTP corriendo en puerto ${PORT}`);
    });

    // Initialize WhatsApp client
    logger.info('📱 Inicializando cliente de WhatsApp...');
    await whatsappClient.initialize();

    // Start queue worker
    logger.info('🔄 Iniciando worker de cola...');
    queueWorker.start();

    logger.info('✅ Sistema completamente inicializado');

  } catch (error) {
    logger.error('❌ Error al iniciar el sistema:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Cerrando sistema...');
  queueWorker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Cerrando sistema...');
  queueWorker.stop();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  // No cerrar el proceso, dejar que PM2 maneje el restart si es necesario
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection:', reason);
});

// Start the application
start();

module.exports = app;
