let currentUrl = 'about:blank';
let engines = [];
let selectedEngine = null;

async function init() {
  const { invoke } = window.__TAURI__;
  
  engines = await invoke('get_browser_engines');
  selectedEngine = await invoke('get_selected_engine');
  
  updateEngineDisplay();
  setupWebView();
  setupEventListeners();
  loadSettings();
}

function setupWebView() {
  const iframe = document.getElementById('webview');
  
  iframe.addEventListener('load', () => {
    document.getElementById('reloadBtn').textContent = '↻';
    try {
      currentUrl = iframe.contentWindow.location.href;
      document.getElementById('addressBar').value = currentUrl;
    } catch (e) {
      // Cross-origin restrictions
    }
    updateNavigationButtons();
  });
}

function setupEventListeners() {
  document.getElementById('addressBar').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const input = e.target.value.trim();
      navigateToUrl(input);
    }
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
  });

  document.getElementById('forwardBtn').addEventListener('click', () => {
    window.history.forward();
  });

  document.getElementById('reloadBtn').addEventListener('click', () => {
    const iframe = document.getElementById('webview');
    iframe.src = iframe.src; // Reload by resetting src
  });

  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsPanel').classList.add('open');
  });

  document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsPanel').classList.remove('open');
  });

  // Window controls
  const { appWindow } = window.__TAURI__;
  
  document.getElementById('minimizeBtn').addEventListener('click', async () => {
    await appWindow.minimize();
  });

  document.getElementById('maximizeBtn').addEventListener('click', async () => {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  });

  document.getElementById('closeBtn').addEventListener('click', async () => {
    await appWindow.close();
  });
}

function navigateToUrl(input) {
  const iframe = document.getElementById('webview');
  
  let url = input;
  
  // If it doesn't look like a URL, treat it as a search
  if (!input.includes('.') || input.includes(' ')) {
    url = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
  } else {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
  }
  
  iframe.src = url;
  currentUrl = url;
}

function updateNavigationButtons() {
  // Basic navigation state - could be enhanced with history tracking
  document.getElementById('backBtn').disabled = false;
  document.getElementById('forwardBtn').disabled = false;
}

function updateEngineDisplay() {
  const engine = engines.find(e => e.id === selectedEngine);
  if (engine) {
    document.getElementById('currentEngine').textContent = `(${engine.name})`;
  }
}

async function loadSettings() {
  // Load engine options
  const engineOptions = document.getElementById('engineOptions');
  engineOptions.innerHTML = '';

  engines.forEach(engine => {
    const option = document.createElement('div');
    option.className = 'engine-option';
    if (engine.id === selectedEngine) {
      option.classList.add('selected');
    }
    
    option.innerHTML = `
      <div class="engine-option-name">${engine.name}</div>
      <div class="engine-option-desc">${engine.description}</div>
    `;

    option.addEventListener('click', async () => {
      const { invoke } = window.__TAURI__;
      selectedEngine = engine.id;
      await invoke('set_selected_engine', { engineId: engine.id });
      updateEngineDisplay();
      loadSettings(); // Reload to update selection
      
      // Reload current page with new engine
      const iframe = document.getElementById('webview');
      if (iframe.src && iframe.src !== 'about:blank') {
        iframe.src = iframe.src; // Reload
      }
    });

    engineOptions.appendChild(option);
  });

  // Load ad blocking toggle
  const { invoke } = window.__TAURI__;
  const adBlockingEnabled = await invoke('get_ad_blocking_enabled');
  const toggle = document.getElementById('adBlockingToggle');
  if (adBlockingEnabled) {
    toggle.classList.add('active');
  }

  toggle.addEventListener('click', async () => {
    const isActive = toggle.classList.contains('active');
    const newState = !isActive;
    
    await invoke('set_ad_blocking_enabled', { enabled: newState });
    
    if (newState) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }

    // Reload to apply changes
    const iframe = document.getElementById('webview');
    if (iframe.src && iframe.src !== 'about:blank') {
      iframe.src = iframe.src; // Reload
    }
  });
}

init();
