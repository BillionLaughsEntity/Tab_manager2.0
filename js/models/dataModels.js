// js/models/dataModels.js

/**
 * Data Models for Tab Manager 2.0
 * Defines the structure for Workbooks, Profiles, Environments, Tabs, and Links
 */

class Link {
    constructor(id, name, url, description = '') {
        this.id = id || this.generateId();
        this.name = name;
        this.url = url;
        this.description = description;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        this.favicon = this.extractFavicon(url);
    }

    generateId() {
        return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    extractFavicon(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch {
            return null;
        }
    }

    update(data) {
        Object.assign(this, data);
        this.updatedAt = new Date().toISOString();
    }
}

class Tab {
    constructor(id, name, links = []) {
        this.id = id || this.generateId();
        this.name = name;
        this.links = links.map(linkData => 
            linkData instanceof Link ? linkData : new Link(linkData.id, linkData.name, linkData.url, linkData.description)
        );
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    generateId() {
        return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addLink(linkData) {
        const newLink = linkData instanceof Link ? linkData : new Link(linkData.id, linkData.name, linkData.url, linkData.description);
        this.links.push(newLink);
        this.updatedAt = new Date().toISOString();
        return newLink;
    }

    removeLink(linkId) {
        const index = this.links.findIndex(link => link.id === linkId);
        if (index !== -1) {
            this.links.splice(index, 1);
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    updateLink(linkId, data) {
        const link = this.links.find(l => l.id === linkId);
        if (link) {
            link.update(data);
            this.updatedAt = new Date().toISOString();
            return link;
        }
        return null;
    }

    getLinkCount() {
        return this.links.length;
    }
}

class Environment {
    constructor(id, name, tabs = []) {
        this.id = id || this.generateId();
        this.name = name;
        this.tabs = tabs.map(tabData => 
            tabData instanceof Tab ? tabData : new Tab(tabData.id, tabData.name, tabData.links)
        );
        this.isExpanded = true;  // UI state
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    generateId() {
        return `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addTab(tabData) {
        const newTab = tabData instanceof Tab ? tabData : new Tab(tabData.id, tabData.name, tabData.links);
        this.tabs.push(newTab);
        this.updatedAt = new Date().toISOString();
        return newTab;
    }

    removeTab(tabId) {
        const index = this.tabs.findIndex(tab => tab.id === tabId);
        if (index !== -1) {
            this.tabs.splice(index, 1);
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    getTabCount() {
        return this.tabs.length;
    }

    getTotalLinkCount() {
        return this.tabs.reduce((total, tab) => total + tab.getLinkCount(), 0);
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
        return this.isExpanded;
    }
}

class Profile {
    constructor(id, name, environments = []) {
        this.id = id || this.generateId();
        this.name = name;
        this.environments = environments.map(envData => 
            envData instanceof Environment ? envData : new Environment(envData.id, envData.name, envData.tabs)
        );
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    generateId() {
        return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addEnvironment(envData) {
        const newEnv = envData instanceof Environment ? envData : new Environment(envData.id, envData.name, envData.tabs);
        this.environments.push(newEnv);
        this.updatedAt = new Date().toISOString();
        return newEnv;
    }

    removeEnvironment(envId) {
        const index = this.environments.findIndex(env => env.id === envId);
        if (index !== -1) {
            this.environments.splice(index, 1);
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    getEnvironmentCount() {
        return this.environments.length;
    }

    getTotalTabCount() {
        return this.environments.reduce((total, env) => total + env.getTabCount(), 0);
    }

    getTotalLinkCount() {
        return this.environments.reduce((total, env) => total + env.getTotalLinkCount(), 0);
    }
}

class Workbook {
    constructor(id, name, profiles = []) {
        this.id = id || this.generateId();
        this.name = name;
        this.profiles = profiles.map(profileData => 
            profileData instanceof Profile ? profileData : new Profile(profileData.id, profileData.name, profileData.environments)
        );
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    generateId() {
        return `workbook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addProfile(profileData) {
        const newProfile = profileData instanceof Profile ? profileData : new Profile(profileData.id, profileData.name, profileData.environments);
        this.profiles.push(newProfile);
        this.updatedAt = new Date().toISOString();
        return newProfile;
    }

    removeProfile(profileId) {
        const index = this.profiles.findIndex(profile => profile.id === profileId);
        if (index !== -1) {
            this.profiles.splice(index, 1);
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    getProfileCount() {
        return this.profiles.length;
    }

    getTotalEnvironmentCount() {
        return this.profiles.reduce((total, profile) => total + profile.getEnvironmentCount(), 0);
    }

    getTotalTabCount() {
        return this.profiles.reduce((total, profile) => total + profile.getTotalTabCount(), 0);
    }

    getTotalLinkCount() {
        return this.profiles.reduce((total, profile) => total + profile.getTotalLinkCount(), 0);
    }
}

// Export for use in other modules
window.TabManagerModels = {
    Link,
    Tab,
    Environment,
    Profile,
    Workbook
};