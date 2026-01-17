# Phase 2: Web Browsing Integration - ROADMAP

## Overview
Phase 2 will layer web browsing capabilities on top of the Zed IDE foundation. This includes loading web content, navigation controls, tab management for URLs, and engine selection.

---

## Core Features to Implement

### 1. Web Content Display
**Goal:** Show web pages in the editor pane

**Implementation:**
```javascript
// Add iframe to editor-content area
const iframe = document.createElement('iframe');
iframe.id = 'content-frame';
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';
iframe.style.background = 'white';
editorContent.appendChild(iframe);

// Navigate function
function navigateUrl(url) {
  const node = store.nodes.get(store.selected);
  if (!node) return;
  
  try {
    const cleanUrl = sanitizeUrl(url);
    iframe.src = cleanUrl;
    node.currentUrl = cleanUrl;
    node.history.push(cleanUrl);
    updateTabDisplay();
  } catch(e) {
    console.error('Navigation error:', e);
  }
}
```

**URL Sanitization:**
```javascript
function sanitizeUrl(url) {
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
    return 'https://' + url;
  }
  return url;
}
```

---

### 2. Address Bar
**Goal:** Allow users to type and navigate URLs

**Option A: Menu Bar Address Bar**
- Add URL input to menu bar
- Shows current page URL
- Enter to navigate
- Keyboard shortcut: Ctrl+L (focus address bar)

**Option B: Tab Bar Address Bar**
- Add input to tab bar when tab is active
- Shows URL next to tab title
- Cleaner integration with tab bar

**Recommended:** Option A - Cleaner separation

**Implementation:**
```html
<!-- Add to menu bar -->
<div class="address-bar">
  <input id="address-input" type="text" placeholder="Enter URL..." />
  <button id="reload-btn">🔄</button>
</div>
```

```javascript
const addressInput = document.getElementById('address-input');
addressInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const url = addressInput.value;
    navigateUrl(url);
  }
});

// Ctrl+L focus address bar
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
    e.preventDefault();
    addressInput.focus();
    addressInput.select();
  }
});
```

---

### 3. Navigation Controls
**Goal:** Back, Forward, Reload buttons

**UI Placement:** Menu bar or tab bar

**Buttons:**
- **Back** (←): Load previous URL in history
- **Forward** (→): Load next URL in history  
- **Reload** (🔄): Refresh current page
- **Stop** (⊗): Stop loading (show when page loading)

**Implementation:**
```javascript
function goBack() {
  const node = store.nodes.get(store.selected);
  if (!node || !node.history) return;
  
  const currentIndex = node.history.indexOf(node.currentUrl);
  if (currentIndex > 0) {
    const prevUrl = node.history[currentIndex - 1];
    iframe.src = prevUrl;
    node.currentUrl = prevUrl;
    updateTabDisplay();
  }
}

function goForward() {
  const node = store.nodes.get(store.selected);
  if (!node || !node.history) return;
  
  const currentIndex = node.history.indexOf(node.currentUrl);
  if (currentIndex < node.history.length - 1) {
    const nextUrl = node.history[currentIndex + 1];
    iframe.src = nextUrl;
    node.currentUrl = nextUrl;
    updateTabDisplay();
  }
}

function reload() {
  iframe.location.reload();
}
```

---

### 4. Tab Management for URLs
**Goal:** Show URLs in tabs and update on navigation

**Display Format:**
```
[Icon] Title (URL on hover)
```

