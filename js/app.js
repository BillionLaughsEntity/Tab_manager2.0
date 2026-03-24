// js/app.js - Updated with loading verification

/**
 * Main application entry point
 * Initializes all components with full logging
 */

// Global app instance
let app = null;

class TabManagerApp {
    constructor() {
        this.log = {
            info: (msg, data) => Logger.info('App', msg, data),
            debug: (msg, data) => Logger.debug('App', msg, data),
            error: (msg, error) => Logger.error('App', msg, error),
            warn: (msg, data) => Logger.warn('App', msg, data)
        };
        
        this.managers = {};
    }

    /**
     * Verify all required classes are loaded
     */
    verifyDependencies() {
        const required = [
            'WorkbookManager',
            'ProfileManager', 
            'EnvironmentManager',
            'LinkManager',
            'StorageService',
            'SampleDataGenerator'
        ];
        
        const missing = [];
        for (const dep of required) {
            if (typeof window[dep] === 'undefined' && dep !== 'StorageService' && dep !== 'SampleDataGenerator') {
                // Check for StorageService instance
                if (dep === 'StorageService' && typeof storage !== 'undefined') continue;
                if (dep === 'SampleDataGenerator' && typeof SampleDataGenerator !== 'undefined') continue;
                missing.push(dep);
            }
        }
        
        if (missing.length > 0) {
            this.log.error('Missing dependencies', { missing });
            return false;
        }
        
        this.log.debug('All dependencies verified');
        return true;
    }

    async initialize() {
        this.log.info('🚀 Initializing Tab Manager 2.0...');
        
        try {
            // Verify all dependencies are loaded
            if (!this.verifyDependencies()) {
                throw new Error('Missing required components. Check script loading order.');
            }
            
            // Initialize storage first
            await storage.initialize();
            this.log.info('Storage initialized');
            
            // Update header counters
            this.updateCounters();
            
            // Wait a tick for DOM to be ready
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Initialize all UI managers
            this.initializeManagers();
            
            // Set up global event listeners
            this.setupEventListeners();
            
            this.log.info('✅ Tab Manager 2.0 initialized successfully');
            
            // Log initial data stats
            const stats = storage.getStats();
            this.log.info('Initial data stats', stats);
            
        } catch (error) {
            this.log.error('Failed to initialize Tab Manager', error);
            this.showErrorMessage('Failed to initialize application: ' + error.message);
        }
    }

    initializeManagers() {
        this.log.debug('Initializing UI managers');
        
        // Check if DOM elements exist before initializing
        const workbookBar = document.querySelector('#workbooks-bar');
        if (!workbookBar) {
            this.log.warn('Workbooks bar container not found - check HTML structure');
            return;
        }
        
        const profileBar = document.querySelector('#profiles-bar');
        if (!profileBar) {
            this.log.warn('Profiles bar container not found - check HTML structure');
            return;
        }
        
        const environmentsSidebar = document.querySelector('.environments-sidebar');
        if (!environmentsSidebar) {
            this.log.warn('Environments sidebar container not found - check HTML structure');
            return;
        }
        
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            this.log.warn('Main content container not found - check HTML structure');
            return;
        }
        
        try {
            // Initialize Workbook Manager
            this.managers.workbookManager = new WorkbookManager(storage, '#workbooks-bar');
            this.log.debug('WorkbookManager initialized');
        } catch (error) {
            this.log.error('Failed to initialize WorkbookManager', error);
        }
        
        try {
            // Initialize Profile Manager
            this.managers.profileManager = new ProfileManager(storage, '#profiles-bar');
            this.log.debug('ProfileManager initialized');
        } catch (error) {
            this.log.error('Failed to initialize ProfileManager', error);
        }
        
        try {
            // Initialize Environment Manager
            this.managers.environmentManager = new EnvironmentManager(storage, '.environments-sidebar');
            this.log.debug('EnvironmentManager initialized');
        } catch (error) {
            this.log.error('Failed to initialize EnvironmentManager', error);
        }
        
        try {
            // Initialize Link Manager
            this.managers.linkManager = new LinkManager(storage, '.main-content');
            this.log.debug('LinkManager initialized');
        } catch (error) {
            this.log.error('Failed to initialize LinkManager', error);
        }
        
        // Subscribe to storage changes for counter updates
        storage.subscribe(() => {
            this.updateCounters();
        });
        
