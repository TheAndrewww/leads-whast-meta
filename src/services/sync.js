// src/services/sync.js
const queueService = require('./queue');
const sheetsService = require('./sheets');
const whatsappSender = require('./whatsapp-sender');
const facebookService = require('./facebook');
const distributorService = require('./distributor');
const logger = require('../utils/logger');

class SyncService {
  constructor() {}

  async syncLocalWithSheets() {
    try {
      logger.info('🔄 Iniciando sincronización local vs Google Sheets...');

      // 1. Obtener leads de la cola local
      const queue = await queueService.getQueue();
      const localLeads = queue.leads;

      if (localLeads.length === 0) {
        logger.info('No hay leads en la cola local');
        return { synced: 0, alreadyInSheets: 0, failed: 0, details: [] };
      }

      // 2. Obtener leads de Google Sheets
      const sheetsLeads = await sheetsService.getAllLeads();

      // 3. Crear un Set con los contactos de Sheets para búsqueda rápida
      const sheetsContacts = new Set(
        sheetsLeads.map(lead => this.normalizeContact(lead.contacto))
      );

      const results = {
        synced: 0,
        alreadyInSheets: 0,
        failed: 0,
        details: []
      };

      // 4. Procesar cada lead de la cola local
      for (const localLead of localLeads) {
        try {
          // Solo procesar los que están completados o tienen datos
          if (localLead.status !== 'completed' && !localLead.lead_data) {
            // Intentar obtener datos de Facebook primero
            const leadData = await this.fetchAndStoreLead(localLead.leadgen_id);
            if (!leadData) {
              results.failed++;
              results.details.push({
                leadgen_id: localLead.leadgen_id,
                status: 'failed',
                reason: 'No se pudieron obtener datos de Facebook'
              });
              continue;
            }
            localLead.lead_data = leadData;
          }

          // Verificar si ya está en Sheets
          const contactName = localLead.lead_data?.contacto || localLead.lead_data?.nombre;
          if (contactName && sheetsContacts.has(this.normalizeContact(contactName))) {
            results.alreadyInSheets++;
            results.details.push({
              leadgen_id: localLead.leadgen_id,
              contacto: contactName,
              status: 'already_in_sheets'
            });
            continue;
          }

          // No está en Sheets, necesita sincronización
          const syncResult = await this.syncLead(localLead);

          if (syncResult.success) {
            results.synced++;
            results.details.push({
              leadgen_id: localLead.leadgen_id,
              contacto: contactName,
              status: 'synced',
              whatsapp: syncResult.whatsapp,
              sheets: syncResult.sheets
            });
          } else {
            results.failed++;
            results.details.push({
              leadgen_id: localLead.leadgen_id,
              contacto: contactName,
              status: 'failed',
              reason: syncResult.error
            });
          }

        } catch (error) {
          results.failed++;
          results.details.push({
            leadgen_id: localLead.leadgen_id,
            status: 'failed',
            reason: error.message
          });
        }

        // Esperar entre cada lead
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      logger.info(`✅ Sincronización completada: ${results.synced} sincronizados, ${results.alreadyInSheets} ya existían, ${results.failed} fallidos`);
      return results;

    } catch (error) {
      logger.error('Error en sincronización:', error);
      throw error;
    }
  }

  async fetchAndStoreLead(leadgenId) {
    try {
      const leadData = await facebookService.getLeadData(leadgenId);

      // Actualizar la cola con los datos
      const queue = await queueService.getQueue();
      const lead = queue.leads.find(l => l.leadgen_id === leadgenId);
      if (lead) {
        lead.lead_data = {
          contacto: leadData.nombre,
          telefono: leadData.telefono,
          ciudad: leadData.ciudad,
          producto: leadData.producto
        };
        await queueService.saveQueue(queue);
      }

      return leadData;
    } catch (error) {
      logger.error(`Error obteniendo datos de Facebook para ${leadgenId}:`, error.message);
      return null;
    }
  }

  async syncLead(localLead) {
    const result = {
      success: false,
      whatsapp: { principal: false, asesor: false },
      sheets: false,
      error: null
    };

    try {
      // Obtener datos del lead
      let leadData = localLead.lead_data;

      if (!leadData) {
        leadData = await this.fetchAndStoreLead(localLead.leadgen_id);
        if (!leadData) {
          result.error = 'No se pudieron obtener datos del lead';
          return result;
        }
      }

      // Asignar asesor
      const assignment = await distributorService.assignAsesor();

      // Formatear lead
      const formattedLead = {
        contacto: leadData.contacto || leadData.nombre,
        telefono: leadData.telefono,
        ciudad: leadData.ciudad,
        producto: leadData.producto,
        fuente: 'FACEBOOK',
        asesor: assignment.asesor,
        status: 'NUEVO',
        fecha_hora: new Date().toLocaleString('es-MX')
      };

      // Enviar a WhatsApp
      try {
        const whatsappResult = await whatsappSender.sendNotifications(
          formattedLead,
          assignment.grupoAsesor
        );
        result.whatsapp = whatsappResult;
      } catch (error) {
        logger.error('Error enviando a WhatsApp:', error.message);
      }

      // Guardar en Sheets
      try {
        const sheetsResult = await sheetsService.appendLead(formattedLead);
        result.sheets = sheetsResult;
      } catch (error) {
        logger.error('Error guardando en Sheets:', error.message);
      }

      // Actualizar estado en la cola
      await queueService.updateLeadStatus(
        localLead.leadgen_id,
        'completed',
        {
          whatsapp_principal: result.whatsapp.grupoPrincipal,
          whatsapp_asesor: result.whatsapp.grupoAsesor,
          sheets_saved: result.sheets
        }
      );

      result.success = true;
      return result;

    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  normalizeContact(contact) {
    if (!contact) return '';
    return contact.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  async getStatus() {
    const queue = await queueService.getQueue();
    const sheetsLeads = await sheetsService.getAllLeads();

    return {
      localLeads: queue.leads.length,
      sheetsLeads: sheetsLeads.length,
      pendingSync: queue.leads.filter(l =>
        l.status !== 'completed' || !l.results?.sheets_saved
      ).length
    };
  }
}

module.exports = new SyncService();
