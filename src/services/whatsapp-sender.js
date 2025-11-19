// src/services/whatsapp-sender.js
const whatsappClient = require('../whatsapp-client');
const logger = require('../utils/logger');

class WhatsAppSenderService {
  constructor() {
    this.grupoPrincipal = process.env.WHATSAPP_GRUPO_PRINCIPAL;
    this.grupoVRJ = process.env.WHATSAPP_GRUPO_VRJ;
    this.grupoDLAB = process.env.WHATSAPP_GRUPO_DLAB;
  }

  formatMessageGrupoPrincipal(lead) {
    return `🆕 *NUEVO LEAD*

👤 *Contacto:* ${lead.contacto}
📱 *Teléfono:* ${lead.telefono}
📍 *Ciudad:* ${lead.ciudad}
🎯 *Producto:* ${lead.producto}
📊 *Fuente:* ${lead.fuente}
👨‍💼 *Asesor Asignado:* ${lead.asesor}
⏰ *Fecha:* ${lead.fecha_hora}

_El asesor ${lead.asesor} contactará al cliente._`;
  }

  formatMessageGrupoAsesor(lead) {
    return `📞 *LEAD ASIGNADO A TI*

👤 *Nombre:* ${lead.contacto}
📱 *Teléfono:* ${lead.telefono}
📍 *Ciudad:* ${lead.ciudad}
🎯 *Producto:* ${lead.producto}
📊 *Fuente:* ${lead.fuente}

⚡ *ACCIÓN REQUERIDA:* Contacta al cliente lo antes posible.`;
  }

  async sendToGrupoPrincipal(lead) {
    try {
      if (!this.grupoPrincipal) {
        throw new Error('WHATSAPP_GRUPO_PRINCIPAL no configurado en .env');
      }

      const message = this.formatMessageGrupoPrincipal(lead);
      await whatsappClient.sendToGroup(this.grupoPrincipal, message);
      logger.info('✅ Mensaje enviado al grupo principal');
      return true;

    } catch (error) {
      logger.error('Error enviando al grupo principal:', error.message || error);
      throw error;
    }
  }

  async sendToGrupoAsesor(lead, grupoId) {
    try {
      if (!grupoId) {
        throw new Error('ID de grupo del asesor no proporcionado');
      }

      const message = this.formatMessageGrupoAsesor(lead);
      await whatsappClient.sendToGroup(grupoId, message);
      logger.info(`✅ Mensaje enviado al grupo del asesor ${lead.asesor}`);
      return true;

    } catch (error) {
      logger.error(`Error enviando al grupo del asesor ${lead.asesor}:`, error.message || error);
      throw error;
    }
  }

  async sendNotifications(lead, grupoAsesor) {
    const results = {
      grupoPrincipal: false,
      grupoAsesor: false
    };

    try {
      // Verificar que WhatsApp esté listo
      if (!whatsappClient.isReady) {
        logger.warn('⚠️ WhatsApp no está listo, saltando notificaciones');
        return results;
      }

      // Enviar a grupo principal
      try {
        await this.sendToGrupoPrincipal(lead);
        results.grupoPrincipal = true;
      } catch (error) {
        logger.error('Error enviando a grupo principal:', error.message || error);
      }

      // Enviar a grupo del asesor
      try {
        await this.sendToGrupoAsesor(lead, grupoAsesor);
        results.grupoAsesor = true;
      } catch (error) {
        logger.error('Error enviando a grupo del asesor:', error.message || error);
      }

      return results;

    } catch (error) {
      logger.error('Error general en sendNotifications:', error);
      return results;
    }
  }

  getStatus() {
    return {
      grupoPrincipal: this.grupoPrincipal || 'NO CONFIGURADO',
      grupoVRJ: this.grupoVRJ || 'NO CONFIGURADO',
      grupoDLAB: this.grupoDLAB || 'NO CONFIGURADO',
      whatsappReady: whatsappClient.isReady
    };
  }
}

module.exports = new WhatsAppSenderService();
