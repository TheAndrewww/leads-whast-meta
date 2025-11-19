// src/services/distributor.js
const fs = require('fs').promises;
const path = require('path');

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
      // Si el archivo no existe, crear estado inicial
      const initialState = {
        ultimoAsesor: 'DLAB',  // Empezar con DLAB para que el primero sea VRJ
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
    // Crear directorio si no existe
    const dir = path.dirname(this.statePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(this.statePath, JSON.stringify(state, null, 2));
  }

  async assignAsesor() {
    const state = await this.getState();

    // Alternar asesor
    const nuevoAsesor = state.ultimoAsesor === 'VRJ' ? 'DLAB' : 'VRJ';

    // Actualizar contador
    state.contador[nuevoAsesor]++;
    state.ultimoAsesor = nuevoAsesor;
    state.ultimaActualizacion = new Date().toISOString();

    await this.saveState(state);

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
