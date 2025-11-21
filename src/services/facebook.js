// src/services/facebook.js
const axios = require('axios');
const logger = require('../utils/logger');

class FacebookService {
  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  async getLeadData(leadId) {
    try {
      // Detectar si es un lead de prueba
      if (leadId.startsWith('TEST_LEAD_')) {
        logger.info('🧪 Lead de prueba detectado, usando datos simulados');
        return {
          nombre: 'Juan Pérez (PRUEBA)',
          telefono: '5512345678',
          ciudad: 'Irapuato',
          producto: 'Membrana Tensilada'
        };
      }

      const response = await axios.get(`${this.baseURL}/${leadId}`, {
        params: {
          access_token: this.accessToken
        }
      });

      const fieldData = response.data.field_data;

      // Extraer campos
      const getData = (fieldName) => {
        const field = fieldData.find(f =>
          f.name === fieldName ||
          f.name.includes(fieldName)
        );
        return field ? field.values[0] : null;
      };

      return {
        nombre: getData('full_name') || getData('full name') || getData('name') || 'Sin nombre',
        telefono: getData('número_de_teléfono') || getData('phone_number') || getData('phone') || getData('telefono') || getData('tel') || '',
        ciudad: getData('city') || getData('ciudad') || getData('localidad') || 'No especificada',
        producto: getData('product') || getData('producto') || getData('servicio') || 'CONSULTA'
      };

    } catch (error) {
      logger.error('Error fetching lead data from Facebook:', error);
      throw error;
    }
  }
}

module.exports = new FacebookService();
