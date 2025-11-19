// src/services/queue-worker.js
const queueService = require('./queue');
const facebookService = require('./facebook');
const distributorService = require('./distributor');
const whatsappSender = require('./whatsapp-sender');
const sheetsService = require('./sheets');
const logger = require('../utils/logger');

class QueueWorker {
  constructor() {
    this.isRunning = false;
    this.processInterval = null;
    this.intervalMs = 10000; // Procesar cada 10 segundos
  }

  start() {
    if (this.isRunning) {
      logger.info('Queue worker ya está corriendo');
      return;
    }

    this.isRunning = true;
    logger.info('Queue worker iniciado');

    // Procesar inmediatamente y luego en intervalos
    this.processQueue();
    this.processInterval = setInterval(() => {
      this.processQueue();
    }, this.intervalMs);
  }

  stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    this.isRunning = false;
    logger.info('Queue worker detenido');
  }

  async processQueue() {
    try {
      const pendingLeads = await queueService.getPendingLeads();

      if (pendingLeads.length === 0) {
        return;
      }

      logger.info(`Procesando ${pendingLeads.length} leads pendientes...`);

      for (const lead of pendingLeads) {
        await this.processLead(lead);
        // Esperar 3 segundos entre cada lead para no saturar
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      logger.error('Error en processQueue:', error);
    }
  }

  async processLead(queuedLead) {
    const leadgenId = queuedLead.leadgen_id;

    try {
      logger.info(`Procesando lead ${leadgenId} (intento ${queuedLead.attempts + 1})`);

      // Incrementar intentos
      await queueService.incrementAttempts(leadgenId);

      const results = {
        facebook_fetched: false,
        whatsapp_principal: false,
        whatsapp_asesor: false,
        sheets_saved: false
      };

      // 1. Obtener datos del lead de Facebook
      let leadData;
      try {
        leadData = await facebookService.getLeadData(leadgenId);
        results.facebook_fetched = true;
        logger.info(`Datos de Facebook obtenidos para ${leadgenId}`);
      } catch (error) {
        throw new Error(`Error obteniendo datos de Facebook: ${error.message}`);
      }

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

      // 4. Enviar notificaciones a WhatsApp
      try {
        const notificationResults = await whatsappSender.sendNotifications(
          formattedLead,
          assignment.grupoAsesor
        );
        results.whatsapp_principal = notificationResults.grupoPrincipal;
        results.whatsapp_asesor = notificationResults.grupoAsesor;

        if (!results.whatsapp_principal && !results.whatsapp_asesor) {
          logger.warn(`WhatsApp no disponible para lead ${leadgenId}`);
        }
      } catch (error) {
        logger.error(`Error enviando WhatsApp para ${leadgenId}:`, error.message);
        // No fallar completamente si WhatsApp falla
      }

      // 5. Guardar en Google Sheets
      try {
        await sheetsService.appendLead(formattedLead);
        results.sheets_saved = true;
        logger.info(`Lead ${leadgenId} guardado en Sheets`);
      } catch (error) {
        logger.error(`Error guardando en Sheets para ${leadgenId}:`, error.message);
        // No fallar completamente si Sheets falla
      }

      // Determinar si fue exitoso
      // Consideramos exitoso si al menos se obtuvo de Facebook
      // WhatsApp y Sheets son opcionales
      if (results.facebook_fetched) {
        await queueService.updateLeadStatus(leadgenId, 'completed', results);
        logger.info(`Lead ${leadgenId} procesado exitosamente`);
      } else {
        throw new Error('No se pudieron obtener datos de Facebook');
      }

    } catch (error) {
      logger.error(`Error procesando lead ${leadgenId}:`, error.message);

      const currentLead = await queueService.getLeadByLeadgenId(leadgenId);

      if (currentLead && currentLead.attempts >= queueService.maxRetries) {
        await queueService.updateLeadStatus(leadgenId, 'failed', {}, error.message);
        logger.error(`Lead ${leadgenId} marcado como fallido después de ${currentLead.attempts} intentos`);
      } else {
        // Dejar como pending para reintentar
        await queueService.updateLeadStatus(leadgenId, 'pending', {}, error.message);
      }
    }
  }

  async retryFailed() {
    const failedLeads = await queueService.getFailedLeads();

    if (failedLeads.length === 0) {
      logger.info('No hay leads fallidos para reintentar');
      return { processed: 0 };
    }

    logger.info(`Reintentando ${failedLeads.length} leads fallidos...`);

    let processed = 0;
    for (const lead of failedLeads) {
      await queueService.resetLead(lead.leadgen_id);
      processed++;
    }

    return { processed };
  }

  async retryOne(leadgenId) {
    const lead = await queueService.getLeadByLeadgenId(leadgenId);

    if (!lead) {
      throw new Error(`Lead ${leadgenId} no encontrado`);
    }

    await queueService.resetLead(leadgenId);
    logger.info(`Lead ${leadgenId} marcado para reintentar`);

    // Procesar inmediatamente
    const updatedLead = await queueService.getLeadByLeadgenId(leadgenId);
    await this.processLead(updatedLead);

    return await queueService.getLeadByLeadgenId(leadgenId);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs
    };
  }
}

module.exports = new QueueWorker();
