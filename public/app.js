const { invoke } = window.__TAURI__ || {};

let tabs = [];
let activeTabId = null;
let tabIdCounter = 1;

const webview = document.getElementById('webview');
const startPage = document.getElementById('start-page');
const urlInput = document.getElementById('url-input');
const tabList = document.getElementById('tab-list');
const newTabBtn = document.getElementById('new-tab-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const tabTree = document.getElementById('tab-tree');

function createTab(url = null, title = 'New Tab') {
  const id = 'tab-' + (tabIdCounter++);
  const tab = { id, url, title };
  tabs.push(tab);
  
  if (!activeTabId) {
    activeTabId = id;
  }
  
  renderTabs();
  renderTabTree();
  return tab;
}

function switchTab(id) {
  activeTabId = id;
  const tab = tabs.find(t => t.id === id);
  if (tab) {
    urlInput.value = tab.url || '';
    renderTabs();
    renderTabTree();
    updateWebview();
  }
}

function closeTab(id) {
  const index = tabs.findIndex(t => t.id === id);
  if (index === -1) return;
  
  tabs.splice(index, 1);
  
  if (activeTabId === id) {
    if (tabs.length > 0) {
      activeTabId = tabs[Math.min(index, tabs.length - 1)].id;
    } else {
      activeTabId = null;
    }
  }
  
  renderTabs();
  renderTabTree();
  updateWebview();
}

function navigate(url) {
  if (!url) return;
  
  let finalUrl = url.trim();
  
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
      finalUrl = 'https://' + finalUrl;
    } else {
      finalUrl = 'https://www.google.com/search?q=' + encodeURIComponent(finalUrl);
    }
  }
  
  if (activeTabId) {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) {
      tab.url = finalUrl;
      urlInput.value = finalUrl;
      renderTabs();
      updateWebview();
    }
  } else {
    const tab = createTab(finalUrl, finalUrl);
    activeTabId = tab.id;
    renderTabs();
    updateWebview();
  }
}

function updateWebview() {
  if (activeTabId) {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.url) {
      startPage.style.display = 'none';
      webview.style.display = 'block';
      webview.src = tab.url;
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
  tabList.innerHTML = '';
  tabs.forEach(tab => {
    const el = document.createElement('button');
    el.className = 'editor-tab' + (tab.id === activeTabId ? ' active' : '');
    el.innerHTML = `
      <span>${tab.title}</span>
      <span class="tab-close" onclick="closeTab('${tab.id}')">×</span>
    `;
    el.onclick = () => switchTab(tab.id);
    tabList.appendChild(el);
  });
}

function renderTabTree() {
  tabTree.innerHTML = '';
  tabs.forEach(tab => {
    const el = document.createElement('div');
    el.className = 'tab-tree-item' + (tab.id === activeTabId ? ' active' : '');
    el.innerHTML = `📄 ${tab.title}`;
    el.onclick = () => switchTab(tab.id);
    tabTree.appendChild(el);
  });
}

newTabBtn.onclick = () => {
  createTab();
};

urlInput.onkeydown = (e) => {
  if (e.key === 'Enter') {
    navigate(urlInput.value);
  }
};

searchInput.onkeydown = (e) => {
  if (e.key === 'Enter') {
    navigate(searchInput.value);
  }
};

searchBtn.onclick = () => navigate(searchInput.value);

webview.onload = () => {
  if (activeTabId) {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) {
      tab.title = webview.contentWindow.document.title || 'Untitled';
      renderTabs();
      renderTabTree();
    }
  }
};

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 't') {
    e.preventDefault();
    createTab();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'w' && activeTabId) {
    e.preventDefault();
    closeTab(activeTabId);
  }
  if (e.key === 'F5') {
    e.preventDefault();
    if (webview.style.display === 'block') {
      webview.reload();
    }
  }
});

createTab();
updateWebview();