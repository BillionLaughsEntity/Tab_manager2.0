// js/components/linkManager.js

/**
 * Link Manager
 * Handles the main area showing links for the selected tab
 * Manages link creation, editing, deletion, and viewing
 */

class LinkManager extends ComponentBase {
    constructor(storage, containerSelector) {
        super('LinkManager');
        this.storage = storage;
        this.container = document.querySelector(containerSelector);
        this.selectedLinks = new Set(); // For multi-select functionality
        this.lastClickedLinkId = null; // For shift+click range selection
        this.log.info('Initializing');
        
        // Bind methods manually (don't use createTracedMethod for constructor)
        this.render = this.render.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        this.addLink = this.addLink.bind(this);
        this.editLink = this.editLink.bind(this);
        this.deleteLink = this.deleteLink.bind(this);
        this.deleteSelectedLinks = this.deleteSelectedLinks.bind(this);
        this.openLink = this.openLink.bind(this);
        this.toggleLinkSelection = this.toggleLinkSelection.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.updateSelectionStatus = this.updateSelectionStatus.bind(this);
        this.showLinkDialog = this.showLinkDialog.bind(this);
        this.getCurrentTab = this.getCurrentTab.bind(this);
        this.getCurrentContext = this.getCurrentContext.bind(this);
        
        // Now wrap methods with tracing after they're bound
        this.render = this.createTracedMethod('render', this.render);
        this.addLink = this.createTracedMethod('addLink', this.addLink);
        this.editLink = this.createTracedMethod('editLink', this.editLink);
        this.deleteLink = this.createTracedMethod('deleteLink', this.deleteLink);
        this.deleteSelectedLinks = this.createTracedMethod('deleteSelectedLinks', this.deleteSelectedLinks);
        this.openLink = this.createTracedMethod('openLink', this.openLink);
        
        // Subscribe to storage changes
        this.unsubscribe = this.storage.subscribe(() => {
            this.log.debug('Storage changed, re-rendering');
            this.render();
        });
        
        // Initial render
        this.render();
    }

    /**
     * Get current selected tab and its links
     */
    getCurrentTab() {
        const data = this.storage.getData();
        const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
        if (!selectedWorkbook) return null;
        
        const selectedProfile = selectedWorkbook.profiles.find(p => p.id === data.selectedProfileId);
        if (!selectedProfile) return null;
        
        const selectedEnvironment = selectedProfile.environments.find(e => e.id === data.selectedEnvironmentId);
        if (!selectedEnvironment) return null;
        
        const selectedTab = selectedEnvironment.tabs.find(t => t.id === data.selectedTabId);
        return selectedTab;
    }

    /**
     * Get current environment and profile for context
     */
    getCurrentContext() {
        const data = this.storage.getData();
        const selectedWorkbook = data.workbooks.find(w => w.id === data.selectedWorkbookId);
        if (!selectedWorkbook) return null;
        
        const selectedProfile = selectedWorkbook.profiles.find(p => p.id === data.selectedProfileId);
        if (!selectedProfile) return null;
        
        const selectedEnvironment = selectedProfile.environments.find(e => e.id === data.selectedEnvironmentId);
        
        return {
            workbook: selectedWorkbook,
            profile: selectedProfile,
            environment: selectedEnvironment
        };
    }

    /**
     * Render the main area with links
     */
    render() {
        this.log.debug('Rendering links');
        
        if (!this.container) {
            this.log.error('Container not found');
            return;
        }
        
        const selectedTab = this.getCurrentTab();
        const context = this.getCurrentContext();
        
        // Update header
        const headerTitle = this.container.querySelector('.current-tab');
        if (headerTitle) {
            headerTitle.textContent = selectedTab ? this.escapeHtml(selectedTab.name) : 'No Tab Selected';
        }
        
        // Update links area
        const linksArea = this.container.querySelector('.links-area');
        if (!linksArea) {
            this.log.warn('Links area not found');
            return;
        }
        
        linksArea.innerHTML = '';
        
        if (!selectedTab) {
            linksArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📂</div>
                    <h3>No Tab Selected</h3>
                    <p>Select a tab from the sidebar to view its links</p>
                </div>
            `;
            return;
        }
        
        if (selectedTab.links.length === 0) {
            linksArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔗</div>
                    <h3>No Links Yet</h3>
                    <p>Click "Add Link" to create your first link in "${this.escapeHtml(selectedTab.name)}"</p>
                </div>
            `;
            return;
        }
        
        // Render all links
        selectedTab.links.forEach(link => {
            const linkCard = this.createLinkCard(link);
            linksArea.appendChild(linkCard);
        });
        
        // Add selection status
        this.updateSelectionStatus(linksArea);
        
        this.log.debug('Links rendered', { 
            tabId: selectedTab.id,
            tabName: selectedTab.name,
            linkCount: selectedTab.links.length 
        });
    }