**Implementation:**
```javascript
function updateTabDisplay() {
  const tabs = document.querySelectorAll('.editor-tab');
  tabs.forEach(tab => {
    const tabId = tab.dataset.tabId;
    const node = store.nodes.get(tabId);
    
    if (node && node.currentUrl) {
      // Show favicon if available
      const url = new URL(node.currentUrl);
      const favicon = `https://www.google.com/s2/favicons?sz=16&domain=${url.hostname}`;
      
      // Update tab title with shortened URL
      const displayUrl = url.hostname || 'Local';
      tab.dataset.url = node.currentUrl;
      tab.title = node.currentUrl;
    }
  });
}
```

---

### 5. Loading State Indicator
**Goal:** Show when page is loading

**Options:**
1. Spinner in tab
2. Loading bar under tab bar
3. Status text in address bar

**Recommended:** Combination of spinner + progress bar

**Implementation:**
```javascript
const iframe = document.getElementById('content-frame');

iframe.addEventListener('loadstart', () => {
  const tab = document.querySelector(`[data-tab-id="${store.selected}"]`);
  tab?.classList.add('loading');
  showProgressBar();
});

iframe.addEventListener('loadend', () => {
  const tab = document.querySelector(`[data-tab-id="${store.selected}"]`);
  tab?.classList.remove('loading');
  hideProgressBar();
});
```

---

### 6. Engine Selection Integration
**Goal:** Use selected browser engine for content

**Current State:** `browser.js` already handles engine config

**Next Steps:**
1. Pass engine choice to Tauri backend
2. Use Tauri's `webview::WebViewBuilder` with engine config
3. Handle engine-specific features (DevTools, etc.)

**Implementation (Tauri):**
```rust
// In main.rs
#[tauri::command]
fn get_engine() -> String {
  // Retrieve from config
  "webkit".to_string()
}

#[tauri::command]
fn set_engine(engine: String) {
  // Persist engine choice
  // Restart webview if needed
}
```

---

### 7. Search/Find in Page
**Goal:** Ctrl+F to search within page

**Keyboard Shortcut:** `Ctrl+F` / `Cmd+F`

**UI:**
```
┌─ Find Bar ──────────────────────┐
│ 🔍 [search box] ↑ ↓ × (case)    │
│ "5 of 12 matches"               │
└─────────────────────────────────┘
```

**Implementation:**
```javascript
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    toggleFindBar();
  }
});

function toggleFindBar() {
  // Show/hide find bar
  // Integrate with iframe content search
}
```

---

## Enhanced Tab System

### Tab Metadata
```javascript
class Node {
  // ... existing properties
  currentUrl: null,        // Current page URL
  title: 'Home',          // Tab title
  favicon: null,          // Favicon URL
  history: [],            // Navigation history
  isLoading: false,       // Loading state
  lastModified: null,     // Last navigation time
}
```

### Tab Display
```javascript
function renderTab(node) {
  const tab = document.createElement('button');
  tab.className = 'editor-tab';
  tab.dataset.tabId = node.id;
  
  // Icon (favicon or default)
  const icon = document.createElement('img');
  icon.src = node.favicon || '📄';
  icon.className = 'tab-icon';
  
  // Loading indicator
  if (node.isLoading) {
    tab.classList.add('loading');
  }
  
  // Title (page title or domain)
  const title = document.createElement('span');
  title.textContent = node.title;
  
  // URL tooltip
  if (node.currentUrl) {
    tab.title = node.currentUrl;
  }
  
  // Close button
  const closeBtn = document.createElement('span');
  closeBtn.className = 'tab-close';
  closeBtn.textContent = '×';
  
  tab.appendChild(icon);
  tab.appendChild(title);
  tab.appendChild(closeBtn);
  
  return tab;
}
```

---

## Mobile Responsiveness

### Mobile Adaptations
1. **Hamburger Menu:** Menu bar → mobile drawer
2. **Address Bar:** Moves to top (full width)
3. **Tab Bar:** Horizontal scroll or dropdown
4. **Sidebar:** Slide-out drawer (already implemented)
5. **AI Panel:** Slide-in from right

### Touch Interactions
```javascript
// Long-press to open context menu
iframe.addEventListener('contextmenu', (e) => {
  if (window.innerWidth < 768) {
    e.preventDefault();
    showMobileContextMenu(e);
  }
});

// Swipe back/forward
let touchStartX = 0;
iframe.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});

