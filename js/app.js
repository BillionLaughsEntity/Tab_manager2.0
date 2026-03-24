// js/app.js - Updated

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
            error: (msg, error) => Logger.error('App', msg, error)
        };
        
        this.managers = {};
    }

    async initialize() {
        this.log.info('🚀 Initializing Tab Manager 2.0...');
        
        try {
            // Initialize storage first
            await storage.initialize();
            this.log.info('Storage initialized');
            
            // Update header counters
            this.updateCounters();
            
            // Initialize all UI managers
            this.initializeManagers();
            
            // Set up global event listeners
            this.setupEventListeners();
            
            this.log.info('✅ Tab Manager 2.0 initialized successfully');
            
        } catch (error) {
            this.log.error('Failed to initialize Tab Manager', error);
            this.showErrorMessage('Failed to initialize application. Check console for details.');
        }
    }

    initializeManagers() {
        this.log.debug('Initializing UI managers');
        
        // Workbook Manager (horizontal bar)
        const workbookBar = document.querySelector('#workbooks-bar');
        if (workbookBar) {
            this.managers.workbookManager = new WorkbookManager(storage, '#workbooks-bar');
            this.log.debug('WorkbookManager initialized');
        } else {
            this.log.warn('Workbooks bar container not found');
        }
        
        // Profile Manager (horizontal bar)
        const profileBar = document.querySelector('#profiles-bar');
        if (profileBar) {
            this.managers.profileManager = new ProfileManager(storage, '#profiles-bar');
            this.log.debug('ProfileManager initialized');
        } else {
            this.log.warn('Profiles bar container not found');
        }
        
        // Environment Manager (sidebar)
        const environmentsContainer = document.querySelector('.environments-sidebar');
        if (environmentsContainer) {
            this.managers.environmentManager = new EnvironmentManager(storage, '.environments-sidebar');
            this.log.debug('EnvironmentManager initialized');
        } else {
            this.log.warn('Environments sidebar container not found');
        }
        
        // Link Manager (main area)
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            this.managers.linkManager = new LinkManager(storage, '.main-content');
            this.log.debug('LinkManager initialized');
        } else {
            this.log.warn('Main content container not found');
        }
        
        // Subscribe to storage changes for counter updates
        storage.subscribe(() => {
            this.updateCounters();
        });
    }

    updateCounters() {
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
    }

    setupEventListeners() {
        this.log.debug('Setting up global event listeners');
        
        // Global add buttons for workbooks and profiles
        const addWorkbookBtn = document.querySelector('#workbooks-bar .bar-add-btn');
        if (addWorkbookBtn) {
            addWorkbookBtn.addEventListener('click', () => {
                if (this.managers.workbookManager) {
                    this.managers.workbookManager.addWorkbook();
                }
            });
        }
        
        const addProfileBtn = document.querySelector('#profiles-bar .bar-add-btn');
        if (addProfileBtn) {
            addProfileBtn.addEventListener('click', () => {
                if (this.managers.profileManager) {
                    this.managers.profileManager.addProfile();
                }
            });
        }
        
        const addEnvironmentBtn = document.querySelector('.sidebar-header .add-btn');
        if (addEnvironmentBtn) {
            addEnvironmentBtn.addEventListener('click', () => {
                if (this.managers.environmentManager) {
                    this.managers.environmentManager.addEnvironment();
                }
            });
        }
        
        // Service buttons
        const cloudBtn = document.querySelector('.service-btn:first-child');
        if (cloudBtn) {
            cloudBtn.addEventListener('click', () => {
                this.log.info('Cloud sync clicked - to be implemented');
                // TODO: Implement cloud sync
                alert('Cloud sync coming soon!');
            });
        }
        
        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.log.debug('Search', { query: e.target.value });
                // TODO: Implement search
            });
        }

        // Add Link button
        const addLinkBtn = document.querySelector('.add-link-btn');
        if (addLinkBtn) {
            addLinkBtn.addEventListener('click', () => {
                if (this.managers.linkManager) {
                    this.managers.linkManager.addLink();
                }
            });
        }

        // Delete Selected button
        const deleteSelectedBtn = document.querySelector('.delete-selected-btn');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => {
                if (this.managers.linkManager) {
                    this.managers.linkManager.deleteSelectedLinks();
                }
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
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    destroy() {
        this.log.info('Destroying app');
        Object.values(this.managers).forEach(manager => {
            if (manager.destroy) manager.destroy();
        });
    }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
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
});

// Console helpers
window.debug = {
    logs: () => Logger.getLogHistory(),
    clear: () => Logger.clearHistory(),
    export: () => Logger.exportLogs(),
    level: (level) => {
        Logger.config.level = level;
        Logger.info('Debug', `Log level changed to ${level}`);
    },
    data: () => storage.getData(),
    stats: () => storage.getStats()
};