let selectedEngine = null;
let engines = [];

function getInvoke() {
  // Prefer the Tauri global invoke when available, but don't destructure window.__TAURI__
  if (typeof window !== "undefined") {
    if (window.__TAURI__) {
      if (typeof window.__TAURI__.invoke === "function") {
        return window.__TAURI__.invoke.bind(window.__TAURI__);
      }
      if (
        window.__TAURI__.tauri &&
        typeof window.__TAURI__.tauri.invoke === "function"
      ) {
        return window.__TAURI__.tauri.invoke.bind(window.__TAURI__.tauri);
      }
    }
  }

  // Fallback for non-Tauri (dev) environments using localStorage
  console.warn(
    "Tauri invoke not available; using localStorage fallback for invoke()",
  );
  return async (cmd, args) => {
    const readPrefs = () => {
      try {
        const raw = localStorage.getItem("zed_browser_prefs_v1");
        if (raw) return JSON.parse(raw);
      } catch (e) {
        /* ignore parse errors */
      }
      return {
        engine: "chromium",
        ad_blocking: true,
        center_search: true,
        onboarding_completed: false,
      };
    };
    const savePrefs = (prefs) => {
      try {
        localStorage.setItem("zed_browser_prefs_v1", JSON.stringify(prefs));
      } catch (e) {
        /* ignore storage errors */
      }
    };

    switch (cmd) {
      case "get_browser_engines":
        return [
          { id: "chromium", name: "Chromium", description: "Fast and modern" },
          { id: "firefox", name: "Firefox", description: "Privacy-focused" },
          { id: "webkit", name: "WebKit", description: "Lightweight" },
          { id: "edge", name: "Edge", description: "Microsoft Edge" },
        ];
      case "get_preferences": {
        const p = readPrefs();
        return [p.engine, !!p.ad_blocking, !!p.center_search];
      }
      case "set_selected_engine": {
        const engine_id = args && (args.engine_id || args.engineId);
        const p = readPrefs();
        p.engine = engine_id || p.engine;
        savePrefs(p);
        return true;
      }
      case "set_ad_blocking_enabled": {
        const enabled =
          args && (args.enabled !== undefined ? args.enabled : true);
        const p = readPrefs();
        p.ad_blocking = !!enabled;
        savePrefs(p);
        return true;
      }
      case "complete_onboarding": {
        const p = readPrefs();
        p.onboarding_completed = true;
        savePrefs(p);
        try {
          localStorage.setItem("zed_browser_onboarding_completed", "true");
        } catch (e) {
          /* ignore */
        }
        return true;
      }
      case "has_completed_onboarding":
        return (
          localStorage.getItem("zed_browser_onboarding_completed") === "true" ||
          !!readPrefs().onboarding_completed
        );
      default:
        throw new Error(
          "Command " + cmd + " is not implemented in fallback invoke",
        );
    }
  };
}

async function init() {
  try {
    const invoke = getInvoke();
    console.log("Starting onboarding initialization...");

    // Check if already completed onboarding
    console.log("Checking if onboarding completed...");
    const hasCompleted = await invoke("has_completed_onboarding");
    console.log("Has completed onboarding:", hasCompleted);
    if (hasCompleted) {
      window.location.href = "index.html";
      return;
    }

    // Get engines
    console.log("Fetching browser engines...");
    engines = await invoke("get_browser_engines");
    console.log("Got engines:", engines);

    if (!engines || engines.length === 0) {
      console.error("No engines returned!");
      throw new Error("Failed to load browser engines");
    }

    // Get preferences
    console.log("Fetching preferences...");
    const prefs = await invoke("get_preferences");
    console.log("Got preferences:", prefs);
    const currentEngine = prefs && prefs[0] ? prefs[0] : "chromium";
    const adBlockingEnabled = prefs && prefs[1] !== null ? prefs[1] : true;
    console.log(
      "Current engine:",
      currentEngine,
      "Ad blocking:",
      adBlockingEnabled,
    );

    renderEngines();
    selectEngine(currentEngine);

    const adBlockCheckbox = document.getElementById("adBlocking");
    if (adBlockCheckbox) {
      adBlockCheckbox.checked = adBlockingEnabled;
    }
    console.log("Onboarding UI initialized successfully");
  } catch (error) {
    console.error("Error during onboarding init:", error);
    console.error("Error stack:", error.stack);

    // Display the error to the user
    const grid = document.getElementById("engineGrid");
    if (grid) {
      grid.innerHTML = `<div style="color: red; padding: 20px; text-align: center;">
        <strong>Error loading engines:</strong><br>
        ${error.message || "Unknown error"}
      </div>`;
    }

    // Try to continue with defaults
    selectedEngine = "chromium";
    engines = [
      {
        id: "chromium",
        name: "Chromium",
        description: "Fast and modern",
      },
      {
        id: "firefox",
        name: "Firefox",
        description: "Privacy-focused",
      },
      {
        id: "webkit",
        name: "WebKit",
        description: "Lightweight",
      },
      {
        id: "edge",
        name: "Edge",
        description: "Microsoft Edge",
      },
    ];
    renderEngines();
    selectEngine("chromium");
  }
}

