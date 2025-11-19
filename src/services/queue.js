// src/services/queue.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class QueueService {
  constructor() {
    this.queuePath = path.join(__dirname, '../../data/leads-queue.json');
    this.maxRetries = 3;
    this.retryDelay = 30000; // 30 segundos entre reintentos
  }

  async getQueue() {
    try {
      const data = await fs.readFile(this.queuePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Si el archivo no existe, crear cola inicial
      const initialQueue = {
        leads: [],
        stats: {
          total: 0,
          completed: 0,
          failed: 0,
          pending: 0
        }
      };
      await this.saveQueue(initialQueue);
      return initialQueue;
    }
  }

  async saveQueue(queue) {
    const dir = path.dirname(this.queuePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.queuePath, JSON.stringify(queue, null, 2));
  }

  async addLead(leadgenId, rawData = null) {
    const queue = await this.getQueue();

    // Verificar si ya existe
    const exists = queue.leads.find(l => l.leadgen_id === leadgenId);
    if (exists) {
      logger.info(`Lead ${leadgenId} ya existe en la cola`);
      return exists;
    }

    const newLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      leadgen_id: leadgenId,
      status: 'pending',
      attempts: 0,
      created_at: new Date().toISOString(),
      processed_at: null,
      last_attempt: null,
      error: null,
      raw_data: rawData,
      results: {
        facebook_fetched: false,
        whatsapp_principal: false,
        whatsapp_asesor: false,
        sheets_saved: false
      }
    };

    queue.leads.push(newLead);
    queue.stats.total++;
    queue.stats.pending++;

    await this.saveQueue(queue);
    logger.info(`Lead ${leadgenId} agregado a la cola`);

    return newLead;
  }

  async updateLeadStatus(leadgenId, status, results = {}, error = null) {
    const queue = await this.getQueue();
    const lead = queue.leads.find(l => l.leadgen_id === leadgenId);

    if (!lead) {
      throw new Error(`Lead ${leadgenId} no encontrado en la cola`);
    }

    const oldStatus = lead.status;
    lead.status = status;
    lead.last_attempt = new Date().toISOString();
    lead.results = { ...lead.results, ...results };

    if (error) {
      lead.error = error;
    }

    if (status === 'completed') {
      lead.processed_at = new Date().toISOString();
      if (oldStatus === 'pending' || oldStatus === 'processing') {
        queue.stats.pending--;
        queue.stats.completed++;
      }
    } else if (status === 'failed') {
      if (oldStatus === 'pending' || oldStatus === 'processing') {
        queue.stats.pending--;
        queue.stats.failed++;
      }
    }

    await this.saveQueue(queue);
    return lead;
  }

  async incrementAttempts(leadgenId) {
    const queue = await this.getQueue();
    const lead = queue.leads.find(l => l.leadgen_id === leadgenId);

    if (lead) {
      lead.attempts++;
      lead.status = 'processing';
      lead.last_attempt = new Date().toISOString();
      await this.saveQueue(queue);
    }

    return lead;
  }

  async getPendingLeads() {
    const queue = await this.getQueue();
    return queue.leads.filter(l =>
      l.status === 'pending' ||
      (l.status === 'failed' && l.attempts < this.maxRetries)
    );
  }

  async getFailedLeads() {
    const queue = await this.getQueue();
    return queue.leads.filter(l => l.status === 'failed');
  }

  async getLeadByLeadgenId(leadgenId) {
    const queue = await this.getQueue();
    return queue.leads.find(l => l.leadgen_id === leadgenId);
  }

  async resetLead(leadgenId) {
    const queue = await this.getQueue();
    const lead = queue.leads.find(l => l.leadgen_id === leadgenId);

    if (lead) {
      const wasCompleted = lead.status === 'completed';
      const wasFailed = lead.status === 'failed';

      lead.status = 'pending';
      lead.attempts = 0;
      lead.error = null;
      lead.results = {
        facebook_fetched: false,
        whatsapp_principal: false,
        whatsapp_asesor: false,
        sheets_saved: false
      };

      if (wasCompleted) {
        queue.stats.completed--;
        queue.stats.pending++;
      } else if (wasFailed) {
        queue.stats.failed--;
        queue.stats.pending++;
      }

      await this.saveQueue(queue);
      logger.info(`Lead ${leadgenId} reseteado para reprocesar`);
    }

    return lead;
  }

  async getStats() {
    const queue = await this.getQueue();
    const pending = queue.leads.filter(l => l.status === 'pending').length;
    const processing = queue.leads.filter(l => l.status === 'processing').length;
    const completed = queue.leads.filter(l => l.status === 'completed').length;
    const failed = queue.leads.filter(l => l.status === 'failed').length;
    const retryable = queue.leads.filter(l =>
      l.status === 'failed' && l.attempts < this.maxRetries
    ).length;

    return {
      total: queue.leads.length,
      pending,
      processing,
      completed,
      failed,
      retryable,
      lastUpdated: new Date().toISOString()
    };
  }

  async getRecentLeads(limit = 10) {
    const queue = await this.getQueue();
    return queue.leads
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }
}

module.exports = new QueueService();
