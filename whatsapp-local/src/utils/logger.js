// src/utils/logger.js
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    // Console
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);

    // File
    const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  info(message, data) {
    this.log('info', message, data);
  }

  error(message, error) {
    this.log('error', message, {
      error: error?.message || error,
      stack: error?.stack
    });
  }

  warn(message, data) {
    this.log('warn', message, data);
  }
}

module.exports = new Logger();
