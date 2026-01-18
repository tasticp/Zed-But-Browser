// Zed Browser - Main Application Script
// Clean, working implementation based on Zed design principles

class ZedBrowser {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.tabIdCounter = 0;
        this.webview = null;
        this.maxTabs = 50;
        this.bookmarks = [];
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Zed Browser...');
        
        // Get DOM elements
        this.elements = {
            tabBar: document.getElementById('tab-bar'),
            urlInput: document.getElementById('url-input'),
            webviewContainer: document.getElementById('webview-container'),
            startPage: document.getElementById('start-page'),
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            newTabBtn: document.getElementById('new-tab-btn'),
            sidebarTabs: document.getElementById('sidebar-tabs'),
            sidebarBookmarks: document.getElementById('sidebar-bookmarks'),
            statusUrl: document.getElementById('status-url'),
            statusTabs: document.getElementById('status-tabs'),
            statusTime: document.getElementById('status-time'),
            shortcuts: document.querySelectorAll('.shortcut')
        };
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Create initial tab
        this.createNewTab();
        
        // Update time
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        console.log('✅ Zed Browser initialized successfully');
    }

    initEventListeners() {
        // New tab button
        this.elements.newTabBtn.addEventListener('click', () => this.createNewTab());
        
        // URL input
        this.elements.urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.navigate(this.elements.urlInput.value);
            }
        });
        
        // Search
        this.elements.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.navigate(this.elements.searchInput.value);
            }
        });
        
        this.elements.searchBtn.addEventListener('click', () => {
            this.navigate(this.elements.searchInput.value);
        });
        
        // Shortcut buttons
        this.elements.shortcuts.forEach(shortcut => {
            shortcut.addEventListener('click', () => {
                const url = shortcut.getAttribute('data-url');
                this.navigate(url);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.createNewTab();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'w' && this.activeTabId) {
                e.preventDefault();
                this.closeTab(this.activeTabId);
            }
            if (e.key === 'F5') {
                e.preventDefault();
                this.reload();
            }
            if (e.key === 'F6' || (e.ctrlKey && e.key === 'l')) {
                e.preventDefault();
                this.elements.urlInput.focus();
                this.elements.urlInput.select();
            }
        });
        
        // Title bar controls (decorative for now)
        document.querySelector('.title-bar-close')?.addEventListener('click', () => {
            if (window.__TAURI__) {
                window.__TAURI__.window.getCurrent().close();
            }
        });
    }

    createNewTab(url = null, title = 'New Tab') {
        if (this.tabs.length >= this.maxTabs) {
            console.warn('Maximum number of tabs reached');
            return null;
        }
        
        const tabId = 'tab-' + this.tabIdCounter++;
        const tab = {
            id: tabId,
            url: url,
            title: title,
            created: new Date()
        };
        
        this.tabs.push(tab);
        this.renderTab(tab);
        this.renderSidebarItem(tab);
        
        // Set as active if it's first tab or if specified
        if (!this.activeTabId || url) {
            this.switchToTab(tabId);
        }
        
        this.updateStatus();
        return tab;
    }

    switchToTab(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        this.activeTabId = tabId;
        
        // Update UI
        document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
        document.querySelector('[data-tab-id="' + tabId + '"]')?.classList.add('active');
        document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
        document.querySelector('[data-sidebar-tab-id="' + tabId + '"]')?.classList.add('active');
        
        // Update URL input
        this.elements.urlInput.value = tab.url || '';
        
        // Load webview or show start page
        if (tab.url) {
            this.loadWebview(tab.url);
        } else {
            this.showStartPage();
        }
        
        this.updateStatus();
    }

    closeTab(tabId) {
        const tabIndex = this.tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;
        
        this.tabs.splice(tabIndex, 1);
        
        // Remove from UI
        document.querySelector('[data-tab-id="' + tabId + '"]')?.remove();
        document.querySelector('[data-sidebar-tab-id="' + tabId + '"]')?.remove();
        
        // Handle active tab
        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                const newActiveIndex = Math.min(tabIndex, this.tabs.length - 1);
                this.switchToTab(this.tabs[newActiveIndex].id);
            } else {
                this.activeTabId = null;
                this.showStartPage();
            }
        }
        
        // Clear webview if no tabs
        if (this.tabs.length === 0) {
            this.clearWebview();
        }
        
        this.updateStatus();
    }

    navigate(url) {
        if (!url || url.trim().length === 0) {
            return;
        }
        
        let finalUrl = url.trim();
        
        // Validate and process URL
        if (!this.isValidUrl(finalUrl)) {
            // If not a valid URL, treat as search
            finalUrl = 'https://www.google.com/search?q=' + encodeURIComponent(finalUrl);
        } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            // Auto-add https if missing
            finalUrl = 'https://' + finalUrl;
        }
        
        // Security check
        if (!this.isSecureUrl(finalUrl)) {
            console.warn('Blocked potentially dangerous URL:', finalUrl);
            this.showError('Blocked: URL not allowed for security reasons');
            return;
        }
        
        // Update or create tab
        if (this.activeTabId) {
            const activeTab = this.tabs.find(t => t.id === this.activeTabId);
            if (activeTab) {
                activeTab.url = finalUrl;
                this.elements.urlInput.value = finalUrl;
                this.updateTabTitle(this.activeTabId, finalUrl);
            }
        } else {
            this.createNewTab(finalUrl, 'Loading...');
        }
        
        // Load webview
        this.loadWebview(finalUrl);
    }

    loadWebview(url) {
        // Clear existing webview
        this.clearWebview();
        
        // Hide start page
        this.elements.startPage.style.display = 'none';
        
        // Create new webview
        this.webview = document.createElement('webview');
        this.webview.style.width = '100%';
        this.webview.style.height = '100%';
        this.webview.style.border = 'none';
        this.webview.src = url;
        
        // Security attributes
        this.webview.setAttribute('allowpopups', 'false');
        this.webview.setAttribute('nodeintegration', 'false');
        this.webview.setAttribute('webSecurity', 'true');
        
        // Event listeners
        this.webview.addEventListener('dom-ready', () => {
            console.log('Webview loaded:', url);
            this.updateStatus('Loaded: ' + new URL(url).hostname);
        });
        
        this.webview.addEventListener('page-title-updated', (e) => {
            this.updateTabTitle(this.activeTabId, e.title || 'Untitled');
        });
        
        this.webview.addEventListener('did-fail-load', (e) => {
            console.error('Failed to load:', e);
            this.showError('Failed to load page');
            this.showStartPage();
        });
        
        this.elements.webviewContainer.appendChild(this.webview);
    }

    clearWebview() {
        if (this.webview) {
            this.elements.webviewContainer.removeChild(this.webview);
            this.webview = null;
        }
    }

    showStartPage() {
        this.clearWebview();
        this.elements.startPage.style.display = 'flex';
        this.updateStatus('Ready');
    }

    reload() {
        if (this.webview) {
            this.webview.reload();
        }
    }

    renderTab(tab) {
        const tabElement = document.createElement('button');
        tabElement.className = 'tab';
        tabElement.setAttribute('data-tab-id', tab.id);
        
        tabElement.innerHTML = '<span class="tab-title">' + tab.title + '</span><span class="tab-close">×</span>';
        
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchToTab(tab.id);
            }
        });
        
        tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });
        
        // Insert before new tab button
        const newTabBtn = document.getElementById('new-tab-btn');
        this.elements.tabBar.insertBefore(tabElement, newTabBtn);
    }

    renderSidebarItem(tab) {
        const sidebarItem = document.createElement('div');
        sidebarItem.className = 'sidebar-item';
        sidebarItem.setAttribute('data-sidebar-tab-id', tab.id);
        sidebarItem.innerHTML = '📄 ' + tab.title;
        
        sidebarItem.addEventListener('click', () => {
            this.switchToTab(tab.id);
        });
        
        this.elements.sidebarTabs.appendChild(sidebarItem);
    }

    updateTabTitle(tabId, title) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            tab.title = title;
            
            // Update tab element
            const tabElement = document.querySelector('[data-tab-id="' + tabId + '"] .tab-title');
            if (tabElement) {
                tabElement.textContent = title;
            }
            
            // Update sidebar element
            const sidebarElement = document.querySelector('[data-sidebar-tab-id="' + tabId + '"]');
            if (sidebarElement) {
                sidebarElement.innerHTML = '📄 ' + title;
            }
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            // Check if it's a domain-like string (e.g., "google.com")
            return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(string);
        }
    }

    isSecureUrl(url) {
        const lowerUrl = url.toLowerCase();
        const dangerousSchemes = [
            'javascript:', 'data:', 'vbscript:', 'file:', 'ftp:',
            'chrome:', 'chrome-extension:', 'moz-extension:', 'edge:', 'opera:',
            'mailto:', 'tel:', 'sms:'
        ];
        
        for (const scheme of dangerousSchemes) {
            if (lowerUrl.startsWith(scheme)) {
                return false;
            }
        }
        
        return true;
    }

    showError(message) {
        console.error(message);
        // Flash URL input border red
        this.elements.urlInput.style.borderColor = 'var(--danger)';
        setTimeout(() => {
            this.elements.urlInput.style.borderColor = '';
        }, 2000);
        
        // Update status
        this.updateStatus('Error: ' + message);
        setTimeout(() => {
            this.updateStatus('Ready');
        }, 3000);
    }

    updateStatus(message) {
        this.elements.statusUrl.textContent = message || 'Ready';
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        this.elements.statusTime.textContent = timeString;
    }
}

