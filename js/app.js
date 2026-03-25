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
                if (window.cloudSync && window.cloudSync.isAuthenticated()) {
                    this.showSyncOptions();
                } else if (window.cloudSync) {
                    this.showAuthModal();
                } else {
                    console.error('CloudSync not loaded');
                }
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

    showSyncOptions() {
        // Show a simple sync menu
        const options = confirm(
            `Logged in as: ${cloudSync.user?.username}\n\n` +
            `Options:\n` +
            `• OK = Sync now\n` +
            `• Cancel = Logout`
        );
        
        if (options) {
            this.syncWithCloud();
        } else {
            this.logoutAndSync();
        }
    }

    async syncWithCloud() {
        this.log.info('Syncing with cloud...');
        
        // Show syncing status
        const statusMsg = document.createElement('div');
        statusMsg.textContent = '🔄 Syncing...';
        statusMsg.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #094771; color: white; padding: 10px 20px; border-radius: 8px; z-index: 10000;';
        document.body.appendChild(statusMsg);
        
        const data = storage.getData();
        const result = await window.cloudSync.pushDataWithSummary(data);
        
        statusMsg.remove();
        
        if (result.success) {
            // Show detailed success message
            const summary = result.summary;
            const message = [
                '✅ Cloud Sync Successful!',
                '',
                '📊 Uploaded:',
                `   📚 Workbooks: ${summary.workbooks}`,
                `   👤 Profiles: ${summary.profiles}`,
                `   🌍 Environments: ${summary.environments}`,
                `   📑 Tabs: ${summary.tabs}`,
                `   🔗 Links: ${summary.links}`,
                '',
                `📌 Version: ${result.version}`,
                `🕐 Last sync: ${new Date().toLocaleString()}`
            ].join('\n');
            
            alert(message);
            this.log.info('Sync completed', { version: result.version, summary });
        } else {
            // Show detailed error message
            const summary = result.summary || { workbooks: 0, profiles: 0, environments: 0, tabs: 0, links: 0 };
            const message = [
                '❌ Cloud Sync Failed!',
                '',
                '📊 Attempted to upload:',
                `   📚 Workbooks: ${summary.workbooks}`,
                `   👤 Profiles: ${summary.profiles}`,
                `   🌍 Environments: ${summary.environments}`,
                `   📑 Tabs: ${summary.tabs}`,
                `   🔗 Links: ${summary.links}`,
                '',
                `Error: ${result.error}`,
                '',
                '💡 Tip: Check your internet connection and try again.'
            ].join('\n');
            
            alert(message);
            this.log.error('Sync failed', result.error);
        }
    }

    async pullFromCloud() {
        this.log.info('Pulling from cloud...');
        
        const statusMsg = document.createElement('div');
        statusMsg.textContent = '🔄 Pulling from cloud...';
        statusMsg.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #094771; color: white; padding: 10px 20px; border-radius: 8px; z-index: 10000;';
        document.body.appendChild(statusMsg);
        
        const result = await window.cloudSync.pullData();
        statusMsg.remove();
        
        if (result.success && result.hasData) {
            const summary = this.calculateSummaryFromData(result.data);
            const message = [
                '✅ Data Pulled Successfully!',
                '',
                '📊 Downloaded from cloud:',
                `   📚 Workbooks: ${summary.workbooks}`,
                `   👤 Profiles: ${summary.profiles}`,
                `   🌍 Environments: ${summary.environments}`,
                `   📑 Tabs: ${summary.tabs}`,
                `   🔗 Links: ${summary.links}`,
                '',
                '🔄 Reloading data...'
            ].join('\n');
            
            alert(message);
            
            // Update local data with cloud data
            const currentData = storage.getData();
            currentData.workbooks = result.data.workbooks;
            currentData.selectedWorkbookId = result.data.selectedWorkbookId;
            currentData.selectedProfileId = result.data.selectedProfileId;
            currentData.selectedEnvironmentId = result.data.selectedEnvironmentId;
            currentData.selectedTabId = result.data.selectedTabId;
            storage.updateData(currentData);
            
            this.log.info('Pull completed', { summary });
        } else if (result.success && !result.hasData) {
            alert('No data found on cloud. Push your local data first!');
        } else {
            alert(`❌ Pull failed: ${result.error}`);
            this.log.error('Pull failed', result.error);
        }
    }

    calculateSummaryFromData(data) {
        let summary = { workbooks: 0, profiles: 0, environments: 0, tabs: 0, links: 0 };
        
        if (data.workbooks) {
            summary.workbooks = data.workbooks.length;
            data.workbooks.forEach(workbook => {
                if (workbook.profiles) {
                    summary.profiles += workbook.profiles.length;
                    workbook.profiles.forEach(profile => {
                        if (profile.environments) {
                            summary.environments += profile.environments.length;
                            profile.environments.forEach(env => {
                                if (env.tabs) {
                                    summary.tabs += env.tabs.length;
                                    env.tabs.forEach(tab => {
                                        if (tab.links) summary.links += tab.links.length;
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
        return summary;
    }

    async logoutAndSync() {
        if (confirm('Logout from cloud?')) {
            cloudSync.logout();
            alert('Logged out');
            this.log.info('User logged out');
        }
    }

    /**
 * Show authentication modal
 */
showAuthModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal auth-modal">
            <div class="modal-header">
                <h3>Tab Manager Cloud Sync</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Login</button>
                    <button class="auth-tab" data-tab="register">Register</button>
                </div>
                
                <div class="auth-panel active" id="login-panel">
                    <div class="form-group">
                        <label>Username or Email</label>
                        <input type="text" id="login-username" placeholder="Enter username or email">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="login-password" placeholder="Enter password">
                    </div>
                    <button id="login-btn" class="modal-btn save">Login</button>
                </div>
                
                <div class="auth-panel" id="register-panel">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="reg-username" placeholder="Choose a username">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="reg-email" placeholder="Your email address">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="reg-password" placeholder="Choose a password">
                    </div>
                    <div class="form-group">
                        <label>Confirm Password</label>
                        <input type="password" id="reg-confirm" placeholder="Confirm password">
                    </div>
                    <button id="register-btn" class="modal-btn save">Register</button>
                </div>
                
                <div id="auth-status" class="auth-status"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Tab switching
    const tabs = modal.querySelectorAll('.auth-tab');
    const panels = modal.querySelectorAll('.auth-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            modal.querySelector(`#${tab.dataset.tab}-panel`).classList.add('active');
        });
    });
    
    // Login handler
    modal.querySelector('#login-btn').addEventListener('click', async () => {
        const username = modal.querySelector('#login-username').value;
        const password = modal.querySelector('#login-password').value;
        const statusDiv = modal.querySelector('#auth-status');
        
        statusDiv.textContent = 'Logging in...';
        statusDiv.style.color = '#007acc';
        
        const result = await cloudSync.login(username, password);
        
        if (result.success) {
            statusDiv.textContent = 'Login successful! Syncing...';
            statusDiv.style.color = '#4caf50';
            
            // Pull data from cloud
            const pullResult = await cloudSync.pullData();
            
            if (pullResult.success && pullResult.hasData) {
                // Update local data with cloud data
                const data = storage.getData();
                data.workbooks = pullResult.data.workbooks;
                data.selectedWorkbookId = pullResult.data.selectedWorkbookId;
                data.selectedProfileId = pullResult.data.selectedProfileId;
                data.selectedEnvironmentId = pullResult.data.selectedEnvironmentId;
                data.selectedTabId = pullResult.data.selectedTabId;
                storage.updateData(data);
                
                statusDiv.textContent = 'Sync complete!';
            }
            
            setTimeout(() => modal.remove(), 1500);
        } else {
            statusDiv.textContent = `Error: ${result.error}`;
            statusDiv.style.color = '#f44336';
        }
    });
    
    // Register handler
    modal.querySelector('#register-btn').addEventListener('click', async () => {
        const username = modal.querySelector('#reg-username').value;
        const email = modal.querySelector('#reg-email').value;
        const password = modal.querySelector('#reg-password').value;
        const confirm = modal.querySelector('#reg-confirm').value;
        const statusDiv = modal.querySelector('#auth-status');
        
        if (password !== confirm) {
            statusDiv.textContent = 'Passwords do not match';
            statusDiv.style.color = '#f44336';
            return;
        }
        
        if (password.length < 6) {
            statusDiv.textContent = 'Password must be at least 6 characters';
            statusDiv.style.color = '#f44336';
            return;
        }
        
        statusDiv.textContent = 'Creating account...';
        statusDiv.style.color = '#007acc';
        
        const result = await cloudSync.register(username, email, password);
        
        if (result.success) {
            statusDiv.textContent = 'Account created! Syncing...';
            statusDiv.style.color = '#4caf50';
            
            // Push local data to cloud
            const localData = storage.getData();
            const pushResult = await cloudSync.pushData(localData, 1);
            
            if (pushResult.success) {
                statusDiv.textContent = 'Sync complete!';
            }
            
            setTimeout(() => modal.remove(), 1500);
        } else {
            statusDiv.textContent = `Error: ${result.error}`;
            statusDiv.style.color = '#f44336';
        }
    });
    
    // Close button
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    
    // Escape key
    const closeHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeHandler);
        }
    };
    document.addEventListener('keydown', closeHandler);
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