// src/services/lead-processor.js
const facebookService = require('./facebook');
const distributorService = require('./distributor');
const sheetsService = require('./sheets');
const database = require('./database');
const logger = require('../utils/logger');

class LeadProcessor {
  async processLead(leadgenId) {
    try {
      logger.info(`📝 Procesando lead: ${leadgenId}`);

      // 1. Obtener datos del lead desde Facebook
      const leadData = await facebookService.getLeadData(leadgenId);
      logger.info(`✅ Datos obtenidos: ${leadData.nombre} - ${leadData.telefono}`);

      // 2. Asignar asesor alternando
      const assignment = await distributorService.assignAsesor();
      logger.info(`👤 Asignado a: ${assignment.asesor}`);

      // 3. Preparar datos para Google Sheets
      const leadForSheet = {
        contacto: `${leadData.nombre} - ${leadData.telefono}`,
        ciudad: leadData.ciudad,
        producto: leadData.producto,
        fuente: 'Facebook Lead Ads',
        asesor: assignment.asesor,
        status: 'NUEVO'
      };

      // 4. Guardar en Google Sheets - DATOS (no bloqueante)
      const sheetsSaved = await sheetsService.appendLead(leadForSheet);
      if (!sheetsSaved) {
        logger.warn('⚠️ Lead no guardado en Google Sheets, pero continuando proceso');
      }

      // 5. Crear mensaje para WhatsApp
      const mensaje = this.formatWhatsAppMessage(leadData, assignment.asesor);

      // 6. Agregar mensaje a la base de datos local
      try {
        database.addPendingMessage(
          leadgenId,
          assignment.asesor,
          assignment.grupoAsesor,
          mensaje
        );
      } catch (dbError) {
        logger.error('⚠️ Error guardando en base de datos, pero lead fue procesado');
        // No lanzar el error, el lead ya fue asignado
      }

      logger.info(`✅ Lead procesado exitosamente: ${leadgenId}`);

      return {
        success: true,
        leadgenId,
        asesor: assignment.asesor,
        leadData
      };

    } catch (error) {
      logger.error(`❌ Error procesando lead ${leadgenId}:`);
      logger.error(`   Error: ${error.message}`);
      logger.error(`   Stack: ${error.stack}`);
      throw error;
    }
  }

  formatWhatsAppMessage(leadData, asesor) {
    return `🆕 *NUEVO LEAD - ${asesor}*\n\n` +
           `👤 *Nombre:* ${leadData.nombre}\n` +
           `📱 *Teléfono:* ${leadData.telefono}\n` +
           `📍 *Ciudad:* ${leadData.ciudad}\n` +
           `🏗️ *Producto:* ${leadData.producto}\n` +
           `📢 *Fuente:* Facebook Lead Ads\n\n` +
           `⏰ ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`;
  }
}

module.exports = new LeadProcessor();
