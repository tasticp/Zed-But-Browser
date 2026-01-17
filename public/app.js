(async () => {
  const { invoke } = window.__TAURI__ || {};

  const backBtn = document.getElementById('btn-back');
  const forwardBtn = document.getElementById('btn-forward');
  const reloadBtn = document.getElementById('btn-reload');
  const urlInput = document.getElementById('url-input');
  const menuBtn = document.getElementById('btn-menu');
  const browserContent = document.getElementById('browser-content');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('btn-search');

  let currentUrl = '';

  async function goBack() {
    if (invoke) {
      try { await invoke('go_back'); } catch (e) { console.error(e); }
    }
  }

  async function goForward() {
    if (invoke) {
      try { await invoke('go_forward'); } catch (e) { console.error(e); }
    }
  }

  async function reload() {
    if (invoke) {
      try { await invoke('reload_page'); } catch (e) { console.error(e); }
    }
  }

  async function navigate(url) {
    if (!url) return;
    
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        finalUrl = 'https://www.google.com/search?q=' + encodeURIComponent(finalUrl);
      }
    }

    currentUrl = finalUrl;
    urlInput.value = finalUrl;

    if (invoke) {
      try {
        await invoke('navigate', { url: finalUrl });
      } catch (e) {
        loadIframe(finalUrl);
      }
    } else {
      loadIframe(finalUrl);
    }
  }

  function loadIframe(url) {
    browserContent.innerHTML = `<iframe src="${url}" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>`;
  }

  backBtn.addEventListener('click', goBack);
  forwardBtn.addEventListener('click', goForward);
  reloadBtn.addEventListener('click', reload);

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      navigate(urlInput.value);
    }
  });

  searchBtn.addEventListener('click', () => {
    navigate(searchInput.value);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      navigate(searchInput.value);
    }
  });

  menuBtn.addEventListener('click', () => {
    alert('Menu - Configure Zed Browser');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'F5') {
      e.preventDefault();
      reload();
    }
    if (e.key === 'F6' || (e.ctrlKey && e.key === 'l')) {
      e.preventDefault();
      urlInput.focus();
      urlInput.select();
    }
  });
})();
