// js/components/profileManager.js

/**
 * Profile Manager
 * Handles the horizontal bar showing all profiles in the current workbook
 */

class ProfileManager extends ComponentBase {
    constructor(storage, containerSelector) {
        super('ProfileManager');
        this.storage = storage;
        this.container = document.querySelector(containerSelector);
        this.log.info('Initializing');
        
        // Bind methods
        this.render = this.render.bind(this);
        this.handleProfileClick = this.handleProfileClick.bind(this);
        this.addProfile = this.addProfile.bind(this);
        this.deleteProfile = this.deleteProfile.bind(this);
        this.renameProfile = this.renameProfile.bind(this);
        this.showProfileContextMenu = this.showProfileContextMenu.bind(this);
        
        // Wrap with tracing
        this.render = this.createTracedMethod('render', this.render);
        this.handleProfileClick = this.createTracedMethod('handleProfileClick', this.handleProfileClick);
        this.addProfile = this.createTracedMethod('addProfile', this.addProfile);
        
        this.unsubscribe = this.storage.subscribe(() => {
            this.log.debug('Storage changed, re-rendering');
            this.render();
        });
        
        this.render();
    }

    render() {
        this.log.debug('Rendering profiles');
        const data = this.storage.getData();
        const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
        
        if (!this.container) {
            this.log.error('Container not found');
            return;
        }
        
        const barItems = this.container.querySelector('.bar-items');
        if (!barItems) {
            this.log.warn('Bar items container not found');
            return;
        }
        
        barItems.innerHTML = '';
        
        if (!selectedWorkbook || selectedWorkbook.profiles.length === 0) {
            barItems.innerHTML = '<div class="empty-message">No profiles. Click + to create</div>';
            return;
        }
        
        selectedWorkbook.profiles.forEach(profile => {
            const profileElement = this.createProfileElement(profile, profile.id === data.selectedProfileId);
            barItems.appendChild(profileElement);
        });
        
        this.log.debug('Profiles rendered', { 
            workbookId: data.selectedWorkbookId,
            count: selectedWorkbook.profiles.length 
        });
    }

    createProfileElement(profile, isActive) {
        const div = document.createElement('div');
        div.className = `bar-item ${isActive ? 'active' : ''}`;
        div.setAttribute('data-profile-id', profile.id);
        div.innerHTML = `
            <span class="item-icon">👤</span>
            <span class="item-name">${this.escapeHtml(profile.name)}</span>
            <span class="item-badge">${profile.environments.length}</span>
        `;
        
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleProfileClick(profile.id);
        });
        
        div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showProfileContextMenu(e, profile);
        });
        
        return div;
    }

    handleProfileClick(profileId) {
        this.log.event('profileSelected', { profileId });
        const data = this.storage.getData();
        const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
        
        if (selectedWorkbook && data.selectedProfileId !== profileId) {
            data.selectedProfileId = profileId;
            
            // Reset lower-level selections
            const selectedProfile = selectedWorkbook.profiles.find(p => p.id === profileId);
            if (selectedProfile && selectedProfile.environments.length > 0) {
                data.selectedEnvironmentId = selectedProfile.environments[0].id;
                if (selectedProfile.environments[0].tabs.length > 0) {
                    data.selectedTabId = selectedProfile.environments[0].tabs[0].id;
                }
            } else {
                data.selectedEnvironmentId = null;
                data.selectedTabId = null;
            }
            
            this.storage.updateData(data);
            this.log.info('Profile changed', { profileId });
        }
    }

    async addProfile() {
        this.log.event('addProfile');
        
        const data = this.storage.getData();
        const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
        
        if (!selectedWorkbook) {
            this.log.warn('No workbook selected, cannot add profile');
            alert('Please select a workbook first');
            return;
        }
        
        const name = prompt('Enter profile name:', 'New Profile');
        if (!name) {
            this.log.debug('Profile creation cancelled');
            return;
        }
        
        const newProfile = new Profile(null, name);
        selectedWorkbook.profiles.push(newProfile);
        data.selectedProfileId = newProfile.id;
        data.selectedEnvironmentId = null;
        data.selectedTabId = null;
        
        this.storage.updateData(data);
        this.log.info('Profile created', { id: newProfile.id, name });
    }

    deleteProfile(profileId) {
        this.log.event('deleteProfile', { profileId });
        
        const data = this.storage.getData();
        const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
        
        if (!selectedWorkbook) {
            this.log.warn('No workbook found');
            return;
        }
        
        const profileIndex = selectedWorkbook.profiles.findIndex(p => p.id === profileId);
        if (profileIndex === -1) {
            this.log.warn('Profile not found for deletion', { profileId });
            return;
        }
        
        const profileName = selectedWorkbook.profiles[profileIndex].name;
        
        if (confirm(`Delete profile "${profileName}" and all its contents?`)) {
            selectedWorkbook.profiles.splice(profileIndex, 1);
            
            if (data.selectedProfileId === profileId) {
                if (selectedWorkbook.profiles.length > 0) {
                    data.selectedProfileId = selectedWorkbook.profiles[0].id;
                    const newProfile = selectedWorkbook.profiles[0];
                    if (newProfile.environments.length > 0) {
                        data.selectedEnvironmentId = newProfile.environments[0].id;
                        if (newProfile.environments[0].tabs.length > 0) {
                            data.selectedTabId = newProfile.environments[0].tabs[0].id;
                        }
                    }
                } else {
                    data.selectedProfileId = null;
                    data.selectedEnvironmentId = null;
                    data.selectedTabId = null;
                }
            }
            
            this.storage.updateData(data);
            this.log.info('Profile deleted', { profileId, name: profileName });
        }
    }

    showProfileContextMenu(event, profile) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${event.clientX}px;
            top: ${event.clientY}px;
            background-color: #2d2d2d;
            border: 1px solid #4d4d4d;
            border-radius: 4px;
            z-index: 1000;
        `;
        
        menu.innerHTML = `
            <div class="context-item" data-action="rename">✏️ Rename</div>
            <div class="context-item" data-action="delete">🗑️ Delete</div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .context-item {
                padding: 8px 16px;
                cursor: pointer;
                color: #fff;
            }
            .context-item:hover {
                background-color: #3d3d3d;
            }
        `;
        menu.appendChild(style);
        
        menu.querySelector('[data-action="rename"]').addEventListener('click', () => {
            this.renameProfile(profile);
            menu.remove();
        });
        
        menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
            this.deleteProfile(profile.id);
            menu.remove();
        });
        
        document.body.appendChild(menu);
        
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    renameProfile(profile) {
        const newName = prompt('Enter new name:', profile.name);
        if (newName && newName.trim()) {
            profile.name = newName.trim();
            const data = this.storage.getData();
            this.storage.updateData(data);
            this.log.info('Profile renamed', { id: profile.id, newName });
        }
    }

    destroy() {
        this.log.info('Destroying');
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

window.ProfileManager = ProfileManager;