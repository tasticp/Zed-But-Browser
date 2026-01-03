/*
  browser.js - enhanced to integrate Tauri browser commands
  - adds a lightweight left sidebar (breadcrumb-like tab list)
  - integrates tab APIs (list/open/close/switch/navigate/back/forward)
  - uses `build_search_url` for omnibox searches so search engine is configurable
  - keeps memory footprint: single iframe webview reused for tabs
*/

let currentUrl = "about:blank";
let engines = [];
let selectedEngine = null;
let tabs = [];
let activeTabId = null;

async function init() {
  const { invoke } = window.__TAURI__;

  // Ensure there's at least one tab (backend will create if needed)
  try {
    activeTabId = await invoke("ensure_at_least_one_tab");
  } catch (e) {
    // ignore - fallback below
  }

  engines = await invoke("get_browser_engines");
  selectedEngine = await invoke("get_selected_engine");

  // Build UI pieces (sidebar + toolbar + webview hookup)
  renderLayout();
  setupWebView();
  setupEventListeners();

  // Populate sidebar & settings
  await refreshTabs();
  await loadSettings();
}

function renderLayout() {
  // Insert a left sidebar into the existing DOM (minimal and lightweight)
  const container = document.querySelector(".browser-container");
  if (!container) return;

  // Create shell for main area + sidebar if not exists
  let sidebar = document.getElementById("leftSidebar");
  if (!sidebar) {
    sidebar = document.createElement("div");
    sidebar.id = "leftSidebar";
    sidebar.style.cssText =
      "width:260px;background:#ffffff;box-shadow:2px 0 8px rgba(0,0,0,0.06);display:flex;flex-direction:column;gap:0;overflow:auto;";

    // Header with new tab button
    const header = document.createElement("div");
    header.style.cssText =
      "padding:12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eee;";
    const title = document.createElement("div");
    title.textContent = "Tabs";
    title.style.fontWeight = "600";
    const newBtn = document.createElement("button");
    newBtn.textContent = "+";
    newBtn.title = "New Tab";
    newBtn.style.cssText =
      "height:32px;width:32px;border-radius:6px;border:1px solid #ddd;background:#fafafa;cursor:pointer";
    newBtn.addEventListener("click", async () => {
      await createNewTab();
    });

    header.appendChild(title);
    header.appendChild(newBtn);

    // Tabs list
    const tabsList = document.createElement("div");
    tabsList.id = "tabsList";
    tabsList.style.cssText =
      "padding:8px;display:flex;flex-direction:column;gap:6px;";

    // Breadcrumb area for active tab (history crumb)
    const crumb = document.createElement("div");
    crumb.id = "tabBreadcrumb";
    crumb.style.cssText =
      "padding:10px;border-top:1px solid #eee;font-size:13px;color:#666";

    sidebar.appendChild(header);
    sidebar.appendChild(tabsList);
    sidebar.appendChild(crumb);

    // Insert sidebar before the webview container
    const webviewContainer = document.querySelector(".webview-container");
    if (webviewContainer) {
      webviewContainer.style.marginLeft = "260px"; // make room visually
      webviewContainer.parentNode.insertBefore(sidebar, webviewContainer);
    } else {
      container.insertBefore(sidebar, container.firstChild);
    }
  }
}

function setupWebView() {
  const iframe = document.getElementById("webview");

  iframe.addEventListener("load", async () => {
    document.getElementById("reloadBtn").textContent = "↻";
    try {
      // Try to read URL (may be blocked cross-origin)
      currentUrl = iframe.contentWindow.location.href;
      document.getElementById("addressBar").value = currentUrl;
    } catch (e) {
      // Cross-origin: keep the last known URL
    }
    updateNavigationButtons();
    await refreshBreadcrumb(); // update breadcrumb for active tab
  });
}

