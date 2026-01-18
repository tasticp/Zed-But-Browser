// Zed Browser - Main Application Script
// Intelligent merge: class structure with functional state management and performance optimizations

(async () => {
  const { invoke } = window.__TAURI__ || {};

  // Performance: Cache DOM queries and event handlers
  const cache = {
    elements: {},
    lastRender: 0,
    renderThrottle: 16, // ~60fps
  };

  // State management
  const state = {
    tabs: [],
    activeTabId: null,
    tabIdCounter: 1,
    bookmarks: [],
    history: [],
    downloads: [],
    settings: {
      homepage: "about:blank",
      searchEngine: "google",
      homeUrl: "https://www.google.com",
    },
  };

  // DOM elements (cached)
  const elements = {
    tabBar: document.getElementById("tab-bar"),
    urlInput: document.getElementById("url-input"),
    webviewContainer: document.getElementById("webview-container"),
    startPage: document.getElementById("start-page"),
    searchInput: document.getElementById("search-input"),
    searchBtn: document.getElementById("search-btn"),
    newTabBtn: document.getElementById("new-tab-btn"),
    sidebarTabs: document.getElementById("sidebar-tabs"),
    sidebarBookmarks: document.getElementById("sidebar-bookmarks"),
    statusUrl: document.getElementById("status-url"),
    statusTabs: document.getElementById("status-tabs"),
    statusTime: document.getElementById("status-time"),
    shortcuts: document.querySelectorAll(".shortcut"),
    bookmarksList: document.getElementById("bookmarks-list"),
    historyList: document.getElementById("history-list"),
    navBack: document.getElementById("nav-back"),
    navForward: document.getElementById("nav-forward"),
    navReload: document.getElementById("nav-reload"),
    sidebarToggle: document.getElementById("sidebar-toggle"),
    sidebar: document.getElementById("sidebar"),
    downloadsPanel: document.getElementById("downloads-panel"),
    downloadsList: document.getElementById("downloads-list"),
    closeDownloads: document.getElementById("close-downloads"),
    menuDropdown: document.getElementById("menu-dropdown"),
    menuBtn: document.getElementById("menu-btn"),
    bookmarkBtn: document.getElementById("bookmark-btn"),
    webview: document.getElementById("webview"),
  };

  // ============ State Management ============

  function loadState() {
    try {
      const saved = localStorage.getItem("zed-browser-state");
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
      console.error("Failed to load state:", e);
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
        activeTabId: state.activeTabId,
      };
      localStorage.setItem("zed-browser-state", JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  }

  // ============ Tab Management ============

  function createTab(url = null, title = "New Tab") {
    const id = "tab-" + state.tabIdCounter++;
    const tab = {
      id,
      url: url || "",
      title,
      favicon: null,
      pinned: false,
      createdAt: Date.now(),
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
    const index = state.tabs.findIndex((t) => t.id === id);
    if (index === -1) return;

    state.tabs.splice(index, 1);

    if (state.activeTabId === id) {
      if (state.tabs.length > 0) {
        state.activeTabId =
          state.tabs[Math.min(index, state.tabs.length - 1)].id;
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
    const tab = state.tabs.find((t) => t.id === id);
    if (!tab) return;
    createTab(tab.url, tab.title);
  }

  function setActiveTab(id) {
    state.activeTabId = id;
    const tab = state.tabs.find((t) => t.id === id);
    if (tab) {
      elements.urlInput.value = tab.url || "";
      renderTabs();
      updateWebview();
      saveState();
    }
  }

  function togglePinTab(id) {
    const tab = state.tabs.find((t) => t.id === id);
    if (tab) {
      tab.pinned = !tab.pinned;
      renderTabs();
      saveState();
    }
  }

  // ============ Navigation ============

  function navigate(urlInput) {
    if (!state.activeTabId) return;

    let finalUrl = urlInput.trim();

    if (!finalUrl) return;

    // Handle search queries
    if (!finalUrl.includes(".") && !finalUrl.startsWith("http")) {
      const engine =
        {
          google: "https://www.google.com/search?q=",
          bing: "https://www.bing.com/search?q=",
          duckduckgo: "https://duckduckgo.com/?q=",
        }[state.settings.searchEngine] || "https://www.google.com/search?q=";
      finalUrl = engine + encodeURIComponent(finalUrl);
    }

    // Add protocol if missing
    if (
      !finalUrl.startsWith("http://") &&
      !finalUrl.startsWith("https://") &&
      !finalUrl.startsWith("about:")
    ) {
      finalUrl = "https://" + finalUrl;
    }

    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    if (tab) {
      tab.url = finalUrl;
      tab.title = "Loading...";
      addToHistory(finalUrl, "Page");
      renderTabs();
      renderBookmarks();
      updateWebview();
      saveState();
    }
  }

  function updateWebview() {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    if (tab && elements.webview) {
      elements.webview.src = tab.url || "about:blank";
      if (elements.statusUrl) {
        elements.statusUrl.textContent = tab.url || "about:blank";
      }
    }
  }

  // ============ History & Bookmarks ============

  function addToHistory(url, title = "Page") {
    const existing = state.history.find((h) => h.url === url);

    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.lastVisited = Date.now();
    } else {
      state.history.push({
        url,
        title,
        count: 1,
        lastVisited: Date.now(),
        timestamp: Date.now(),
        favicon: null,
      });
    }

    if (state.history.length > 100) {
      state.history = state.history.slice(-100);
    }

    renderHistory();
    saveState();
  }

  function addBookmark(url, title, icon) {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    const existing = state.bookmarks.find((b) => b.url === url);

    if (!existing && tab) {
      state.bookmarks.push({
        url: url || tab.url,
        title: title || tab.title || "Bookmark",
        icon: icon || tab.favicon,
        createdAt: Date.now(),
      });
      renderBookmarks();
      saveState();
      console.log("✅ Bookmark added");
    }
  }

  function removeBookmark(url) {
    const index = state.bookmarks.findIndex((b) => b.url === url);
    if (index !== -1) {
      state.bookmarks.splice(index, 1);
      renderBookmarks();
      saveState();
    }
  }

  // ============ Navigation Controls ============

  function goBack() {
    // Simplified back navigation
    const currentIndex = state.history.findIndex(
      (h) => h.url === state.tabs.find((t) => t.id === state.activeTabId)?.url,
    );
    if (currentIndex > 0) {
      navigate(state.history[currentIndex - 1].url);
    }
  }

  function goForward() {
    // Simplified forward navigation
    const currentIndex = state.history.findIndex(
      (h) => h.url === state.tabs.find((t) => t.id === state.activeTabId)?.url,
    );
    if (currentIndex < state.history.length - 1) {
      navigate(state.history[currentIndex + 1].url);
    }
  }

  function reload() {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    if (tab && tab.url) {
      tab.title = "Reloading...";
      renderTabs();
      updateWebview();
    }
  }

  // ============ Rendering ============

  function renderTabs() {
    const now = Date.now();
    if (now - cache.lastRender < cache.renderThrottle) return;
    cache.lastRender = now;

    if (!elements.tabBar) return;

    const fragment = document.createDocumentFragment();

    state.tabs.forEach((tab) => {
      const el = document.createElement("div");
      el.className = "tab" + (tab.id === state.activeTabId ? " active" : "");
      el.innerHTML = `
        <div class="tab-content">
          ${tab.favicon ? `<img src="${tab.favicon}" class="tab-favicon">` : '<span class="tab-icon">📄</span>'}
          <span class="tab-title">${tab.title || "New Tab"}</span>
        </div>
        <button class="tab-close">×</button>
      `;

      el.addEventListener("click", () => setActiveTab(tab.id));
      el.querySelector(".tab-close").addEventListener("click", (e) => {
        e.stopPropagation();
        closeTab(tab.id);
      });

      fragment.appendChild(el);
    });

    elements.tabBar.innerHTML = "";
    elements.tabBar.appendChild(fragment);
  }

  function renderBookmarks() {
    if (!elements.sidebarBookmarks) return;

    const fragment = document.createDocumentFragment();
    const currentTabUrl = state.tabs.find(
      (t) => t.id === state.activeTabId,
    )?.url;

    state.bookmarks.forEach((bookmark) => {
      const el = document.createElement("div");
      el.className =
        "sidebar-item" + (bookmark.url === currentTabUrl ? " active" : "");
      el.innerHTML = `
        <a href="#" class="bookmark-link">
          ${bookmark.icon ? `<img src="${bookmark.icon}" class="item-icon">` : "⭐"}
          <span>${bookmark.title}</span>
        </a>
      `;

      el.querySelector(".bookmark-link").addEventListener("click", (e) => {
        e.preventDefault();
        navigate(bookmark.url);
      });

      fragment.appendChild(el);
    });

    elements.sidebarBookmarks.innerHTML = "";
    elements.sidebarBookmarks.appendChild(fragment);
  }

  function renderHistory() {
    if (!elements.historyList) return;

    const fragment = document.createDocumentFragment();
    const recent = state.history.slice(-20).reverse();
    const currentTabUrl = state.tabs.find(
      (t) => t.id === state.activeTabId,
    )?.url;

    recent.forEach((item) => {
      const el = document.createElement("div");
      el.className =
        "history-item" + (item.url === currentTabUrl ? " active" : "");

      const time = new Date(item.timestamp || item.lastVisited);
      const timeStr = {
        hour: time.getHours().toString().padStart(2, "0"),
        minute: time.getMinutes().toString().padStart(2, "0"),
      };

      el.innerHTML = `
        <a href="#" class="history-link">
          ${item.favicon ? `<img src="${item.favicon}" class="item-icon">` : "🔗"}
          <div class="history-content">
            <span class="history-title">${item.title}</span>
            <span class="history-url">${new URL(item.url).hostname}</span>
          </div>
          <span class="history-time">${timeStr.hour}:${timeStr.minute}</span>
        </a>
      `;

      el.querySelector(".history-link").addEventListener("click", (e) => {
        e.preventDefault();
        navigate(item.url);
      });

      fragment.appendChild(el);
    });

    elements.historyList.innerHTML = "";
    elements.historyList.appendChild(fragment);
  }

  function renderDownloads() {
    if (!elements.downloadsList) return;

    const el = elements.downloadsList;
    el.innerHTML = "";

    if (state.downloads.length === 0) {
      el.innerHTML =
        '<div style="padding: 1rem; color: var(--text-secondary);">No downloads yet</div>';
      return;
    }

    const fragment = document.createDocumentFragment();
    state.downloads.forEach((download) => {
      const item = document.createElement("div");
      item.className = "download-item";
      item.innerHTML = `
        <span class="download-name">${download.name}</span>
        <span class="download-size">${download.size}</span>
      `;
      fragment.appendChild(item);
    });

    el.appendChild(fragment);
  }

  // ============ UI Controls ============

  function toggleDownloads() {
    if (elements.downloadsPanel) {
      elements.downloadsPanel.style.display =
        elements.downloadsPanel.style.display === "none" ? "block" : "none";
      renderDownloads();
    }
  }

  function toggleMenu() {
    if (elements.menuDropdown) {
      elements.menuDropdown.style.display =
        elements.menuDropdown.style.display === "none" ? "block" : "none";
    }
  }

  function handleMenuAction(action) {
    switch (action) {
      case "settings":
        console.log("Open settings");
        break;
      case "history":
        console.log("Show history");
        break;
      case "bookmarks":
        console.log("Show bookmarks");
        break;
      case "downloads":
        toggleDownloads();
        break;
    }
  }

  // ============ Event Listeners ============

  function initEventListeners() {
    // New tab
    if (elements.newTabBtn) {
      elements.newTabBtn.addEventListener("click", () => createTab());
    }

    // URL input
    if (elements.urlInput) {
      elements.urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          navigate(elements.urlInput.value);
        }
      });
    }

    // Search
    if (elements.searchInput) {
      elements.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          navigate(elements.searchInput.value);
        }
      });
    }

    if (elements.searchBtn) {
      elements.searchBtn.addEventListener("click", () => {
        navigate(elements.searchInput.value);
      });
    }

    // Shortcuts
    elements.shortcuts?.forEach((shortcut) => {
      shortcut.addEventListener("click", () => {
        const url = shortcut.getAttribute("data-url");
        navigate(url);
      });
    });

    // Navigation buttons
    if (elements.navBack) {
      elements.navBack.addEventListener("click", goBack);
    }
    if (elements.navForward) {
      elements.navForward.addEventListener("click", goForward);
    }
    if (elements.navReload) {
      elements.navReload.addEventListener("click", reload);
    }

    // Menu
    if (elements.menuBtn) {
      elements.menuBtn.addEventListener("click", toggleMenu);
    }

    // Bookmark button
    if (elements.bookmarkBtn) {
      elements.bookmarkBtn.addEventListener("click", () => {
        const tab = state.tabs.find((t) => t.id === state.activeTabId);
        if (tab) {
          addBookmark(tab.url, tab.title);
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + T: New tab
      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault();
        createTab();
      }
      // Ctrl/Cmd + W: Close tab
      if ((e.ctrlKey || e.metaKey) && e.key === "w" && state.activeTabId) {
        e.preventDefault();
        closeTab(state.activeTabId);
      }
      // F5: Reload
      if (e.key === "F5") {
        e.preventDefault();
        reload();
      }
      // F6 or Ctrl/Cmd + L: Focus URL bar
      if (e.key === "F6" || (e.ctrlKey && e.key === "l")) {
        e.preventDefault();
        if (elements.urlInput) {
          elements.urlInput.focus();
          elements.urlInput.select();
        }
      }
    });

    // Sidebar toggle
    if (elements.sidebarToggle) {
      elements.sidebarToggle.addEventListener("click", () => {
        if (elements.sidebar) {
          elements.sidebar.classList.toggle("hidden");
        }
      });
    }

    // Close downloads
    if (elements.closeDownloads) {
      elements.closeDownloads.addEventListener("click", toggleDownloads);
    }
  }

  function updateTime() {
    if (elements.statusTime) {
      const now = new Date();
      elements.statusTime.textContent = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
  }

  function updateTabCount() {
    if (elements.statusTabs) {
      elements.statusTabs.textContent = `${state.tabs.length} tab${state.tabs.length !== 1 ? "s" : ""}`;
    }
  }

  // ============ Initialization ============

  async function init() {
    console.log("🚀 Initializing Zed Browser...");

    loadState();
    initEventListeners();

    // Create initial tab if none exist
    if (state.tabs.length === 0) {
      createTab(state.settings.homeUrl, "Home");
    }

    // Initial render
    renderTabs();
    renderBookmarks();
    renderHistory();
    updateWebview();
    updateTime();
    updateTabCount();

    // Update time every second
    setInterval(updateTime, 1000);

    console.log("✅ Zed Browser initialized successfully");
  }

  // Start the application
  await init();
})();
