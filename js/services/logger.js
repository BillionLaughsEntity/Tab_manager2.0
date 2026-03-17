// js/services/logger.js

/**
 * Centralized logging service with different log levels and styling
 * This will help us track every action in the app
 */
const Logger = {
  // Log levels
  levels: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    TRACE: 'TRACE',
  },

  // Configuration
  config: {
    enabled: true,
    level: 'DEBUG', // Show all logs from DEBUG and above
    showTimestamp: true,
    showComponent: true,
  },

  /**
   * Initialize logger with optional custom config
   */
  init(config = {}) {
    this.config = { ...this.config, ...config };
    this.info('Logger', 'Logger initialized', { config: this.config });
  },

  /**
   * Format log message with timestamp and component
   */
  formatMessage(component, message, data = null) {
    const parts = [];

    if (this.config.showTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    if (this.config.showComponent) {
      parts.push(`[${component}]`);
    }

    parts.push(message);

    return parts.join(' ');
  },

  /**
   * Log debug message (detailed information for debugging)
   */
  debug(component, message, data = null) {
    if (!this.shouldLog('DEBUG')) return;

    const formattedMsg = this.formatMessage(component, message);
    console.debug(`🔍 ${formattedMsg}`, data !== null ? data : '');

    // Store in memory for later inspection if needed
    this.storeLog('DEBUG', component, message, data);
  },

  /**
   * Log info message (general application flow)
   */
  info(component, message, data = null) {
    if (!this.shouldLog('INFO')) return;

    const formattedMsg = this.formatMessage(component, message);
    console.info(`ℹ️ ${formattedMsg}`, data !== null ? data : '');
    this.storeLog('INFO', component, message, data);
  },

  /**
   * Log warning message (something unexpected but not crashing)
   */
  warn(component, message, data = null) {
    if (!this.shouldLog('WARN')) return;

    const formattedMsg = this.formatMessage(component, message);
    console.warn(`⚠️ ${formattedMsg}`, data !== null ? data : '');
    this.storeLog('WARN', component, message, data);
  },

  /**
   * Log error message (something failed)
   */
  error(component, message, error = null) {
    if (!this.shouldLog('ERROR')) return;

    const formattedMsg = this.formatMessage(component, message);
    console.error(`❌ ${formattedMsg}`, error !== null ? error : '');
    this.storeLog('ERROR', component, message, error);
  },

  /**
   * Log trace message (very detailed flow tracking)
   */
  trace(component, message, data = null) {
    if (!this.shouldLog('TRACE')) return;

    const formattedMsg = this.formatMessage(component, message);
    console.trace(`🔧 ${formattedMsg}`, data !== null ? data : '');
    this.storeLog('TRACE', component, message, data);
  },

  /**
   * Check if we should log based on configured level
   */
  shouldLog(level) {
    if (!this.config.enabled) return false;

    const levels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= configLevelIndex;
  },

  /**
   * Store logs in memory for later inspection
   */
  logHistory: [],
  maxHistory: 1000,

  storeLog(level, component, message, data) {
    this.logHistory.push({
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : null,
    });

    // Keep history size manageable
    if (this.logHistory.length > this.maxHistory) {
      this.logHistory.shift();
    }
  },

  /**
   * Get all stored logs
   */
  getLogHistory() {
    return this.logHistory;
  },

  /**
   * Clear log history
   */
  clearHistory() {
    this.logHistory = [];
    this.info('Logger', 'Log history cleared');
  },

  /**
   * Export logs for debugging
   */
  exportLogs() {
    const logs = this.logHistory
      .map(
        (log) =>
          `[${log.timestamp}] [${log.level}] [${log.component}] ${log.message} ${log.data ? JSON.stringify(log.data) : ''}`,
      )
      .join('\n');

    console.log('📋 Exporting logs:', logs);
    return logs;
  },
};

// Auto-initialize when loaded
Logger.init();

// Make it globally available for console debugging
window.Logger = Logger;