function setupEventListeners() {
  const { appWindow } = window.__TAURI__;

  document
    .getElementById("addressBar")
    .addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        const input = e.target.value.trim();
        await handleOmniboxInput(input);
      }
    });

  document.getElementById("backBtn").addEventListener("click", async () => {
    if (activeTabId === null) return;
    const { invoke } = window.__TAURI__;
    const res = await invoke("tab_go_back", { id: activeTabId });
    if (res) {
      const iframe = document.getElementById("webview");
      iframe.src = res;
    }
  });

  document.getElementById("forwardBtn").addEventListener("click", async () => {
    if (activeTabId === null) return;
    const { invoke } = window.__TAURI__;
    const res = await invoke("tab_go_forward", { id: activeTabId });
    if (res) {
      const iframe = document.getElementById("webview");
      iframe.src = res;
    }
  });

  document.getElementById("reloadBtn").addEventListener("click", () => {
    const iframe = document.getElementById("webview");
    // Force reload by resetting src
    iframe.src = iframe.src;
  });

  document.getElementById("settingsBtn").addEventListener("click", () => {
    document.getElementById("settingsPanel").classList.add("open");
  });

  document.getElementById("closeSettingsBtn").addEventListener("click", () => {
    document.getElementById("settingsPanel").classList.remove("open");
  });

  // Window controls
  if (appWindow) {
    document
      .getElementById("minimizeBtn")
      .addEventListener("click", async () => {
        await appWindow.minimize();
      });

    document
      .getElementById("maximizeBtn")
      .addEventListener("click", async () => {
        const isMaximized = await appWindow.isMaximized();
        if (isMaximized) {
          await appWindow.unmaximize();
        } else {
          await appWindow.maximize();
        }
      });

    document.getElementById("closeBtn").addEventListener("click", async () => {
      await appWindow.close();
    });
  }
}

async function handleOmniboxInput(input) {
  const { invoke } = window.__TAURI__;
  let url = input;

  // treat empty as nothing
  if (!input) return;

  // heuristic: if it doesn't look like a URL treat as search
  if (!input.includes(".") || input.includes(" ")) {
    // Use backend to build search URL based on selected engine
    url = await invoke("build_search_url", { query: input });
  } else {
    // add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
  }

  // navigate the active tab
  if (activeTabId === null) {
    // open a new tab if none selected
    const id = await createNewTab(url);
    await switchToTab(id);
  } else {
    await navigateTab(activeTabId, url);
  }

  // set iframe
  const iframe = document.getElementById("webview");
  iframe.src = url;
  currentUrl = url;
}

async function refreshTabs() {
  const { invoke } = window.__TAURI__;
  tabs = await invoke("list_tabs");
  const active = await invoke("get_active_tab");
  activeTabId = active ? active.id : tabs.length ? tabs[0].id : null;
  renderTabsList();
  await refreshBreadcrumb();
}

function renderTabsList() {
  const list = document.getElementById("tabsList");
  if (!list) return;
  list.innerHTML = "";

  tabs.forEach((tab) => {
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;align-items:center;justify-content:space-between;padding:8px;border-radius:8px;cursor:pointer";
    if (tab.id === activeTabId) {
      row.style.background = "#f0f4ff";
      row.style.border = "1px solid #e2e8ff";
    } else {
      row.style.background = "transparent";
    }

    const title = document.createElement("div");
    title.style.cssText =
      "flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px;";
    title.textContent = tab.title || tab.url || "about:blank";
    title.title = tab.url;

    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;gap:6px;align-items:center;";

    const openBtn = document.createElement("button");
    openBtn.textContent = "⋯";
    openBtn.title = "Open";
    openBtn.style.cssText =
      "height:28px;border-radius:6px;border:1px solid #eee;background:#fff;cursor:pointer";
    openBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // future context menu
      // For now: navigate this tab to about:blank
      // No-op placeholder
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.title = "Close Tab";
    closeBtn.style.cssText =
      "height:28px;border-radius:6px;border:1px solid #eee;background:#fff;cursor:pointer";
    closeBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      await closeTab(tab.id);
    });

    row.addEventListener("click", async () => {
      await switchToTab(tab.id);
    });

    controls.appendChild(openBtn);
    controls.appendChild(closeBtn);

    row.appendChild(title);
    row.appendChild(controls);

    list.appendChild(row);
  });
}

async function refreshBreadcrumb() {
  const crumb = document.getElementById("tabBreadcrumb");
  if (!crumb) return;
  crumb.innerHTML = "";
  const active = tabs.find((t) => t.id === activeTabId) || null;
  if (!active) return;
  // Show simple history crumbs
  const maxCrumbs = 6;
  const start = Math.max(0, active.history.length - maxCrumbs);
  const crumbs = active.history.slice(start).map((u, idx) => {
    const a = document.createElement("a");
    a.href = "#";
    a.textContent = simplifyUrl(u);
    a.style.cssText =
      "margin-right:8px;color:#3b82f6;text-decoration:none;font-size:13px";
    a.addEventListener("click", async (e) => {
      e.preventDefault();
      // navigate to that history entry in the tab
      await navigateTab(active.id, u);
      document.getElementById("webview").src = u;
    });
    return a;
  });
  crumbs.forEach((c) => crumb.appendChild(c));
}

