// src/routes/api.js
const express = require('express');
const router = express.Router();
const database = require('../services/database');
const logger = require('../utils/logger');

// Autenticación simple con API Key
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY || 'default-secret-key-change-me';

  if (apiKey !== validApiKey) {
    logger.warn('❌ Intento de acceso no autorizado');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

// Obtener mensajes pendientes
router.get('/pending-messages', authenticateApiKey, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messages = database.getPendingMessages(limit);

    logger.info(`📬 ${messages.length} mensajes pendientes solicitados`);

    res.json({
      success: true,
      count: messages.length,
      messages: messages
    });
  } catch (error) {
    logger.error('Error obteniendo mensajes pendientes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Marcar mensaje como procesado
router.post('/messages/:id/processed', authenticateApiKey, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = database.markAsProcessed(id);

    res.json({ success });
  } catch (error) {
    logger.error('Error marcando mensaje como procesado:', error);
    res.status(500).json({ error: error.message });
  }
});

// Marcar mensaje como fallido
router.post('/messages/:id/failed', authenticateApiKey, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const errorMsg = req.body.error || 'Error desconocido';
    const success = database.markAsFailed(id, errorMsg);

    res.json({ success });
  } catch (error) {
    logger.error('Error marcando mensaje como fallido:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas
router.get('/stats', authenticateApiKey, (req, res) => {
  try {
    const stats = database.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Error obteniendo stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
