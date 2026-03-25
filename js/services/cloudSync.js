// js/services/cloudSync.js

class CloudSyncService {
    constructor() {
        this.apiUrl = 'https://s.adviced.fvds.ru/api';
        this.token = null;
        this.user = null;
        this.isSyncing = false;
        
        // Load saved token from localStorage
        const savedToken = localStorage.getItem('tabManagerToken');
        const savedUser = localStorage.getItem('tabManagerUser');
        
        if (savedToken && savedUser) {
            this.token = savedToken;
            this.user = JSON.parse(savedUser);
            console.log('CloudSync: Loaded saved session for', this.user?.username);
        }
        
        console.log('CloudSync: Initialized with URL', this.apiUrl);
    }

    isAuthenticated() {
        return !!this.token;
    }

    async register(username, email, password) {
        console.log('CloudSync: Registering user', username);
        
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
            
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('tabManagerToken', this.token);
            localStorage.setItem('tabManagerUser', JSON.stringify(this.user));
            
            console.log('CloudSync: Registration successful');
            return { success: true, user: this.user };
        } catch (error) {
            console.error('CloudSync: Registration failed', error);
            return { success: false, error: error.message };
        }
    }

    async login(username, password) {
        console.log('CloudSync: Logging in', username);
        
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
            
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('tabManagerToken', this.token);
            localStorage.setItem('tabManagerUser', JSON.stringify(this.user));
            
            console.log('CloudSync: Login successful');
            return { success: true, user: this.user };
        } catch (error) {
            console.error('CloudSync: Login failed', error);
            return { success: false, error: error.message };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('tabManagerToken');
        localStorage.removeItem('tabManagerUser');
        console.log('CloudSync: Logged out');
        return { success: true };
    }

    async pushData(data) {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }
        
        this.isSyncing = true;
        console.log('CloudSync: Pushing data...');
        
        try {
            const response = await fetch(`${this.apiUrl}/sync/push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ data })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Push failed');
            }
            
            console.log('CloudSync: Push successful', result);
            return { success: true, version: result.version };
        } catch (error) {
            console.error('CloudSync: Push failed', error);
            return { success: false, error: error.message };
        } finally {
            this.isSyncing = false;
        }
    }

    async pullData() {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }
        
        this.isSyncing = true;
        console.log('CloudSync: Pulling data...');
        
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
                console.log('CloudSync: Pull successful', { version: result.version });
                return { success: true, data: result.data, version: result.version };
            } else {
                console.log('CloudSync: No data on cloud');
                return { success: true, hasData: false };
            }
        } catch (error) {
            console.error('CloudSync: Pull failed', error);
            return { success: false, error: error.message };
        } finally {
            this.isSyncing = false;
        }
    }


    async pushDataWithSummary(data) {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }
        
        this.isSyncing = true;
        console.log('CloudSync: Pushing data with summary...');
        
        // Calculate summary of what's being sent
        const summary = this.calculateDataSummary(data);
        
        try {
            const response = await fetch(`${this.apiUrl}/sync/push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ data })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Push failed');
            }
            
            console.log('CloudSync: Push successful', result);
            return { 
                success: true, 
                version: result.version,
                summary: summary,
                pushed: true
            };
        } catch (error) {
            console.error('CloudSync: Push failed', error);
            return { 
                success: false, 
                error: error.message,
                summary: summary,
                pushed: false
            };
        } finally {
            this.isSyncing = false;
        }
    }

    calculateDataSummary(data) {
        let totalWorkbooks = 0;
        let totalProfiles = 0;
        let totalEnvironments = 0;
        let totalTabs = 0;
        let totalLinks = 0;
        
        if (data.workbooks && Array.isArray(data.workbooks)) {
            totalWorkbooks = data.workbooks.length;
            
            // Loop through ALL workbooks
            data.workbooks.forEach(workbook => {
                if (workbook.profiles && Array.isArray(workbook.profiles)) {
                    totalProfiles += workbook.profiles.length;
                    
                    workbook.profiles.forEach(profile => {
                        if (profile.environments && Array.isArray(profile.environments)) {
                            totalEnvironments += profile.environments.length;
                            
                            profile.environments.forEach(environment => {
                                if (environment.tabs && Array.isArray(environment.tabs)) {
                                    totalTabs += environment.tabs.length;
                                    
                                    environment.tabs.forEach(tab => {
                                        if (tab.links && Array.isArray(tab.links)) {
                                            totalLinks += tab.links.length;
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
        
        return {
            workbooks: totalWorkbooks,
            profiles: totalProfiles,
            environments: totalEnvironments,
            tabs: totalTabs,
            links: totalLinks
        };
    }
}

// Create global instance
window.cloudSync = new CloudSyncService();