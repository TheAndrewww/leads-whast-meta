// src/services/sheets.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const logger = require('../utils/logger');

class SheetsService {
  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    this.sheetName = process.env.GOOGLE_SHEET_NAME || 'DATOS';
    this.isConfigured = false;

    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        this.auth = new JWT({
          email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        this.isConfigured = true;
        logger.info('✅ Google Sheets configurado');
      } catch (error) {
        logger.warn('⚠️ Error configurando Google Sheets:', error.message);
      }
    } else {
      logger.warn('⚠️ Google Sheets NO configurado - Las credenciales están vacías');
    }
  }

  async appendLead(lead) {
    try {
      if (!this.isConfigured) {
        logger.warn('⚠️ Google Sheets no configurado - Saltando guardado');
        return false;
      }

      const doc = new GoogleSpreadsheet(this.spreadsheetId, this.auth);
      await doc.loadInfo();

      const sheet = doc.sheetsByTitle[this.sheetName];

      if (!sheet) {
        logger.error(`❌ Hoja "${this.sheetName}" no encontrada en el spreadsheet`);
        logger.error(`📋 Hojas disponibles: ${Object.keys(doc.sheetsByTitle).join(', ')}`);
        return false;
      }

      await sheet.addRow({
        'CONTACTO': lead.contacto,
        'CIUDAD': lead.ciudad,
        'PRODUCTO': lead.producto,
        'COMO SUPO DE NOSOTROS': lead.fuente,
        'ATIENDE': lead.asesor,
        'STATUS': lead.status,
        'TIPO DE PROYECTO': ''
      });

      logger.info('✅ Lead agregado a Google Sheets');
      return true;
    } catch (error) {
      logger.error('❌ Error agregando a Google Sheets:');
      logger.error(`   Mensaje: ${error.message}`);
      logger.error(`   SpreadsheetID: ${this.spreadsheetId}`);
      logger.error(`   Sheet Name: ${this.sheetName}`);
      if (error.response?.data) {
        logger.error(`   API Error: ${JSON.stringify(error.response.data)}`);
      }
      return false;
    }
  }
}

module.exports = new SheetsService();