function simplifyUrl(u) {
  try {
    const url = new URL(u);
    return url.hostname + (url.pathname !== "/" ? url.pathname : "");
  } catch (e) {
    return u;
  }
}

async function createNewTab(url = "about:blank") {
  const { invoke } = window.__TAURI__;
  const id = await invoke("open_tab", { url });
  await refreshTabs();
  // navigate iframe to the new tab URL
  activeTabId = id;
  const tab = tabs.find((t) => t.id === id);
  const to = tab && tab.url ? tab.url : url;
  document.getElementById("webview").src = to;
  return id;
}

async function closeTab(id) {
  const { invoke } = window.__TAURI__;
  const ok = await invoke("close_tab", { id });
  if (ok) {
    await refreshTabs();
    const active = await invoke("get_active_tab");
    if (active) {
      document.getElementById("webview").src = active.url;
    }
  }
}

async function switchToTab(id) {
  const { invoke } = window.__TAURI__;
  const ok = await invoke("switch_tab", { id });
  if (ok) {
    await refreshTabs(); // refresh will set activeTabId and update list
    const active = await invoke("get_active_tab");
    if (active) {
      document.getElementById("webview").src = active.url;
      document.getElementById("addressBar").value = active.url;
    }
  }
}

async function navigateTab(id, url) {
  const { invoke } = window.__TAURI__;
  const ok = await invoke("navigate_tab", { id, url });
  if (ok) {
    // update local cached tabs quickly
    const tab = tabs.find((t) => t.id === id);
    if (tab) {
      tab.url = url;
      tab.history = tab.history || [];
      tab.history.push(url);
      tab.history_index = tab.history.length - 1;
    }
  }
}

function updateNavigationButtons() {
  // enable by default (stateful control could be added by querying tab.can_go_back)
  document.getElementById("backBtn").disabled = false;
  document.getElementById("forwardBtn").disabled = false;
}

/*
  Centered omnibox overlay helpers.
  - Creates a single overlay in the DOM on first use.
  - `showCenterSearchOverlay()` focuses the input so users can immediately type.
  - When Enter is pressed the overlay will call the existing `handleOmniboxInput`
    function and then hide itself.
*/
function createCenterSearchOverlay() {
  if (document.getElementById("centerSearchOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "centerSearchOverlay";
  overlay.style.cssText = `
    position:fixed;
    left:0;top:0;right:0;bottom:0;
    display:flex;
    align-items:center;
    justify-content:center;
    pointer-events:none;
    z-index:2000;
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    width:680px;
    max-width:90%;
    background:rgba(255,255,255,0.98);
    border-radius:12px;
    box-shadow:0 15px 40px rgba(2,6,23,0.15);
    padding:14px;
    pointer-events:auto;
  `;

  const input = document.createElement("input");
  input.id = "centerOmniboxInput";
  input.placeholder = "Search or Enter URL...";
  input.style.cssText = `
    width:100%;
    padding:12px 16px;
    border-radius:10px;
    border:1px solid #e6e6e6;
    font-size:15px;
    outline:none;
    box-sizing:border-box;
  `;

  // Enter handler: use existing omnibox path
  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const val = input.value.trim();
      if (val) {
        // hide first to give a smoother UX
        hideCenterSearchOverlay();
        await handleOmniboxInput(val);
      }
    }
    if (e.key === "Escape") {
      hideCenterSearchOverlay();
    }
  });

  // click outside to close
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      hideCenterSearchOverlay();
    }
  });

  card.appendChild(input);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

function showCenterSearchOverlay(initialValue = "") {
  createCenterSearchOverlay();
  const overlay = document.getElementById("centerSearchOverlay");
  if (!overlay) return;
  overlay.style.display = "flex";
  const input = document.getElementById("centerOmniboxInput");
  if (input) {
    input.value = initialValue || "";
    // small timeout to ensure element is focusable
    setTimeout(() => input.focus(), 20);
  }
}

function hideCenterSearchOverlay() {
  const overlay = document.getElementById("centerSearchOverlay");
  if (!overlay) return;
  overlay.style.display = "none";
}

function updateEngineDisplay() {
  const engine = engines.find((e) => e.id === selectedEngine);
  if (engine) {
    document.getElementById("currentEngine").textContent = `(${engine.name})`;
  }
}

