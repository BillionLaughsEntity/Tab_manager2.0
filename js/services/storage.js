// js/services/storage.js

/**
 * Storage Service - Handles all data persistence
 * Uses localStorage for now, can be upgraded to IndexedDB later
 */

class StorageService {
    constructor() {
        this.storageKey = 'tabManagerData';
        this.data = null;
        this.listeners = [];
        this.log = {
            debug: (msg, data) => Logger.debug('Storage', msg, data),
            info: (msg, data) => Logger.info('Storage', msg, data),
            warn: (msg, data) => Logger.warn('Storage', msg, data),
            error: (msg, error) => Logger.error('Storage', msg, error)
        };
    }

    /**
     * Initialize storage - load existing or create default
     */
    async initialize() {
        this.log.info('Initializing storage');
        
        const savedData = this.loadFromLocalStorage();
        
        if (savedData && savedData.workbooks && savedData.workbooks.length > 0) {
            this.log.info('Loaded existing data from localStorage', {
                workbooks: savedData.workbooks.length
            });
            this.data = this.hydrateData(savedData);
        } else {
            this.log.info('No existing data found, creating sample data');
            this.data = {
                workbooks: SampleDataGenerator.generate(),
                selectedWorkbookId: null,
                selectedProfileId: null,
                selectedEnvironmentId: null,
                selectedTabId: null,
                lastUpdated: new Date().toISOString()
            };
            
            // Set defaults
            if (this.data.workbooks.length > 0) {
                this.data.selectedWorkbookId = this.data.workbooks[0].id;
                if (this.data.workbooks[0].profiles.length > 0) {
                    this.data.selectedProfileId = this.data.workbooks[0].profiles[0].id;
                    if (this.data.workbooks[0].profiles[0].environments.length > 0) {
                        this.data.selectedEnvironmentId = this.data.workbooks[0].profiles[0].environments[0].id;
                        if (this.data.workbooks[0].profiles[0].environments[0].tabs.length > 0) {
                            this.data.selectedTabId = this.data.workbooks[0].profiles[0].environments[0].tabs[0].id;
                        }
                    }
                }
            }
            
            this.saveToLocalStorage();
        }
        
        this.log.info('Storage initialized successfully');
        return this.data;
    }

    /**
     * Load data from localStorage
     */
    loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (error) {
            this.log.error('Failed to load from localStorage', error);
        }
        return null;
    }

    /**
     * Save data to localStorage
     */
    saveToLocalStorage() {
        try {
            const serialized = JSON.stringify(this.data, (key, value) => {
                // Skip functions and circular references
                if (typeof value === 'function') return undefined;
                return value;
            });
            localStorage.setItem(this.storageKey, serialized);
            this.log.debug('Data saved to localStorage');
            this.notifyListeners();
        } catch (error) {
            this.log.error('Failed to save to localStorage', error);
        }
    }

    /**
     * Hydrate plain data back into class instances
     */
    hydrateData(savedData) {
        const hydratedWorkbooks = savedData.workbooks.map(wbData => {
            const profiles = (wbData.profiles || []).map(profileData => {
                const environments = (profileData.environments || []).map(envData => {
                    const tabs = (envData.tabs || []).map(tabData => {
                        const links = (tabData.links || []).map(linkData => 
                            new Link(linkData.id, linkData.name, linkData.url, linkData.description)
                        );
                        return new Tab(tabData.id, tabData.name, links);
                    });
                    const env = new Environment(envData.id, envData.name, tabs);
                    env.isExpanded = envData.isExpanded !== undefined ? envData.isExpanded : true;
                    return env;
                });
                return new Profile(profileData.id, profileData.name, environments);
            });
            return new Workbook(wbData.id, wbData.name, profiles);
        });
        
        return {
            workbooks: hydratedWorkbooks,
            selectedWorkbookId: savedData.selectedWorkbookId,
            selectedProfileId: savedData.selectedProfileId,
            selectedEnvironmentId: savedData.selectedEnvironmentId,
            selectedTabId: savedData.selectedTabId,
            lastUpdated: savedData.lastUpdated || new Date().toISOString()
        };
    }

    /**
     * Get current data
     */
    getData() {
        return this.data;
    }

    /**
     * Update entire data set
     */
    updateData(newData) {
        this.data = newData;
        this.data.lastUpdated = new Date().toISOString();
        this.saveToLocalStorage();
        return this.data;
    }

    /**
     * Subscribe to data changes
     */
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index !== -1) this.listeners.splice(index, 1);
        };
    }

    /**
     * Notify all listeners of data change
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.data);
            } catch (error) {
                this.log.error('Listener error', error);
            }
        });
    }

    /**
     * Get specific workbook
     */
    getWorkbook(workbookId) {
        return this.data.workbooks.find(w => w.id === workbookId);
    }

    /**
     * Get specific profile
     */
    getProfile(workbookId, profileId) {
        const workbook = this.getWorkbook(workbookId);
        return workbook?.profiles.find(p => p.id === profileId);
    }

    /**
     * Get specific environment
     */
    getEnvironment(workbookId, profileId, environmentId) {
        const profile = this.getProfile(workbookId, profileId);
        return profile?.environments.find(e => e.id === environmentId);
    }

    /**
     * Get specific tab
     */
    getTab(workbookId, profileId, environmentId, tabId) {
        const environment = this.getEnvironment(workbookId, profileId, environmentId);
        return environment?.tabs.find(t => t.id === tabId);
    }

    /**
     * Get current selection
     */
    getCurrentSelection() {
        return {
            workbook: this.getWorkbook(this.data.selectedWorkbookId),
            profile: this.getProfile(this.data.selectedWorkbookId, this.data.selectedProfileId),
            environment: this.getEnvironment(this.data.selectedWorkbookId, this.data.selectedProfileId, this.data.selectedEnvironmentId),
            tab: this.getTab(this.data.selectedWorkbookId, this.data.selectedProfileId, this.data.selectedEnvironmentId, this.data.selectedTabId)
        };
    }

    /**
     * Get statistics for header counters
     */
    getStats() {
        const workbooks = this.data.workbooks;
        const selectedWorkbook = this.getWorkbook(this.data.selectedWorkbookId);
        
        return {
            workbooks: workbooks.length,
            profiles: selectedWorkbook?.profiles.length || 0,
            environments: selectedWorkbook?.getTotalEnvironmentCount() || 0,
            tabs: selectedWorkbook?.getTotalTabCount() || 0,
            links: selectedWorkbook?.getTotalLinkCount() || 0
        };
    }
}

// Create singleton instance
const storage = new StorageService();
window.storage = storage;