// Initialize browser when DOM is loaded
let zedBrowser;
document.addEventListener('DOMContentLoaded', () => {
    zedBrowser = new ZedBrowser();
});

// Test utilities
window.zedBrowserTests = {
    testNavigation: function() {
        console.log('🧪 Testing navigation...');
        const testUrls = [
            'https://google.com',
            'github.com',
            'test search',
            'javascript:alert(1)',
            ''
        ];
        
        testUrls.forEach((url, index) => {
            setTimeout(() => {
                console.log('Test ' + (index + 1) + ': ' + url);
                zedBrowser.navigate(url);
            }, index * 1000);
        });
    },
    
    testTabs: function() {
        console.log('🧪 Testing tab management...');
        zedBrowser.createNewTab('https://example.com', 'Example');
        zedBrowser.createNewTab('https://github.com', 'GitHub');
        
        setTimeout(() => {
            zedBrowser.switchToTab('tab-1');
            setTimeout(() => {
                zedBrowser.closeTab('tab-2');
            }, 1000);
        }, 1000);
    },
    
    runAllTests: function() {
        console.log('🚀 Running all tests...');
        this.testNavigation();
        setTimeout(() => this.testTabs(), 5000);
    }
};

console.log('Zed Browser loaded. Available tests:');
console.log('- zedBrowserTests.testNavigation()');
console.log('- zedBrowserTests.testTabs()');
console.log('- zedBrowserTests.runAllTests()');