(async () => {
  const { invoke } = window.__TAURI__ || {};
  const webview = document.getElementById('webview');
  const startPage = document.getElementById('start-page');
  
  const state = {
    tabs: [],
    activeTabId: null,
    tabIdCounter: 1,
    bookmarks: [],
    history: [],
    downloads: [],
    settings: {
      homepage: 'about:blank',
      searchEngine: 'google',
      homeUrl: 'https://www.google.com'
    }
  };
  
  const elements = {
    bookmarksList: document.getElementById('bookmarks-list'),
    historyList: document.getElementById('history-list'),
    tabList: document.getElementById('tab-list'),
    urlInput: document.getElementById('url-input'),
    navBack: document.getElementById('nav-back'),
    navForward: document.getElementById('nav-forward'),
    navReload: document.getElementById('nav-reload'),
    newTabBtn: document.getElementById('new-tab-btn'),
    sidebarToggle: document.getElementById('sidebar-toggle'),
    sidebar: document.getElementById('sidebar'),
    startSearch: document.getElementById('start-search'),
    startSearchBtn: document.getElementById('start-search-btn'),
    downloadsPanel: document.getElementById('downloads-panel'),
    downloadsList: document.getElementById('downloads-list'),
    closeDownloads: document.getElementById('close-downloads'),
    menuDropdown: document.getElementById('menu-dropdown'),
    menuBtn: document.getElementById('menu-btn'),
    bookmarkBtn: document.getElementById('bookmark-btn')
  };
  
  function loadState() {
    try {
      const saved = localStorage.getItem('zed-browser-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        state.tabs = parsed.tabs || [];
        state.bookmarks = parsed.bookmarks || [];
        state.history = parsed.history || [];
        state.downloads = parsed.downloads || [];
        state.settings = { ...state.settings, ...parsed.settings };
        state.tabIdCounter = parsed.tabIdCounter || 1;
        if (state.tabs.length > 0) {
          state.activeTabId = parsed.activeTabId || state.tabs[0].id;
        }
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }
  
  function saveState() {
    try {
      const toSave = {
        tabs: state.tabs,
        bookmarks: state.bookmarks,
        history: state.history,
        downloads: state.downloads,
        settings: state.settings,
        tabIdCounter: state.tabIdCounter,
        activeTabId: state.activeTabId
      };
      localStorage.setItem('zed-browser-state', JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }
  
  function createTab(url = null, title = 'New Tab') {
    const id = 'tab-' + (state.tabIdCounter++);
    const tab = {
      id,
      url: url || '',
      title,
      favicon: null,
      pinned: false,
      createdAt: Date.now()
    };
    state.tabs.push(tab);
    if (!state.activeTabId) {
      state.activeTabId = id;
    }
    renderTabs();
    renderBookmarks();
    renderHistory();
    saveState();
    return tab;
  }
  
  function closeTab(id) {
    const index = state.tabs.findIndex(t => t.id === id);
    if (index === -1) return;
    
    state.tabs.splice(index, 1);
    
    if (state.activeTabId === id) {
      if (state.tabs.length > 0) {
        state.activeTabId = state.tabs[Math.min(index, state.tabs.length - 1)].id;
      } else {
        state.activeTabId = null;
      }
    }
    
    renderTabs();
    renderBookmarks();
    renderHistory();
    updateWebview();
    saveState();
  }
  
  function duplicateTab(id) {
    const tab = state.tabs.find(t => t.id === id);
    if (!tab) return;
    createTab(tab.url, tab.title);
  }
  
  function setActiveTab(id) {
    state.activeTabId = id;
    const tab = state.tabs.find(t => t.id === id);
    if (tab) {
      elements.urlInput.value = tab.url || '';
      renderTabs();
      updateWebview();
      saveState();
    }
  }
  
  function togglePinTab(id) {
    const tab = state.tabs.find(t => t.id === id);
    if (tab) {
      tab.pinned = !tab.pinned;
      renderTabs();
      saveState();
    }
  }
  
  function navigate(url) {
    if (!url && !elements.urlInput.value) {
      url = state.settings.homeUrl;
    }
    
    let finalUrl = url || elements.urlInput.value;
    
    if (!finalUrl) return;
    
    finalUrl = finalUrl.trim();
    
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        const engine = state.settings.searchEngine;
        if (engine === 'google') {
          finalUrl = 'https://www.google.com/search?q=' + encodeURIComponent(finalUrl);
        } else if (engine === 'bing') {
          finalUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(finalUrl);
        } else {
          finalUrl = 'https://duckduckgo.com/?q=' + encodeURIComponent(finalUrl);
        }
      }
    }
    
    if (state.activeTabId) {
      const tab = state.tabs.find(t => t.id === state.activeTabId);
      if (tab) {
        tab.url = finalUrl;
        elements.urlInput.value = finalUrl;
        renderTabs();
        updateWebview();
        saveState();
      }
    } else {
      const tab = createTab(finalUrl, finalUrl);
      state.activeTabId = tab.id;
      renderTabs();
      updateWebview();
      saveState();
    }
    
    addToHistory(finalUrl);
  }
  
  function updateWebview() {
    if (state.activeTabId) {
      const tab = state.tabs.find(t => t.id === state.activeTabId);
      if (tab && tab.url) {
        startPage.style.display = 'none';
        webview.style.display = 'block';
        if (webview.src !== tab.url) {
          webview.src = tab.url;
        }
        elements.urlInput.value = tab.url;
      } else {
        startPage.style.display = 'flex';
        webview.style.display = 'none';
      }
    } else {
      startPage.style.display = 'flex';
      webview.style.display = 'none';
    }
  }
  
  function renderTabs() {
    elements.tabList.innerHTML = '';
    state.tabs.forEach(tab => {
      const el = document.createElement('button');
      el.className = 'editor-tab' + (tab.id === state.activeTabId ? ' active' : '') + (tab.pinned ? ' pinned' : '');
      el.innerHTML = `
        <span class="tab-icon">${tab.favicon || '◎'}</span>
        <span class="tab-title">${tab.title}</span>
        <span class="tab-close">×</span>
      `;
      el.ondblclick = () => togglePinTab(tab.id);
      el.onclick = () => setActiveTab(tab.id);
      el.querySelector('.tab-close').onclick = (e) => {
        e.stopPropagation();
        closeTab(tab.id);
      };
      elements.tabList.appendChild(el);
    });
  }
  
  function renderBookmarks() {
    elements.bookmarksList.innerHTML = '';
    state.bookmarks.forEach(bm => {
      const el = document.createElement('div');
      el.className = 'bookmark-item' + (bm.url === (state.tabs.find(t => t.id === state.activeTabId)?.url) ? ' active' : '');
      el.innerHTML = `
        <span class="bookmark-icon">${bm.icon || '★'}</span>
        <span>${bm.title}</span>
      `;
      el.onclick = () => {
        createTab(bm.url, bm.title);
        navigate(bm.url);
      };
      elements.bookmarksList.appendChild(el);
    });
  }
  
  function renderHistory() {
    elements.historyList.innerHTML = '';
    const recent = state.history.slice(0, 50);
    recent.forEach(h => {
      const el = document.createElement('div');
      el.className = 'history-item' + (h.url === (state.tabs.find(t => t.id === state.activeTabId)?.url) ? ' active' : '');
      const time = new Date(h.timestamp);
      const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      el.innerHTML = `
        <span class="history-icon">${h.favicon || '◎'}</span>
        <span>${h.title || h.url}</span>
        <span class="history-time">${timeStr}</span>
      `;
      el.onclick = () => {
        createTab(h.url, h.title);
        navigate(h.url);
      };
      elements.historyList.appendChild(el);
    });
  }
  
  function addToHistory(url, title = null) {
    const existing = state.history.find(h => h.url === url);
    if (existing) {
      existing.timestamp = Date.now();
      existing.title = title || existing.title;
    } else {
      state.history.unshift({
        url,
        title: title || url,
        timestamp: Date.now(),
        favicon: null
      });
      if (state.history.length > 200) {
        state.history = state.history.slice(0, 200);
      }
    }
    renderHistory();
    saveState();
  }
  
  function addBookmark() {
    const tab = state.tabs.find(t => t.id === state.activeTabId);
    if (!tab || !tab.url) return;
    
    const existing = state.bookmarks.find(b => b.url === tab.url);
    if (existing) return;
    
    state.bookmarks.push({
      url: tab.url,
      title: tab.title,
      icon: tab.favicon,
      createdAt: Date.now()
    });
    
    renderBookmarks();
    saveState();
    
    elements.bookmarkBtn.style.color = 'var(--warning)';
    setTimeout(() => {
      elements.bookmarkBtn.style.color = '';
    }, 1000);
  }
  
  function removeBookmark(url) {
    state.bookmarks = state.bookmarks.filter(b => b.url !== url);
    renderBookmarks();
    saveState();
  }
  
  function goBack() {
    if (invoke) {
      invoke('go_back').catch(console.error);
    } else if (webview) {
      webview.back();
    }
  }
  
  function goForward() {
    if (invoke) {
      invoke('go_forward').catch(console.error);
    } else if (webview) {
      webview.forward();
    }
  }
  
  function reload() {
    if (invoke) {
      invoke('reload_page').catch(console.error);
    } else if (webview) {
      webview.reload();
    }
  }
  
  function toggleDownloads() {
    elements.downloadsPanel.classList.toggle('hidden');
    renderDownloads();
  }
  
  function renderDownloads() {
    elements.downloadsList.innerHTML = '';
    if (state.downloads.length === 0) {
      elements.downloadsList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No downloads</div>';
      return;
    }
    state.downloads.forEach((dl, i) => {
      const el = document.createElement('div');
      el.className = 'download-item';
      el.innerHTML = `
        <div class="download-icon">↓</div>
        <div class="download-info">
          <div class="download-name">${dl.filename}</div>
          <div class="download-progress">${dl.status}</div>
        </div>
        <div class="download-actions">
          <button class="download-action" data-action="open">◎</button>
          <button class="download-action" data-action="cancel">×</button>
        </div>
      `;
      el.querySelector('[data-action="cancel"]').onclick = () => {
        state.downloads.splice(i, 1);
        renderDownloads();
        saveState();
      };
      elements.downloadsList.appendChild(el);
    });
  }
  
  function toggleMenu() {
    elements.menuDropdown.classList.toggle('hidden');
  }
  
  function handleMenuAction(action) {
    switch (action) {
      case 'new-tab':
        createTab();
        break;
      case 'new-window':
        if (invoke) invoke('open_window');
        break;
      case 'bookmarks':
        elements.sidebar.classList.toggle('collapsed');
        break;
      case 'history':
        elements.sidebar.classList.toggle('collapsed');
        break;
      case 'downloads':
        toggleDownloads();
        break;
      case 'settings':
        createTab('about:blank', 'Settings');
        break;
      case 'devtools':
        if (invoke) invoke('toggle_devtools');
        break;
    }
    elements.menuDropdown.classList.add('hidden');
  }
  
  elements.navBack.onclick = goBack;
  elements.navForward.onclick = goForward;
  elements.navReload.onclick = reload;
  elements.newTabBtn.onclick = () => createTab();
  elements.sidebarToggle.onclick = () => elements.sidebar.classList.toggle('collapsed');
  
  elements.urlInput.onkeydown = (e) => {
    if (e.key === 'Enter') navigate();
  };
  
  elements.startSearch.onkeydown = (e) => {
    if (e.key === 'Enter') navigate(elements.startSearch.value);
  };
  
  elements.startSearchBtn.onclick = () => navigate(elements.startSearch.value);
  
  elements.bookmarkBtn.onclick = addBookmark;
  elements.downloadsBtn.onclick = toggleDownloads;
  elements.closeDownloads.onclick = () => elements.downloadsPanel.classList.add('hidden');
  elements.menuBtn.onclick = toggleMenu;
  
  document.querySelectorAll('.shortcut-item').forEach(item => {
    item.onclick = () => navigate(item.dataset.url);
  });
  
  document.querySelectorAll('.menu-dropdown-item').forEach(item => {
    item.onclick = () => handleMenuAction(item.dataset.action);
  });
  
  document.querySelectorAll('.menu-item').forEach(item => {
    item.onclick = () => handleMenuAction(item.dataset.action);
  });
  
  document.addEventListener('click', (e) => {
    if (!elements.menuDropdown.contains(e.target) && !elements.menuBtn.contains(e.target)) {
      elements.menuDropdown.classList.add('hidden');
    }
  });
  
  if (webview) {
    webview.addEventListener('page-title-updated', (e) => {
      if (state.activeTabId) {
        const tab = state.tabs.find(t => t.id === state.activeTabId);
        if (tab) {
          tab.title = e.detail;
          renderTabs();
          renderBookmarks();
          renderHistory();
        }
      }
    });
    
    webview.addEventListener('load-commit', (e) => {
      if (state.activeTabId) {
        const tab = state.tabs.find(t => t.id === state.activeTabId);
        if (tab) {
          tab.url = e.detail.url;
          elements.urlInput.value = tab.url;
          addToHistory(e.detail.url);
        }
      }
    });
    
    webview.addEventListener('favicon-updated', (e) => {
      if (state.activeTabId) {
        const tab = state.tabs.find(t => t.id === state.activeTabId);
        if (tab) {
          tab.favicon = e.detail;
          renderTabs();
          renderBookmarks();
        }
      }
    });
  }
  
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 't':
          e.preventDefault();
          createTab();
          break;
        case 'w':
          e.preventDefault();
          if (state.activeTabId) closeTab(state.activeTabId);
          break;
        case 'r':
          if (e.shiftKey) {
            e.preventDefault();
            if (state.activeTabId) {
              const tab = state.tabs.find(t => t.id === state.activeTabId);
              if (tab) {
                tab.url = '';
                updateWebview();
              }
            }
          } else {
            e.preventDefault();
            reload();
          }
          break;
        case 'l':
          e.preventDefault();
          elements.urlInput.focus();
          elements.urlInput.select();
          break;
        case 'd':
          e.preventDefault();
          addBookmark();
          break;
        case 'b':
          e.preventDefault();
          elements.sidebar.classList.toggle('collapsed');
          break;
        case 'h':
          e.preventDefault();
          elements.sidebar.classList.toggle('collapsed');
          break;
        case 'i':
          if (e.shiftKey) {
            e.preventDefault();
            handleMenuAction('devtools');
          }
          break;
      }
    }
    if (e.key === 'F5') {
      e.preventDefault();
      reload();
    }
    if (e.key === 'F12') {
      e.preventDefault();
      handleMenuAction('devtools');
    }
  });
  
  loadState();
  
  if (state.tabs.length === 0) {
    createTab();
  } else {
    state.tabs.forEach(tab => {
      if (tab.url) addToHistory(tab.url, tab.title);
    });
    renderTabs();
    renderBookmarks();
    renderHistory();
    updateWebview();
  }
})();