async function loadSettings() {
  // Load engine options
  const engineOptions = document.getElementById("engineOptions");
  engineOptions.innerHTML = "";

  engines.forEach((engine) => {
    const option = document.createElement("div");
    option.className = "engine-option";
    if (engine.id === selectedEngine) {
      option.classList.add("selected");
    }

    option.innerHTML = `
      <div class="engine-option-name">${engine.name}</div>
      <div class="engine-option-desc">${engine.description}</div>
    `;

    option.addEventListener("click", async () => {
      const { invoke } = window.__TAURI__;
      selectedEngine = engine.id;
      await invoke("set_selected_engine", { engineId: engine.id });
      updateEngineDisplay();
      loadSettings(); // Reload to update selection

      // Reload current page with new engine
      const iframe = document.getElementById("webview");
      if (iframe.src && iframe.src !== "about:blank") {
        iframe.src = iframe.src; // Reload
      }
    });

    engineOptions.appendChild(option);
  });

  // Load ad blocking toggle via unified preferences API
  const { invoke } = window.__TAURI__;
  try {
    // get_preferences now returns (selectedEngine, adBlockingEnabled, centerSearchFlag)
    const prefs = await invoke("get_preferences");
    const adBlockingEnabled = prefs ? prefs[1] : true;
    const centerSearchEnabled = prefs ? prefs[2] : true;

    // Ad-block toggle
    const toggle = document.getElementById("adBlockingToggle");
    if (adBlockingEnabled) {
      toggle.classList.add("active");
    } else {
      toggle.classList.remove("active");
    }

    toggle.onclick = async () => {
      const isActive = toggle.classList.contains("active");
      const newState = !isActive;
      await invoke("set_ad_blocking_enabled", { enabled: newState });
      if (newState) toggle.classList.add("active");
      else toggle.classList.remove("active");
      const iframe = document.getElementById("webview");
      if (iframe.src && iframe.src !== "about:blank") iframe.src = iframe.src;
    };

    // Center-search toggle UI (small switch in the settings panel)
    // create element if it doesn't exist (keeps markup minimal)
    if (!document.getElementById("centerSearchToggle")) {
      const sec = document.createElement("div");
      sec.style.cssText =
        "display:flex;justify-content:space-between;align-items:center;padding:12px;border:2px solid #e0e0e0;border-radius:12px;margin-top:10px;background:#fff;";
      const label = document.createElement("div");
      label.textContent = "Center omnibox on New Tab";
      label.style.fontWeight = "500";
      const switchEl = document.createElement("div");
      switchEl.id = "centerSearchToggle";
      switchEl.className = centerSearchEnabled
        ? "toggle-switch active"
        : "toggle-switch";
      switchEl.style.cssText = "cursor:pointer";
      switchEl.addEventListener("click", async () => {
        const isActive = switchEl.classList.contains("active");
        const newState = !isActive;
        try {
          await invoke("set_center_search_on_new_tab", { enabled: newState });
          if (newState) switchEl.classList.add("active");
          else switchEl.classList.remove("active");
        } catch (err) {
          console.error("Failed to set center-search preference", err);
        }
      });
      sec.appendChild(label);
      sec.appendChild(switchEl);
      // insert above adblock rules area if present
      const settingsContent = document.querySelector(".settings-content");
      if (settingsContent) {
        settingsContent.insertBefore(
          sec,
          settingsContent.firstChild.nextSibling,
        );
      }
    }
  } catch (e) {
    // ignore and keep default
  }

  // --- Ad-block rules UI / management (dynamic) ---
  // Create a container under the settings panel for adblock rule controls
  (function createAdblockUI() {
    const settingsContent = document.querySelector(".settings-content");
    if (!settingsContent) return;

    // Avoid creating duplicate container
    if (document.getElementById("adblockRulesContainer")) return;

    const container = document.createElement("div");
    container.id = "adblockRulesContainer";
    container.style.cssText =
      "margin-top:16px;padding-top:12px;border-top:1px dashed #eee;";

    const header = document.createElement("div");
    header.style.cssText =
      "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;";
    const title = document.createElement("div");
    title.textContent = "Ad Block Rules";
    title.style.fontWeight = "600";
    title.style.color = "#333";
    const controls = document.createElement("div");

    const reloadBtn = document.createElement("button");
    reloadBtn.textContent = "Reload Rules";
    reloadBtn.style.cssText =
      "margin-right:8px;padding:6px 10px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;";
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset Defaults";
    resetBtn.style.cssText =
      "padding:6px 10px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;";

    controls.appendChild(reloadBtn);
    controls.appendChild(resetBtn);

    header.appendChild(title);
    header.appendChild(controls);
    container.appendChild(header);

    // Rules list area
    const listArea = document.createElement("div");
    listArea.id = "adblockRulesList";
    listArea.style.cssText = "max-height:200px;overflow:auto;padding:6px 0;";

    container.appendChild(listArea);

    // Add rule form
    const form = document.createElement("div");
    form.style.cssText =
      "display:flex;gap:8px;margin-top:10px;align-items:center;";

    const kindSelect = document.createElement("select");
    kindSelect.id = "adblockRuleKind";
    ["Domain", "Substring", "Wildcard"].forEach((k) => {
      const o = document.createElement("option");
      o.value = k;
      o.textContent = k;
      kindSelect.appendChild(o);
    });
    kindSelect.style.cssText =
      "padding:8px;border-radius:8px;border:1px solid #ddd;background:#fff";

    const patternInput = document.createElement("input");
    patternInput.id = "adblockPatternInput";
    patternInput.placeholder =
      "Pattern (e.g. doubleclick.net or /ads.js or *.ads/*)";
    patternInput.style.cssText =
      "flex:1;padding:8px;border-radius:8px;border:1px solid #ddd;";

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add";
    addBtn.style.cssText =
      "padding:8px 12px;border-radius:8px;border:1px solid #2b6cb0;background:#2b6cb0;color:#fff;cursor:pointer;";

    form.appendChild(kindSelect);
    form.appendChild(patternInput);
    form.appendChild(addBtn);

    container.appendChild(form);

    // Append to settings content
    settingsContent.appendChild(container);

    // Helper: render rules list
    async function renderRules() {
      listArea.innerHTML = "";
      try {
        const rules = await invoke("list_rules");
        if (!Array.isArray(rules) || rules.length === 0) {
          const empty = document.createElement("div");
          empty.textContent = "No ad-block rules configured (using defaults).";
          empty.style.color = "#666";
          listArea.appendChild(empty);
          return;
        }
        rules.forEach((r, idx) => {
          const row = document.createElement("div");
          row.style.cssText =
            "display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-radius:6px;margin-bottom:6px;background:#fafafa;border:1px solid #f0f0f0;";
          const left = document.createElement("div");
          left.style.cssText =
            "flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
          left.textContent = `${r.kind} — ${r.pattern}`;
          const removeBtn = document.createElement("button");
          removeBtn.textContent = "Remove";
          removeBtn.style.cssText =
            "padding:6px 10px;border-radius:6px;border:1px solid #ddd;background:#fff;cursor:pointer;margin-left:8px;";
          removeBtn.addEventListener("click", async () => {
            // call remove_rule(kind, pattern)
            try {
              await invoke("remove_rule", { kind: r.kind, pattern: r.pattern });
              await renderRules();
            } catch (err) {
              console.error("Failed to remove rule", err);
            }
          });
          row.appendChild(left);
          row.appendChild(removeBtn);
          listArea.appendChild(row);
        });
      } catch (err) {
        const errEl = document.createElement("div");
        errEl.textContent = "Failed to load rules";
        errEl.style.color = "red";
        listArea.appendChild(errEl);
        console.error(err);
      }
    }

    // Add button handler
    addBtn.addEventListener("click", async () => {
      const kind = kindSelect.value;
      const pattern = patternInput.value.trim();
      if (!pattern) return;
      try {
        await invoke("add_rule", {
          kind: kind,
          pattern: pattern,
          description: null,
        });
        patternInput.value = "";
        await renderRules();
        // optionally reload webview to apply
        const iframe = document.getElementById("webview");
        if (iframe && iframe.src && iframe.src !== "about:blank")
          iframe.src = iframe.src;
      } catch (err) {
        console.error("Failed to add rule", err);
      }
    });

    // Reload and reset handlers
    reloadBtn.addEventListener("click", async () => {
      try {
        await invoke("reload_rules");
        await renderRules();
      } catch (err) {
        console.error("Failed to reload rules", err);
      }
    });

    resetBtn.addEventListener("click", async () => {
      if (!confirm("Reset ad-block rules to built-in defaults?")) return;
      try {
        await invoke("reset_to_default_rules");
        await renderRules();
        const iframe = document.getElementById("webview");
        if (iframe && iframe.src && iframe.src !== "about:blank")
          iframe.src = iframe.src;
      } catch (err) {
        console.error("Failed to reset rules", err);
      }
    });

    // initial render
    renderRules();
  })();
}

// initialize
init();
