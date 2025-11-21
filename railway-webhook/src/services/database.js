// src/services/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    const dbDir = path.join(__dirname, '../../data');

    // Crear directorio si no existe
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'leads.db');
    this.db = new Database(dbPath);

    this.initTables();
    logger.info('✅ Base de datos SQLite inicializada');
  }

  initTables() {
    // Tabla de mensajes pendientes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pending_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        leadgen_id TEXT UNIQUE NOT NULL,
        asesor TEXT NOT NULL,
        grupo_asesor TEXT NOT NULL,
        mensaje TEXT NOT NULL,
        created_at TEXT NOT NULL,
        procesado INTEGER DEFAULT 0,
        procesado_at TEXT,
        error TEXT
      )
    `);

    // Índices para mejorar performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_procesado ON pending_messages(procesado);
      CREATE INDEX IF NOT EXISTS idx_leadgen_id ON pending_messages(leadgen_id);
    `);

    logger.info('✅ Tablas de base de datos creadas/verificadas');
  }

  addPendingMessage(leadgenId, asesor, grupoAsesor, mensaje) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO pending_messages (leadgen_id, asesor, grupo_asesor, mensaje, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(leadgenId, asesor, grupoAsesor, mensaje, new Date().toISOString());

      logger.info(`✅ Mensaje pendiente agregado: ${leadgenId}`);
      return true;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        logger.warn(`⚠️ Mensaje duplicado ignorado: ${leadgenId}`);
        return false;
      }
      logger.error('❌ Error agregando mensaje pendiente a SQLite:');
      logger.error(`   LeadgenID: ${leadgenId}`);
      logger.error(`   Asesor: ${asesor}`);
      logger.error(`   Grupo: ${grupoAsesor}`);
      logger.error(`   Error: ${error.message}`);
      logger.error(`   Code: ${error.code}`);
      throw error;
    }
  }

  getPendingMessages(limit = 50) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM pending_messages
        WHERE procesado = 0
        ORDER BY created_at ASC
        LIMIT ?
      `);

      return stmt.all(limit);
    } catch (error) {
      logger.error('Error obteniendo mensajes pendientes:', error);
      return [];
    }
  }

  markAsProcessed(id) {
    try {
      const stmt = this.db.prepare(`
        UPDATE pending_messages
        SET procesado = 1, procesado_at = ?
        WHERE id = ?
      `);

      stmt.run(new Date().toISOString(), id);
      logger.info(`✅ Mensaje marcado como procesado: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error marcando mensaje como procesado:', error);
      return false;
    }
  }

  markAsFailed(id, errorMsg) {
    try {
      const stmt = this.db.prepare(`
        UPDATE pending_messages
        SET procesado = -1, error = ?, procesado_at = ?
        WHERE id = ?
      `);

      stmt.run(errorMsg, new Date().toISOString(), id);
      logger.warn(`⚠️ Mensaje marcado como error: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error marcando mensaje como fallido:', error);
      return false;
    }
  }

  getStats() {
    try {
      const stmt = this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN procesado = 0 THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN procesado = 1 THEN 1 ELSE 0 END) as procesados,
          SUM(CASE WHEN procesado = -1 THEN 1 ELSE 0 END) as errores
        FROM pending_messages
      `);

      return stmt.get();
    } catch (error) {
      logger.error('Error obteniendo stats:', error);
      return { total: 0, pendientes: 0, procesados: 0, errores: 0 };
    }
  }
}

module.exports = new DatabaseService();