    /**
     * Create a single link card element
     */
    createLinkCard(link) {
        const isSelected = this.selectedLinks.has(link.id);
        
        const card = document.createElement('div');
        card.className = `link-card ${isSelected ? 'selected' : ''}`;
        card.setAttribute('data-link-id', link.id);
        
        // Checkbox for multi-select
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'link-checkbox';
        checkbox.checked = isSelected;
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            this.toggleLinkSelection(link.id, checkbox.checked);
        });
        
        // Favicon
        const favicon = document.createElement('img');
        favicon.className = 'link-favicon';
        favicon.src = link.favicon || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/%3E%3C/svg%3E';
        favicon.onerror = () => {
            favicon.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/%3E%3C/svg%3E';
        };
        
        // Link info container
        const infoDiv = document.createElement('div');
        infoDiv.className = 'link-info';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'link-name';
        nameSpan.textContent = link.name;
        
        const urlSpan = document.createElement('span');
        urlSpan.className = 'link-url';
        urlSpan.textContent = link.url;
        
        infoDiv.appendChild(favicon);
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(urlSpan);
        
        // Actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'link-actions';
        
        const openBtn = document.createElement('button');
        openBtn.className = 'link-action-btn open';
        openBtn.innerHTML = '🔗';
        openBtn.title = 'Open link in new tab';
        openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openLink(link);
        });
        
        const editBtn = document.createElement('button');
        editBtn.className = 'link-action-btn edit';
        editBtn.innerHTML = '✏️';
        editBtn.title = 'Edit link';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editLink(link);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'link-action-btn delete';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete link';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteLink(link.id);
        });
        
        actionsDiv.appendChild(openBtn);
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        // Assemble card
        card.appendChild(checkbox);
        card.appendChild(infoDiv);
        card.appendChild(actionsDiv);
        
        // Click on card (but not on buttons) to toggle selection with Ctrl/Cmd
        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
            
            if (e.ctrlKey || e.metaKey) {
                // Toggle selection
                this.toggleLinkSelection(link.id, !isSelected);
            } else if (e.shiftKey && this.lastClickedLinkId) {
                // Range selection - to be implemented
                this.selectRange(link.id);
            } else {
                // Single selection with click
                this.clearSelection();
                this.toggleLinkSelection(link.id, true);
            }
            this.lastClickedLinkId = link.id;
        });
        
        return card;
    }

    /**
     * Toggle selection for a link
     */
    toggleLinkSelection(linkId, isSelected) {
        if (isSelected) {
            this.selectedLinks.add(linkId);
            this.log.event('linkSelected', { linkId });
        } else {
            this.selectedLinks.delete(linkId);
            this.log.event('linkDeselected', { linkId });
        }
        
        // Update UI
        const linkCard = document.querySelector(`.link-card[data-link-id="${linkId}"]`);
        if (linkCard) {
            if (isSelected) {
                linkCard.classList.add('selected');
            } else {
                linkCard.classList.remove('selected');
            }
            const checkbox = linkCard.querySelector('.link-checkbox');
            if (checkbox) checkbox.checked = isSelected;
        }
        
        this.updateSelectionStatus();
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedLinks.forEach(linkId => {
            const linkCard = document.querySelector(`.link-card[data-link-id="${linkId}"]`);
            if (linkCard) {
                linkCard.classList.remove('selected');
                const checkbox = linkCard.querySelector('.link-checkbox');
                if (checkbox) checkbox.checked = false;
            }
        });
        this.selectedLinks.clear();
        this.updateSelectionStatus();
        this.log.debug('Selection cleared');
    }

    /**
     * Update selection status display
     */
    updateSelectionStatus(linksArea = null) {
        const selectionDiv = (linksArea || this.container?.querySelector('.links-area'))?.querySelector('.selection-status');
        if (selectionDiv) {
            const count = this.selectedLinks.size;
            selectionDiv.textContent = `${count} item${count !== 1 ? 's' : ''} selected`;
            
            // Show/hide delete selected button
            const deleteSelectedBtn = this.container?.querySelector('.delete-selected-btn');
            if (deleteSelectedBtn) {
                deleteSelectedBtn.style.display = count > 0 ? 'inline-flex' : 'none';
            }
        }
    }

    /**
     * Add a new link
     */
    async addLink() {
        this.log.event('addLink');
        
        const selectedTab = this.getCurrentTab();
        if (!selectedTab) {
            alert('Please select a tab first');
            return;
        }
        
        // Create modal dialog for link input
        const linkData = await this.showLinkDialog('Add Link', null);
        if (!linkData) {
            this.log.debug('Link creation cancelled');
            return;
        }
        
        const newLink = new Link(null, linkData.name, linkData.url, linkData.description);
        selectedTab.addLink(newLink);
        
        const data = this.storage.getData();
        this.storage.updateData(data);
        
        this.log.info('Link created', { 
            id: newLink.id, 
            name: newLink.name,
            tabId: selectedTab.id 
        });
    }

    /**
     * Edit an existing link
     */
    async editLink(link) {
        this.log.event('editLink', { linkId: link.id });
        
        const linkData = await this.showLinkDialog('Edit Link', {
            name: link.name,
            url: link.url,
            description: link.description
        });
        
        if (!linkData) {
            this.log.debug('Link edit cancelled');
            return;
        }
        
        link.update(linkData);
        
        const data = this.storage.getData();
        this.storage.updateData(data);
        
        this.log.info('Link updated', { linkId: link.id, newName: linkData.name });
    }

    /**
     * Delete a single link
     */
    deleteLink(linkId) {
        this.log.event('deleteLink', { linkId });
        
        const selectedTab = this.getCurrentTab();
        if (!selectedTab) return;
        
        const link = selectedTab.links.find(l => l.id === linkId);
        if (!link) return;
        
        if (confirm(`Delete link "${link.name}"?`)) {
            selectedTab.removeLink(linkId);
            this.selectedLinks.delete(linkId);
            
            const data = this.storage.getData();
            this.storage.updateData(data);
            
            this.log.info('Link deleted', { linkId, name: link.name });
        }
    }

    /**
     * Delete all selected links
     */
    deleteSelectedLinks() {
        if (this.selectedLinks.size === 0) return;
        
        const selectedTab = this.getCurrentTab();
        if (!selectedTab) return;
        
        if (confirm(`Delete ${this.selectedLinks.size} selected link(s)?`)) {
            this.selectedLinks.forEach(linkId => {
                selectedTab.removeLink(linkId);
            });
            this.selectedLinks.clear();
            
            const data = this.storage.getData();
            this.storage.updateData(data);
            
            this.log.info('Selected links deleted', { count: this.selectedLinks.size });
        }
    }

    /**
     * Open link in new tab
     */
    openLink(link) {
        this.log.event('openLink', { linkId: link.id, url: link.url });
        window.open(link.url, '_blank');
    }

    /**
     * Show modal dialog for link input
     */
    showLinkDialog(title, existingData = null) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="link-name">Name *</label>
                            <input type="text" id="link-name" placeholder="e.g., Google, GitHub, Documentation" value="${this.escapeHtml(existingData?.name || '')}">
                        </div>
                        <div class="form-group">
                            <label for="link-url">URL *</label>
                            <input type="url" id="link-url" placeholder="https://..." value="${this.escapeHtml(existingData?.url || '')}">
                        </div>
                        <div class="form-group">
                            <label for="link-desc">Description (optional)</label>
                            <textarea id="link-desc" rows="3" placeholder="Add notes about this link...">${this.escapeHtml(existingData?.description || '')}</textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn cancel">Cancel</button>
                        <button class="modal-btn save">Save Link</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const nameInput = modal.querySelector('#link-name');
            const urlInput = modal.querySelector('#link-url');
            const saveBtn = modal.querySelector('.save');
            const cancelBtn = modal.querySelector('.cancel');
            const closeBtn = modal.querySelector('.modal-close');
            
            const close = () => modal.remove();
            
            const save = () => {
                const name = nameInput.value.trim();
                const url = urlInput.value.trim();
                const description = modal.querySelector('#link-desc').value.trim();
                
                if (!name) {
                    alert('Please enter a link name');
                    nameInput.focus();
                    return;
                }
                
                if (!url) {
                    alert('Please enter a URL');
                    urlInput.focus();
                    return;
                }
                
                // Basic URL validation
                try {
                    new URL(url);
                } catch {
                    alert('Please enter a valid URL (e.g., https://example.com)');
                    urlInput.focus();
                    return;
                }
                
                resolve({ name, url, description });
                close();
            };
            
            saveBtn.addEventListener('click', save);
            cancelBtn.addEventListener('click', () => {
                resolve(null);
                close();
            });
            closeBtn.addEventListener('click', () => {
                resolve(null);
                close();
            });
            
            // Enter key in inputs
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') save();
            });
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') save();
            });
            
            // Focus on name input
            nameInput.focus();
            if (existingData?.name) nameInput.select();
        });
    }

    /**
     * Clean up on destroy
     */
    destroy() {
        this.log.info('Destroying');
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

window.LinkManager = LinkManager;