function renderEngines() {
  const grid = document.getElementById("engineGrid");
  if (!grid) {
    console.error("Engine grid element not found!");
    return;
  }

  grid.innerHTML = "";

  if (!engines || engines.length === 0) {
    grid.innerHTML = "<p>No engines available</p>";
    return;
  }

  engines.forEach((engine) => {
    const card = document.createElement("div");
    card.className = "engine-card";
    card.dataset.engineId = engine.id;

    card.innerHTML = `
      <div class="engine-name">${engine.name}</div>
      <div class="engine-description">${engine.description}</div>
    `;

    card.addEventListener("click", () => {
      console.log("Selected engine:", engine.id);
      selectEngine(engine.id);
    });
    grid.appendChild(card);
  });

  console.log("Rendered", engines.length, "engine cards");
}

function selectEngine(engineId) {
  console.log("selectEngine called with:", engineId);
  selectedEngine = engineId;

  document.querySelectorAll(".engine-card").forEach((card) => {
    if (card.dataset.engineId === engineId) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  const continueBtn = document.getElementById("continueBtn");
  if (continueBtn) {
    continueBtn.disabled = false;
  }
}

// Setup the continue button when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, setting up continue button...");
  const continueBtn = document.getElementById("continueBtn");

  if (!continueBtn) {
    console.error("Continue button not found!");
    return;
  }

  continueBtn.addEventListener("click", async () => {
    console.log("Continue button clicked");
    console.log("Selected engine:", selectedEngine);

    try {
      const invoke = getInvoke();

      if (!selectedEngine) {
        console.error("No engine selected!");
        alert("Please select a browser engine first.");
        return;
      }

      const adBlockElement = document.getElementById("adBlocking");
      const adBlockingEnabled = adBlockElement ? adBlockElement.checked : true;
      console.log(
        "Setting preferences - engine:",
        selectedEngine,
        "ad blocking:",
        adBlockingEnabled,
      );

      // Disable button to prevent double-clicks
      continueBtn.disabled = true;
      continueBtn.textContent = "Setting up...";

      // Invoke the Tauri commands
      console.log(
        "Calling set_selected_engine with engine_id:",
        selectedEngine,
      );
      const engineResult = await invoke("set_selected_engine", {
        engine_id: selectedEngine,
      });
      console.log("set_selected_engine result:", engineResult);

      console.log(
        "Calling set_ad_blocking_enabled with enabled:",
        adBlockingEnabled,
      );
      const adBlockResult = await invoke("set_ad_blocking_enabled", {
        enabled: adBlockingEnabled,
      });
      console.log("set_ad_blocking_enabled result:", adBlockResult);

      console.log("Calling complete_onboarding...");
      const completeResult = await invoke("complete_onboarding");
      console.log("complete_onboarding result:", completeResult);

      console.log("All commands completed successfully!");

      // Navigate to main browser after a short delay
      setTimeout(() => {
        console.log("Navigating to main browser...");
        window.location.href = "index.html";
      }, 500);
    } catch (error) {
      console.error("Error during onboarding completion:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      continueBtn.disabled = false;
      continueBtn.textContent = "Continue";

      // Show detailed error
      alert(
        "Failed to complete onboarding:\n\n" +
          (error.message || "Unknown error") +
          "\n\nCheck the browser console (F12) for more details.",
      );
    }
  });

  console.log("Continue button listener attached");
});

// Run initialization (ensure DOM is ready)
console.log("onboarding.js loaded");
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