iframe.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const diff = touchStartX - touchEndX;
  
  if (diff > 50) goForward();  // Swipe left
  if (diff < -50) goBack();    // Swipe right
});
```

---

## Security Considerations

### Same-Origin Policy
- Iframe sandboxing: Allow scripts but restrict cookies
- Content Security Policy headers
- No access to localStorage from loaded content

### Sandbox Attributes
```html
<iframe
  id="content-frame"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
/>
```

### URL Validation
```javascript
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'about:'];

function validateUrl(urlString) {
  try {
    const url = new URL(urlString);
    return ALLOWED_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}
```

---

## Performance Optimizations

### Lazy Loading
- Only load page when tab is active
- Unload content when tab is closed
- Cache page state if possible

### Memory Management
```javascript
function closeNode(id) {
  const node = store.nodes.get(id);
  
  // Unload iframe if this is the active node
  if (store.selected === id) {
    iframe.src = 'about:blank';
  }
  
  // Clear history to free memory
  node.history = [];
  node.currentUrl = null;
  
  // ... rest of close logic
}
```

### Debounced Persistence
```javascript
let saveTimer = null;

function schedulePersist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    persistState();
  }, 500); // Save 500ms after last change
}
```

---

## Integration Checklist

### Phase 2A: Web Content (Priority 1)
- [ ] Add iframe to editor pane
- [ ] Implement `navigateUrl()` function
- [ ] Update tab display with current URL
- [ ] Add address bar to menu bar
- [ ] Implement Ctrl+L focus
- [ ] Basic navigation (back/forward/reload)
- [ ] URL tooltip on tabs
- [ ] Loading state indicator

### Phase 2B: Advanced Features (Priority 2)
- [ ] Favicon support
- [ ] Find in page (Ctrl+F)
- [ ] Mobile touch gestures
- [ ] Right-click context menu
- [ ] DevTools integration
- [ ] Download management
- [ ] Print support

### Phase 2C: Polish & Optimization (Priority 3)
- [ ] Memory profiling
- [ ] Performance testing
- [ ] Mobile testing across devices
- [ ] Accessibility audit
- [ ] Security audit
- [ ] Error handling improvements

---

## Example: Complete Navigation Flow

```javascript
// User types URL in address bar
const addressInput = document.getElementById('address-input');
addressInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const url = e.target.value;
    
    // 1. Validate URL
    if (!validateUrl(url)) {
      console.error('Invalid URL');
      return;
    }
    
    // 2. Get current tab
    const node = store.nodes.get(store.selected);
    if (!node) return;
    
    // 3. Show loading state
    node.isLoading = true;
    updateTabDisplay();
    
    // 4. Navigate
    iframe.src = sanitizeUrl(url);
    
    // 5. Update node
    node.currentUrl = url;
    if (!node.history.includes(url)) {
      node.history.push(url);
    }
    
    // 6. Update address bar
    addressInput.value = url;
    addressInput.blur();
    
    // 7. Save state
    schedulePersist();
  }
});

iframe.addEventListener('load', () => {
  const node = store.nodes.get(store.selected);
  if (node) {
    node.isLoading = false;
    updateTabDisplay();
  }
});
```

---

## Timeline Estimate

- **Phase 2A (Web Content):** 4-6 hours
- **Phase 2B (Advanced Features):** 4-6 hours  
- **Phase 2C (Polish):** 2-3 hours
- **Total Phase 2:** ~2 days of development

---

## Success Criteria

✅ Can load and display web pages
✅ Navigate using address bar
✅ Back/forward/reload buttons work
✅ Tabs show current URL
✅ Mobile responsive
✅ Loading states visible
✅ No memory leaks
✅ All keyboard shortcuts working
✅ URLs persist between sessions
✅ Handles navigation errors gracefully

---

## Next: Start Phase 2A
When ready, begin Phase 2A implementation with iframe integration and basic navigation.