        this.log.info('All managers initialized', {
            managers: Object.keys(this.managers)
        });
    }

    updateCounters() {
        try {
            const stats = storage.getStats();
            this.log.debug('Updating counters', stats);
            
            const counters = document.querySelectorAll('.counter');
            if (counters.length >= 5) {
                counters[0].textContent = `${stats.workbooks} Workbook${stats.workbooks !== 1 ? 's' : ''}`;
                counters[1].textContent = `${stats.profiles} Profile${stats.profiles !== 1 ? 's' : ''}`;
                counters[2].textContent = `${stats.environments} Environment${stats.environments !== 1 ? 's' : ''}`;
                counters[3].textContent = `${stats.tabs} Tab${stats.tabs !== 1 ? 's' : ''}`;
                counters[4].textContent = `${stats.links} Link${stats.links !== 1 ? 's' : ''}`;
            }
        } catch (error) {
            this.log.error('Failed to update counters', error);
        }
    }

    setupEventListeners() {
        this.log.debug('Setting up global event listeners');
        
        // Global add buttons for workbooks and profiles
        const addWorkbookBtn = document.querySelector('#workbooks-bar .bar-add-btn');
        if (addWorkbookBtn) {
            addWorkbookBtn.addEventListener('click', () => {
                if (this.managers.workbookManager) {
                    this.managers.workbookManager.addWorkbook();
                } else {
                    this.log.warn('WorkbookManager not available');
                }
            });
        }
        
        const addProfileBtn = document.querySelector('#profiles-bar .bar-add-btn');
        if (addProfileBtn) {
            addProfileBtn.addEventListener('click', () => {
                if (this.managers.profileManager) {
                    this.managers.profileManager.addProfile();
                } else {
                    this.log.warn('ProfileManager not available');
                }
            });
        }
        
        const addEnvironmentBtn = document.querySelector('.sidebar-header .add-btn');
        if (addEnvironmentBtn) {
            addEnvironmentBtn.addEventListener('click', () => {
                if (this.managers.environmentManager) {
                    this.managers.environmentManager.addEnvironment();
                } else {
                    this.log.warn('EnvironmentManager not available');
                }
            });
        }
        
        // Add Link button
        const addLinkBtn = document.querySelector('.add-link-btn');
        if (addLinkBtn) {
            addLinkBtn.addEventListener('click', () => {
                if (this.managers.linkManager) {
                    this.managers.linkManager.addLink();
                } else {
                    this.log.warn('LinkManager not available');
                }
            });
        }
        
        // Delete Selected button
        const deleteSelectedBtn = document.querySelector('.delete-selected-btn');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => {
                if (this.managers.linkManager) {
                    this.managers.linkManager.deleteSelectedLinks();
                } else {
                    this.log.warn('LinkManager not available');
                }
            });
        }
        
        // Service buttons
        const cloudBtn = document.querySelector('.service-btn:first-child');
        if (cloudBtn) {
            cloudBtn.addEventListener('click', () => {
                this.log.info('Cloud sync clicked - to be implemented');
                alert('Cloud sync coming soon!');
            });
        }
        
        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.log.debug('Search', { query: e.target.value });
                    // TODO: Implement search
                }, 300);
            });
        }
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    modal.remove();
                }
            }
        });
        
        this.log.debug('Event listeners setup complete');
    }

    showErrorMessage(message) {
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
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }

    destroy() {
        this.log.info('Destroying app');
        Object.values(this.managers).forEach(manager => {
            if (manager.destroy) manager.destroy();
        });
    }
}

// Add animation styles if not present
if (!document.querySelector('#app-animations')) {
    const style = document.createElement('style');
    style.id = 'app-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        startApp();
    });
} else {
    startApp();
}

function startApp() {
    // Initialize logger first
    Logger.init({
        enabled: true,
        level: 'DEBUG',
        showTimestamp: true,
        showComponent: true
    });
    
    // Create and start app
    app = new TabManagerApp();
    app.initialize();
}

// Console helpers
window.debug = {
    logs: () => Logger.getLogHistory(),
    clear: () => Logger.clearHistory(),
    export: () => Logger.exportLogs(),
    level: (level) => {
        Logger.config.level = level;
        Logger.info('Debug', `Log level changed to ${level}`);
    },
    data: () => storage?.getData(),
    stats: () => storage?.getStats(),
    managers: () => app?.managers
};