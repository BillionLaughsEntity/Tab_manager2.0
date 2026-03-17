// js/app.js

/**
 * Main application entry point
 * Initializes all components with full logging
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize logger first
  Logger.init({
    enabled: true,
    level: 'DEBUG', // Change to 'INFO' for less verbosity, 'ERROR' for only errors
    showTimestamp: true,
    showComponent: true,
  });

  Logger.info('App', '🚀 Tab Manager 2.0 starting...');

  // Log environment info
  Logger.debug('App', 'Environment info', {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    url: window.location.href,
  });

  // Initialize all components
  initializeComponents();

  Logger.info('App', '✅ Tab Manager 2.0 started successfully');
});

/**
 * Initialize all application components
 */
function initializeComponents() {
  Logger.group('App', 'Initializing components');

  try {
    // Check if all required DOM elements exist
    checkRequiredElements();

    // Initialize components here as we build them
    // initializeWorkbookManager();
    // initializeProfileManager();
    // etc...

    // Log success
    Logger.info('App', 'All components initialized successfully');
  } catch (error) {
    Logger.error('App', 'Failed to initialize components', error);

    // Show user-friendly error message
    showErrorMessage('Failed to initialize application. Check console for details.');
  } finally {
    Logger.groupEnd('App');
  }
}

/**
 * Check if all required DOM elements are present
 */
function checkRequiredElements() {
  const requiredElements = {
    header: '.main-header',
    'workbooks-profiles': '.workbooks-profiles',
    'environments-sidebar': '.environments-sidebar',
    'main-content': '.main-content',
    'search-input': '.search-input',
    counters: '.counters',
  };

  Logger.debug('App', 'Checking required DOM elements');

  for (const [name, selector] of Object.entries(requiredElements)) {
    const element = document.querySelector(selector);
    if (element) {
      Logger.trace('App', `✓ Found element: ${name}`, { selector });
    } else {
      Logger.warn('App', `✗ Missing element: ${name}`, { selector });
    }
  }
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #f44336;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 9999;
        max-width: 400px;
    `;
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  Logger.warn('App', 'Displayed error message to user', { message });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
    Logger.trace('App', 'Removed error message');
  }, 5000);
}

// Add console helper for manual logging
window.debug = {
  logs: () => Logger.getLogHistory(),
  clear: () => Logger.clearHistory(),
  export: () => Logger.exportLogs(),
  level: (level) => {
    Logger.config.level = level;
    Logger.info('Debug', `Log level changed to ${level}`);
  },
};
