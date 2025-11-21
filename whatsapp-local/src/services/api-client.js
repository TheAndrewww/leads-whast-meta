// src/services/api-client.js
const axios = require('axios');
const logger = require('../utils/logger');

class ApiClient {
  constructor() {
    this.apiUrl = process.env.RAILWAY_API_URL;
    this.apiKey = process.env.API_KEY;

    if (!this.apiUrl || !this.apiKey) {
      logger.warn('⚠️ API_URL o API_KEY no configurados');
    }

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  async getPendingMessages(limit = 50) {
    try {
      const response = await this.client.get('/api/pending-messages', {
        params: { limit }
      });

      if (response.data.success) {
        return response.data.messages;
      }

      return [];
    } catch (error) {
      logger.error('Error obteniendo mensajes pendientes de la API:', error.message);
      return [];
    }
  }

  async markAsProcessed(messageId) {
    try {
      const response = await this.client.post(`/api/messages/${messageId}/processed`);
      return response.data.success;
    } catch (error) {
      logger.error(`Error marcando mensaje ${messageId} como procesado:`, error.message);
      return false;
    }
  }

  async markAsFailed(messageId, errorMsg) {
    try {
      const response = await this.client.post(`/api/messages/${messageId}/failed`, {
        error: errorMsg
      });
      return response.data.success;
    } catch (error) {
      logger.error(`Error marcando mensaje ${messageId} como fallido:`, error.message);
      return false;
    }
  }

  async getStats() {
    try {
      const response = await this.client.get('/api/stats');
      if (response.data.success) {
        return response.data.stats;
      }
      return null;
    } catch (error) {
      logger.error('Error obteniendo stats de la API:', error.message);
      return null;
    }
  }
}

module.exports = new ApiClient();
