// js/components/environmentManager.js

/**
 * Environment Manager
 * Handles the sidebar showing environments with their nested tabs
 * Supports expand/collapse, selection, and CRUD operations
 */

class EnvironmentManager extends ComponentBase {
    constructor(storage, containerSelector) {
        super('EnvironmentManager');
        this.storage = storage;
        this.container = document.querySelector(containerSelector);
        this.onTabSelected = null;
        this.log.info('Initializing');
        
        this.render = this.createTracedMethod('render', this.render.bind(this));
        this.handleEnvironmentToggle = this.createTracedMethod('handleEnvironmentToggle', this.handleEnvironmentToggle.bind(this));
        this.handleTabClick = this.createTracedMethod('handleTabClick', this.handleTabClick.bind(this));
        this.addEnvironment = this.createTracedMethod('addEnvironment', this.addEnvironment.bind(this));
        this.addTab = this.createTracedMethod('addTab', this.addTab.bind(this));
        
        this.unsubscribe = this.storage.subscribe(() => {
            this.log.debug('Storage changed, re-rendering');
            this.render();
        });
        
        this.render();
    }

    render() {
        this.log.debug('Rendering environments');
        const data = this.storage.getData();
        const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
        const selectedProfile = selectedWorkbook?.profiles.find(p => p.id === data.selectedProfileId);
        
        if (!this.container) {
            this.log.error('Container not found');
            return;
        }
        
        const environmentsContainer = this.container.querySelector('.environments-container');
        if (!environmentsContainer) {
            this.log.warn('Environments container not found');
            return;
        }
        
        environmentsContainer.innerHTML = '';
        
        if (!selectedProfile || selectedProfile.environments.length === 0) {
            environmentsContainer.innerHTML = '<div class="empty-message">No environments. Click + to create</div>';
            return;
        }
        
        selectedProfile.environments.forEach(environment => {
            const envElement = this.createEnvironmentElement(environment, data);
            environmentsContainer.appendChild(envElement);
        });
        
        this.log.debug('Environments rendered', { 
            profileId: data.selectedProfileId,
            count: selectedProfile.environments.length 
        });
    }

