// src/routes/webhook.js
const express = require('express');
const router = express.Router();
const queueService = require('../services/queue');
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

        // Agregar a la cola para procesamiento
        await queueService.addLead(leadId, body);
        logger.info(`Lead ${leadId} agregado a la cola de procesamiento`);
      }
    }
  } catch (error) {
    logger.error('Error processing webhook:', error);
  }
});

module.exports = router;
