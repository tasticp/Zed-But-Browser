let selectedEngine = null;
let engines = [];

async function init() {
  const { invoke } = window.__TAURI__;
  
  // Check if already completed onboarding
  const hasCompleted = await invoke('has_completed_onboarding');
  if (hasCompleted) {
    window.location.href = 'index.html';
    return;
  }
  
  engines = await invoke('get_browser_engines');
  const currentEngine = await invoke('get_selected_engine');
  const adBlockingEnabled = await invoke('get_ad_blocking_enabled');

  renderEngines();
  selectEngine(currentEngine);
  
  document.getElementById('adBlocking').checked = adBlockingEnabled;
}

function renderEngines() {
  const grid = document.getElementById('engineGrid');
  grid.innerHTML = '';

  engines.forEach(engine => {
    const card = document.createElement('div');
    card.className = 'engine-card';
    card.dataset.engineId = engine.id;
    
    card.innerHTML = `
      <div class="engine-name">${engine.name}</div>
      <div class="engine-description">${engine.description}</div>
    `;

    card.addEventListener('click', () => selectEngine(engine.id));
    grid.appendChild(card);
  });
}

function selectEngine(engineId) {
  selectedEngine = engineId;
  
  document.querySelectorAll('.engine-card').forEach(card => {
    if (card.dataset.engineId === engineId) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });

  document.getElementById('continueBtn').disabled = false;
}

document.getElementById('continueBtn').addEventListener('click', async () => {
  const { invoke } = window.__TAURI__;
  const adBlockingEnabled = document.getElementById('adBlocking').checked;
  
  await invoke('set_selected_engine', { engineId: selectedEngine });
  await invoke('set_ad_blocking_enabled', { enabled: adBlockingEnabled });
  await invoke('complete_onboarding');
  
  // Navigate to main browser
  window.location.href = 'index.html';
});

init();
