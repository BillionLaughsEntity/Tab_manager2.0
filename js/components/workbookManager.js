// js/components/workbookManager.js

/**
 * Workbook Manager
 * Handles the horizontal bar showing all workbooks
 * Manages workbook selection, creation, and deletion
 */

class WorkbookManager extends ComponentBase {
    constructor(storage, containerSelector) {
        super('WorkbookManager');
        this.storage = storage;
        this.container = document.querySelector(containerSelector);
        this.onWorkbookSelected = null; // Callback for selection
        this.log.info('Initializing');
        
        // Bind methods with tracing
        this.render = this.createTracedMethod('render', this.render.bind(this));
        this.handleWorkbookClick = this.createTracedMethod('handleWorkbookClick', this.handleWorkbookClick.bind(this));
        this.addWorkbook = this.createTracedMethod('addWorkbook', this.addWorkbook.bind(this));
        
        // Subscribe to storage changes
        this.unsubscribe = this.storage.subscribe(() => {
            this.log.debug('Storage changed, re-rendering');
            this.render();
        });
        
        this.render();
    }

    /**
     * Render the workbooks bar
     */
    render() {
        this.log.debug('Rendering workbooks');
        const data = this.storage.getData();
        const workbooks = data.workbooks;
        const selectedId = data.selectedWorkbookId;
        
        if (!this.container) {
            this.log.error('Container not found');
            return;
        }
        
        // Clear container but preserve header structure
        const barItems = this.container.querySelector('.bar-items');
        if (!barItems) {
            this.log.warn('Bar items container not found');
            return;
        }
        
        barItems.innerHTML = '';
        
        if (workbooks.length === 0) {
            barItems.innerHTML = '<div class="empty-message">No workbooks. Click + to create</div>';
            return;
        }
        
        workbooks.forEach(workbook => {
            const workbookElement = this.createWorkbookElement(workbook, workbook.id === selectedId);
            barItems.appendChild(workbookElement);
        });
        
        this.log.debug('Workbooks rendered', { count: workbooks.length });
    }

    /**
     * Create a single workbook element
     */
    createWorkbookElement(workbook, isActive) {
        const div = document.createElement('div');
        div.className = `bar-item ${isActive ? 'active' : ''}`;
        div.setAttribute('data-workbook-id', workbook.id);
        div.innerHTML = `
            <span class="item-icon">📚</span>
            <span class="item-name">${this.escapeHtml(workbook.name)}</span>
            <span class="item-badge">${workbook.profiles.length}</span>
        `;
        
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleWorkbookClick(workbook.id);
        });
        
        // Add context menu for delete/edit (optional)
        div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showWorkbookContextMenu(e, workbook);
        });
        
        return div;
    }

    /**
     * Handle workbook click
     */
    handleWorkbookClick(workbookId) {
        this.log.event('workbookSelected', { workbookId });
        const data = this.storage.getData();
        
        if (data.selectedWorkbookId !== workbookId) {
            data.selectedWorkbookId = workbookId;
            
            // Reset lower-level selections since they may not exist in new workbook
            const selectedWorkbook = data.workbooks.find(w => w.id === workbookId);
            if (selectedWorkbook && selectedWorkbook.profiles.length > 0) {
                data.selectedProfileId = selectedWorkbook.profiles[0].id;
                if (selectedWorkbook.profiles[0].environments.length > 0) {
                    data.selectedEnvironmentId = selectedWorkbook.profiles[0].environments[0].id;
                    if (selectedWorkbook.profiles[0].environments[0].tabs.length > 0) {
                        data.selectedTabId = selectedWorkbook.profiles[0].environments[0].tabs[0].id;
                    }
                }
            } else {
                data.selectedProfileId = null;
                data.selectedEnvironmentId = null;
                data.selectedTabId = null;
            }
            
            this.storage.updateData(data);
            this.log.info('Workbook changed', { 
                oldId: data.selectedWorkbookId, 
                newId: workbookId 
            });
        }
    }

    /**
     * Add new workbook
     */
    async addWorkbook() {
        this.log.event('addWorkbook');
        
        const name = prompt('Enter workbook name:', 'New Workbook');
        if (!name) {
            this.log.debug('Workbook creation cancelled');
            return;
        }
        
        const data = this.storage.getData();
        const newWorkbook = new Workbook(null, name);
        data.workbooks.push(newWorkbook);
        data.selectedWorkbookId = newWorkbook.id;
        data.selectedProfileId = null;
        data.selectedEnvironmentId = null;
        data.selectedTabId = null;
        
        this.storage.updateData(data);
        this.log.info('Workbook created', { id: newWorkbook.id, name });
    }

    /**
     * Delete workbook
     */
    deleteWorkbook(workbookId) {
        this.log.event('deleteWorkbook', { workbookId });
        
        const data = this.storage.getData();
        const workbookIndex = data.workbooks.findIndex(w => w.id === workbookId);
        
        if (workbookIndex === -1) {
            this.log.warn('Workbook not found for deletion', { workbookId });
            return;
        }
        
        const workbookName = data.workbooks[workbookIndex].name;
        
        if (confirm(`Delete workbook "${workbookName}" and all its contents?`)) {
            data.workbooks.splice(workbookIndex, 1);
            
            // If we deleted the selected workbook, select another
            if (data.selectedWorkbookId === workbookId) {
                if (data.workbooks.length > 0) {
                    data.selectedWorkbookId = data.workbooks[0].id;
                    // Reset selections for new workbook
                    const newWorkbook = data.workbooks[0];
                    if (newWorkbook.profiles.length > 0) {
                        data.selectedProfileId = newWorkbook.profiles[0].id;
                        if (newWorkbook.profiles[0].environments.length > 0) {
                            data.selectedEnvironmentId = newWorkbook.profiles[0].environments[0].id;
                            if (newWorkbook.profiles[0].environments[0].tabs.length > 0) {
                                data.selectedTabId = newWorkbook.profiles[0].environments[0].tabs[0].id;
                            }
                        }
                    }
                } else {
                    data.selectedWorkbookId = null;
                    data.selectedProfileId = null;
                    data.selectedEnvironmentId = null;
                    data.selectedTabId = null;
                }
            }
            
            this.storage.updateData(data);
            this.log.info('Workbook deleted', { workbookId, name: workbookName });
        }
    }

    /**
     * Show context menu for workbook
     */
    showWorkbookContextMenu(event, workbook) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        menu.style.backgroundColor = '#2d2d2d';
        menu.style.border = '1px solid #4d4d4d';
        menu.style.borderRadius = '4px';
        menu.style.zIndex = '1000';
        
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
            this.renameWorkbook(workbook);
            menu.remove();
        });
        
        menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
            this.deleteWorkbook(workbook.id);
            menu.remove();
        });
        
        document.body.appendChild(menu);
        
        // Click outside to close
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    /**
     * Rename workbook
     */
    renameWorkbook(workbook) {
        const newName = prompt('Enter new name:', workbook.name);
        if (newName && newName.trim()) {
            workbook.name = newName.trim();
            const data = this.storage.getData();
            this.storage.updateData(data);
            this.log.info('Workbook renamed', { id: workbook.id, newName });
        }
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

window.WorkbookManager = WorkbookManager;