    createEnvironmentElement(environment, data) {
        const envDiv = document.createElement('div');
        envDiv.className = `environment-item ${environment.isExpanded ? 'expanded' : ''}`;
        envDiv.setAttribute('data-environment-id', environment.id);
        
        const isActive = environment.id === data.selectedEnvironmentId;
        
        // Environment header
        const header = document.createElement('div');
        header.className = 'env-header';
        header.innerHTML = `
            <span class="collapse-icon">${environment.isExpanded ? '▼' : '▶'}</span>
            <span class="env-icon">🌍</span>
            <span class="env-name">${this.escapeHtml(environment.name)}</span>
            <span class="env-count">${environment.tabs.length}</span>
            <button class="env-menu">⋯</button>
        `;
        
        // Toggle collapse/expand
        header.querySelector('.collapse-icon').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleEnvironmentToggle(environment);
        });
        
        // Environment menu button
        header.querySelector('.env-menu').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEnvironmentContextMenu(e, environment);
        });
        
        // Click on header (but not on buttons) to select environment
        header.addEventListener('click', (e) => {
            if (e.target.classList.contains('env-menu') || e.target.classList.contains('collapse-icon')) {
                return;
            }
            this.handleEnvironmentClick(environment.id);
        });
        
        envDiv.appendChild(header);
        
        // Tabs container (if expanded)
        if (environment.isExpanded) {
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'tabs-container';
            
            environment.tabs.forEach(tab => {
                const tabElement = this.createTabElement(tab, tab.id === data.selectedTabId);
                tabsContainer.appendChild(tabElement);
            });
            
            // Add tab button
            const addTabBtn = document.createElement('button');
            addTabBtn.className = 'add-tab-btn';
            addTabBtn.innerHTML = '+ Add Tab';
            addTabBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addTab(environment.id);
            });
            tabsContainer.appendChild(addTabBtn);
            
            envDiv.appendChild(tabsContainer);
        }
        
        return envDiv;
    }

    createTabElement(tab, isActive) {
        const tabDiv = document.createElement('div');
        tabDiv.className = `tab-item ${isActive ? 'active' : ''}`;
        tabDiv.setAttribute('data-tab-id', tab.id);
        tabDiv.innerHTML = `
            <span class="tab-icon">📁</span>
            <span class="tab-name">${this.escapeHtml(tab.name)}</span>
            ${tab.links.length > 0 ? `<span class="tab-count">${tab.links.length}</span>` : ''}
        `;
        
        tabDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleTabClick(tab.id);
        });
        
        tabDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showTabContextMenu(e, tab);
        });
        
        return tabDiv;
    }

    handleEnvironmentToggle(environment) {
        this.log.event('environmentToggle', { environmentId: environment.id, wasExpanded: environment.isExpanded });
        environment.toggleExpand();
        const data = this.storage.getData();
        this.storage.updateData(data);
    }

    handleEnvironmentClick(environmentId) {
        this.log.event('environmentSelected', { environmentId });
        const data = this.storage.getData();
        
        if (data.selectedEnvironmentId !== environmentId) {
            data.selectedEnvironmentId = environmentId;
            
            // Reset tab selection
            const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
            const selectedProfile = selectedWorkbook?.profiles.find(p => p.id === data.selectedProfileId);
            const selectedEnvironment = selectedProfile?.environments.find(e => e.id === environmentId);
            
            if (selectedEnvironment && selectedEnvironment.tabs.length > 0) {
                data.selectedTabId = selectedEnvironment.tabs[0].id;
            } else {
                data.selectedTabId = null;
            }
            
            this.storage.updateData(data);
        }
    }

    handleTabClick(tabId) {
        this.log.event('tabSelected', { tabId });
        const data = this.storage.getData();
        
        if (data.selectedTabId !== tabId) {
            data.selectedTabId = tabId;
            this.storage.updateData(data);
            this.log.info('Tab changed', { tabId });
        }
    }

    async addEnvironment() {
        this.log.event('addEnvironment');
        
        const data = this.storage.getData();
        const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
        const selectedProfile = selectedWorkbook?.profiles.find(p => p.id === data.selectedProfileId);
        
        if (!selectedProfile) {
            this.log.warn('No profile selected, cannot add environment');
            alert('Please select a profile first');
            return;
        }
        
        const name = prompt('Enter environment name:', 'New Environment');
        if (!name) {
            this.log.debug('Environment creation cancelled');
            return;
        }
        
        const newEnvironment = new Environment(null, name);
        selectedProfile.environments.push(newEnvironment);
        data.selectedEnvironmentId = newEnvironment.id;
        data.selectedTabId = null;
        
        this.storage.updateData(data);
        this.log.info('Environment created', { id: newEnvironment.id, name });
    }

    async addTab(environmentId) {
        this.log.event('addTab', { environmentId });
        
        const data = this.storage.getData();
        const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
        const selectedProfile = selectedWorkbook?.profiles.find(p => p.id === data.selectedProfileId);
        const environment = selectedProfile?.environments.find(e => e.id === environmentId);
        
        if (!environment) {
            this.log.warn('Environment not found', { environmentId });
            return;
        }
        
        const name = prompt('Enter tab name:', 'New Tab');
        if (!name) {
            this.log.debug('Tab creation cancelled');
            return;
        }
        
        const newTab = new Tab(null, name);
        environment.tabs.push(newTab);
        data.selectedTabId = newTab.id;
        
        this.storage.updateData(data);
        this.log.info('Tab created', { id: newTab.id, name, environmentId });
    }

    deleteEnvironment(environmentId) {
        this.log.event('deleteEnvironment', { environmentId });
        
        const data = this.storage.getData();
        const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
        const selectedProfile = selectedWorkbook?.profiles.find(p => p.id === data.selectedProfileId);
        
        if (!selectedProfile) return;
        
        const envIndex = selectedProfile.environments.findIndex(e => e.id === environmentId);
        if (envIndex === -1) return;
        
        const envName = selectedProfile.environments[envIndex].name;
        
        if (confirm(`Delete environment "${envName}" and all its tabs?`)) {
            selectedProfile.environments.splice(envIndex, 1);
            
            if (data.selectedEnvironmentId === environmentId) {
                if (selectedProfile.environments.length > 0) {
                    data.selectedEnvironmentId = selectedProfile.environments[0].id;
                    if (selectedProfile.environments[0].tabs.length > 0) {
                        data.selectedTabId = selectedProfile.environments[0].tabs[0].id;
                    }
                } else {
                    data.selectedEnvironmentId = null;
                    data.selectedTabId = null;
                }
            }
            
            this.storage.updateData(data);
            this.log.info('Environment deleted', { environmentId, name: envName });
        }
    }

    deleteTab(tabId, environmentId) {
        this.log.event('deleteTab', { tabId, environmentId });
        
        const data = this.storage.getData();
        const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
        const selectedProfile = selectedWorkbook?.profiles.find(p => p.id === data.selectedProfileId);
        const environment = selectedProfile?.environments.find(e => e.id === environmentId);
        
        if (!environment) return;
        
        const tabIndex = environment.tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;
        
        const tabName = environment.tabs[tabIndex].name;
        
        if (confirm(`Delete tab "${tabName}"?`)) {
            environment.tabs.splice(tabIndex, 1);
            
            if (data.selectedTabId === tabId) {
                if (environment.tabs.length > 0) {
                    data.selectedTabId = environment.tabs[0].id;
                } else {
                    data.selectedTabId = null;
                }
            }
            
            this.storage.updateData(data);
            this.log.info('Tab deleted', { tabId, name: tabName });
        }
    }

    showEnvironmentContextMenu(event, environment) {
        const menu = this.createContextMenu([
            { action: 'rename', label: '✏️ Rename', handler: () => this.renameEnvironment(environment) },
            { action: 'delete', label: '🗑️ Delete', handler: () => this.deleteEnvironment(environment.id) }
        ]);
        
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        document.body.appendChild(menu);
    }

    showTabContextMenu(event, tab) {
        const environmentId = event.target.closest('.environment-item')?.getAttribute('data-environment-id');
        
        const menu = this.createContextMenu([
            { action: 'rename', label: '✏️ Rename', handler: () => this.renameTab(tab, environmentId) },
            { action: 'delete', label: '🗑️ Delete', handler: () => this.deleteTab(tab.id, environmentId) }
        ]);
        
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        document.body.appendChild(menu);
    }

    createContextMenu(items) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            background-color: #2d2d2d;
            border: 1px solid #4d4d4d;
            border-radius: 4px;
            z-index: 1000;
        `;
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'context-item';
            div.textContent = item.label;
            div.style.cssText = 'padding: 8px 16px; cursor: pointer; color: #fff;';
            div.addEventListener('mouseenter', () => div.style.backgroundColor = '#3d3d3d');
            div.addEventListener('mouseleave', () => div.style.backgroundColor = 'transparent');
            div.addEventListener('click', () => {
                item.handler();
                menu.remove();
            });
            menu.appendChild(div);
        });
        
        // Click outside to close
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
        
        return menu;
    }

    renameEnvironment(environment) {
        const newName = prompt('Enter new name:', environment.name);
        if (newName && newName.trim()) {
            environment.name = newName.trim();
            const data = this.storage.getData();
            this.storage.updateData(data);
            this.log.info('Environment renamed', { id: environment.id, newName });
        }
    }

    renameTab(tab, environmentId) {
        const newName = prompt('Enter new name:', tab.name);
        if (newName && newName.trim()) {
            tab.name = newName.trim();
            const data = this.storage.getData();
            this.storage.updateData(data);
            this.log.info('Tab renamed', { id: tab.id, newName });
        }
    }

    destroy() {
        this.log.info('Destroying');
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

window.EnvironmentManager = EnvironmentManager;