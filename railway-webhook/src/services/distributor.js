// src/services/distributor.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class DistributorService {
  constructor() {
    this.statePath = path.join(__dirname, '../../data/distributor-state.json');
    this.grupos = {
      'VRJ': process.env.WHATSAPP_GRUPO_VRJ,
      'DLAB': process.env.WHATSAPP_GRUPO_DLAB
    };
  }

  async getState() {
    try {
      const data = await fs.readFile(this.statePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      const initialState = {
        ultimoAsesor: 'DLAB',
        contador: {
          'VRJ': 0,
          'DLAB': 0
        }
      };
      await this.saveState(initialState);
      return initialState;
    }
  }

  async saveState(state) {
    const dir = path.dirname(this.statePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.statePath, JSON.stringify(state, null, 2));
  }

  async assignAsesor() {
    const state = await this.getState();

    const nuevoAsesor = state.ultimoAsesor === 'VRJ' ? 'DLAB' : 'VRJ';

    state.contador[nuevoAsesor]++;
    state.ultimoAsesor = nuevoAsesor;
    state.ultimaActualizacion = new Date().toISOString();

    await this.saveState(state);

    logger.info(`📊 Lead asignado a ${nuevoAsesor} (Total: VRJ=${state.contador.VRJ}, DLAB=${state.contador.DLAB})`);

    return {
      asesor: nuevoAsesor,
      grupoAsesor: this.grupos[nuevoAsesor]
    };
  }

  async getStats() {
    const state = await this.getState();
    return {
      ultimoAsesor: state.ultimoAsesor,
      contador: state.contador,
      total: state.contador.VRJ + state.contador.DLAB
    };
  }
}

module.exports = new DistributorService();
