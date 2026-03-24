// js/services/cloudSync.js

/**
 * Cloud Sync Service
 * Handles synchronization with the VPS backend
 */

class CloudSyncService {
    constructor() {
        this.apiUrl = 'https://s.adviced.fvds.ru/api'; // Replace with your VPS IP
        this.token = null;
        this.user = null;
        this.isSyncing = false;
        this.loadSavedToken();
        this.log = {
            info: (msg, data) => Logger.info('CloudSync', msg, data),
            debug: (msg, data) => Logger.debug('CloudSync', msg, data),
            error: (msg, error) => Logger.error('CloudSync', msg, error),
            warn: (msg, data) => Logger.warn('CloudSync', msg, data)
        };
        
        // Load saved token from localStorage
        this.loadSavedToken();
    }

    /**
     * Load saved authentication token
     */
    loadSavedToken() {
        const savedToken = localStorage.getItem('tabManagerToken');
        const savedUser = localStorage.getItem('tabManagerUser');
        
        if (savedToken && savedUser) {
            this.token = savedToken;
            this.user = JSON.parse(savedUser);
            this.log.info('Loaded saved authentication');
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Register a new user
     */
    async register(username, email, password) {
        this.log.debug('Registering user', { username, email });
        
        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            
            // Save token and user info
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('tabManagerToken', this.token);
            localStorage.setItem('tabManagerUser', JSON.stringify(this.user));
            
            this.log.info('User registered successfully', { userId: this.user.id });
            return { success: true, user: this.user };
            
        } catch (error) {
            this.log.error('Registration failed', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Login user
     */
    async login(username, password) {
        this.log.debug('Logging in', { username });
        
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            // Save token and user info
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('tabManagerToken', this.token);
            localStorage.setItem('tabManagerUser', JSON.stringify(this.user));
            
            this.log.info('User logged in successfully', { userId: this.user.id });
            return { success: true, user: this.user };
            
        } catch (error) {
            this.log.error('Login failed', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('tabManagerToken');
        localStorage.removeItem('tabManagerUser');
        this.log.info('User logged out');
        return { success: true };
    }

    /**
     * Push local data to cloud
     */
    async pushData(data, version = null) {
        if (!this.isAuthenticated()) {
            this.log.warn('Not authenticated, cannot push');
            return { success: false, error: 'Not authenticated' };
        }
        
        if (this.isSyncing) {
            this.log.warn('Sync already in progress');
            return { success: false, error: 'Sync in progress' };
        }
        
        this.isSyncing = true;
        this.log.debug('Pushing data to cloud');
        
        try {
            const response = await fetch(`${this.apiUrl}/sync/push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ data, version })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Push failed');
            }
            
            this.log.info('Data pushed successfully', { version: result.version });
            return { success: true, version: result.version, lastSync: result.lastSync };
            
        } catch (error) {
            this.log.error('Push failed', error);
            return { success: false, error: error.message };
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Pull data from cloud
     */
    async pullData() {
        if (!this.isAuthenticated()) {
            this.log.warn('Not authenticated, cannot pull');
            return { success: false, error: 'Not authenticated' };
        }
        
        if (this.isSyncing) {
            this.log.warn('Sync already in progress');
            return { success: false, error: 'Sync in progress' };
        }
        
        this.isSyncing = true;
        this.log.debug('Pulling data from cloud');
        
        try {
            const response = await fetch(`${this.apiUrl}/sync/pull`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Pull failed');
            }
            
            if (result.hasData) {
                this.log.info('Data pulled successfully', { 
                    version: result.version, 
                    lastSync: result.lastSync 
                });
                return { 
                    success: true, 
                    data: result.data, 
                    version: result.version,
                    lastSync: result.lastSync
                };
            } else {
                this.log.info('No data found on cloud');
                return { success: true, hasData: false };
            }
            
        } catch (error) {
            this.log.error('Pull failed', error);
            return { success: false, error: error.message };
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Full sync (pull then push if needed)
     */
    async fullSync(localData, localVersion) {
        this.log.debug('Starting full sync');
        
        // First pull to get latest cloud data
        const pullResult = await this.pullData();
        
        if (!pullResult.success) {
            return { success: false, error: pullResult.error };
        }
        
        if (!pullResult.hasData) {
            // No cloud data, push local data
            const pushResult = await this.pushData(localData, 1);
            return { 
                success: pushResult.success, 
                synced: true,
                action: 'push',
                ...pushResult 
            };
        }
        
        // Compare versions
        if (pullResult.version > localVersion) {
            // Cloud is newer, use cloud data
            this.log.info('Cloud data is newer, using cloud version');
            return { 
                success: true, 
                synced: true,
                action: 'pull',
                data: pullResult.data,
                version: pullResult.version
            };
        } else if (localVersion > pullResult.version) {
            // Local is newer, push to cloud
            const pushResult = await this.pushData(localData, localVersion);
            return { 
                success: pushResult.success, 
                synced: true,
                action: 'push',
                ...pushResult 
            };
        } else {
            // Versions match, no sync needed
            this.log.debug('Already in sync');
            return { 
                success: true, 
                synced: false,
                message: 'Already in sync'
            };
        }
    }

    /**
     * Get sync history
     */
    async getSyncHistory() {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/sync/history`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to get history');
            }
            
            return { success: true, history: result.history };
            
        } catch (error) {
            this.log.error('Failed to get sync history', error);
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
const cloudSync = new CloudSyncService();
window.cloudSync = cloudSync;