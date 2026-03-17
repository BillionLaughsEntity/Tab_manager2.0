// js/components/ComponentBase.js

/**
 * Base class for all UI components with built-in logging
 * Every component gets its own logger instance with component name
 */
class ComponentBase {
  constructor(componentName) {
    this.componentName = componentName;
    this.log = this.createLogger(componentName);
    this.log.debug('Component initialized');
  }

  /**
   * Create a component-specific logger
   */
  createLogger(componentName) {
    return {
      debug: (message, data = null) => Logger.debug(componentName, message, data),
      info: (message, data = null) => Logger.info(componentName, message, data),
      warn: (message, data = null) => Logger.warn(componentName, message, data),
      error: (message, error = null) => Logger.error(componentName, message, error),
      trace: (message, data = null) => Logger.trace(componentName, message, data),

      // Lifecycle specific logs
      lifecycle: (method, details = null) => {
        Logger.debug(componentName, `Lifecycle: ${method}`, details);
      },

      // Event specific logs
      event: (eventName, eventData = null) => {
        Logger.trace(componentName, `Event: ${eventName}`, eventData);
      },

      // State change logs
      stateChange: (stateName, oldValue, newValue) => {
        Logger.debug(componentName, `State change: ${stateName}`, { from: oldValue, to: newValue });
      },
    };
  }

  /**
   * Log method entry and exit automatically
   * @param {string} methodName - Name of the method being called
   * @param {Function} fn - The method to wrap
   */
  createTracedMethod(methodName, fn) {
    return (...args) => {
      this.log.trace(`➡️ Entering ${methodName}`, { args });
      try {
        const result = fn.apply(this, args);

        // Handle promises
        if (result && result.then) {
          return result
            .then((res) => {
              this.log.trace(`⬅️ Exiting ${methodName} (Promise resolved)`, { result: res });
              return res;
            })
            .catch((err) => {
              this.log.error(`❌ ${methodName} promise rejected`, err);
              throw err;
            });
        }

        this.log.trace(`⬅️ Exiting ${methodName}`, { result });
        return result;
      } catch (error) {
        this.log.error(`❌ ${methodName} threw error`, error);
        throw error;
      }
    };
  }
}

// Make globally available
window.ComponentBase = ComponentBase;
