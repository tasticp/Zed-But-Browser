# Visual Guide: New UI Features

## 1. Zed IDE-Inspired Dark Theme

```
┌─────────────────────────────────────────────────────────────┐
│                  Zed Browser (Dark Theme)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  BACKGROUND:  #0a0a0a (Pure Black)                           │
│  PANELS:      #0f0f0f (Dark Gray)                            │
│  SURFACE:     #1a1a1a (Lighter Panels)                       │
│  ACCENT:      #5fb3f5 (Bright Blue - Zed Default)           │
│  TEXT:        #d8d8d8 (Light Gray)                           │
│  MUTED:       #8b92a1 (Dim Labels)                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Desktop Layout (Open Sidebar)

```
┌──────────────────────────────────────────────────────────────┐
│┌────────────────┬──────────────────────────────────────────┐ │
││   TABS     + ≡ │ Home > Settings > Advanced              │ │
││───────────────┼──────────────────────────────────────────┤ │
││ ► Home        │                                            │ │
││   • Child A1  │  [Main Content Area]                       │ │
││   • Child A2  │                                            │ │
││ ► Docs        │  Select a tab to view content.             │ │
││ ► Config      │                                            │ │
││               │                                            │ │
││ [Engine: ▼]   │                                            │ │
│└────────────────┴──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Collapsed Sidebar (Desktop)

```
┌──────────────────────────────────────────────────────────────┐
│┌──────────────────────────────────────────────────────────┐  │
││ Home > Settings > Advanced                                │ ≡│
│├──────────────────────────────────────────────────────────┤ │
││                                                            │ │
││  [Main Content Area - Full Width]                         │ │
││                                                            │ │
││  Click ≡ to expand sidebar                                │ │
││                                                            │ │
││                                                            │ │
│└──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Search Modal (Ctrl+T)

```
                    ╔════════════════════════════════╗
                    ║     QUICK SEARCH               ║
                    ║═══════════════════════════════ ║
                    ║ ┌──────────────────────────┐   ║
                    ║ │ Search tabs, history...  │   ║
                    ║ └──────────────────────────┘   ║
                    ║ [Recent]                       ║
                    ║ Home                           ║
                    ║ /home.txt               Recent │
                    ║ ─────────────────────────────── ║
                    ║ Docs                           ║
                    ║ /docs/readme.md        Recent  │
                    ║ ─────────────────────────────── ║
                    ║ Config (sync)                  ║
                    ║ /config.json           Recent  ║
                    ║ ─────────────────────────────── ║
                    ║ ESC to close · ↑↓ navigate    ║
                    ╚════════════════════════════════╝
```

---

## 5. Mobile Layout (< 768px, Collapsed)

```
┌─────────────────────────────┐
│ Home > Settings  ☰ ≡        │  ← Hamburger menu & collapse
├─────────────────────────────┤
│                             │
│ [Main Content]              │
│ Full screen width           │
│                             │
│ Tab view displayed here     │
│                             │
│                             │
└─────────────────────────────┘
```

---

## 6. Mobile Layout (< 768px, Sidebar Open)

```
┌──────────────────┬──────────┐
│ TABS  + ≡        │ Home >... │  ← Overlay sidebar
├──────────────────┤          │
│ ► Home          │[Content] │
│   • Child A1    │          │
│   • Child A2    │          │
│ ► Docs          │          │
│                 │          │
│[Engine: ▼]      │          │
└──────────────────┴──────────┘
```

---

## 7. Keyboard Shortcuts & Interactions

### Essential Shortcuts
```
┌──────────────────────────────────┬──────────────────┐
│ Action                           │ Shortcut         │
├──────────────────────────────────┼──────────────────┤
│ Quick Search (Open Modal)        │ Ctrl+T / Cmd+T   │
│ Close Active Tab                 │ Ctrl+W / Cmd+W   │
│ Duplicate Tab                    │ Ctrl+D / Cmd+D   │
│ Toggle Sidebar Collapse          │ Ctrl+B / Cmd+B   │
│ Close Search Modal               │ Escape           │
└──────────────────────────────────┴──────────────────┘
```

### Search Modal Controls
```
┌──────────────────────────────────┬──────────────────┐
│ In Search Modal                  │ Action           │
├──────────────────────────────────┼──────────────────┤
│ Type                             │ Filter results   │
│ ↑ ↓ (Arrow keys)                 │ Navigate results │
│ Enter                            │ Select & switch  │
│ Escape                           │ Close modal      │
└──────────────────────────────────┴──────────────────┘
```

---

## 8. Sidebar Components Breakdown

```
┌─ SIDEBAR HEADER ──────────────┐
│ TABS              [+] [≡]    │ ← Uppercase label + action buttons
├───────────────────────────────┤
│ TAB TREE                      │
│ ┌─ Node (with actions) ──┐   │
│ │ ► Title         │x dup │   │ ← Tab entry with hover actions
│ │   /file/path    │sync  │   │
│ │ ┌─ Child 1    ──┤     │   │ ← Nested children (indented)
│ │ └─ Child 2    ──┤     │   │
│ └───────────────────────────┘
│                              │
├─ SIDEBAR FOOTER ──────────────┤
│ Engine: [WebKit     ▼]       │ ← Dropdown selector
└───────────────────────────────┘
```

---

## 9. Color Palette Reference

```css
/* Zed Browser Color Variables */

:root {
  --bg: #0a0a0a;              /* Main background */
  --panel: #0f0f0f;            /* Sidebar background */
  --surface: #1a1a1a;          /* Secondary panels */
  --border: rgba(255,255,255,0.05); /* Subtle borders */
  --muted: #8b92a1;            /* Dim text/labels */
  --accent: #5fb3f5;           /* Primary highlight */
  --accent-hover: #7ac8ff;     /* Hover state */
  --text: #d8d8d8;             /* Main text */
  --text-secondary: #a0a8b8;   /* Secondary text */
}
```

---

## 10. Interaction States

### Button Hover State
```
NORMAL:  [Button] (transparent bg, muted text)
HOVER:   [Button] (light bg, accent text, accent border)
ACTIVE:  [Button] (darker bg, accent text)
```

### Tab Node States
```
NORMAL:    Tab Title (secondary text)
HOVER:     Tab Title (light bg, brighter text)
SELECTED:  Tab Title (accent bg, dark text) ← Highlighted
```

### Input Focus State
```
NORMAL:    ┌─────────────────┐
           │ Placeholder... │
           └─────────────────┘

FOCUSED:   ┌─────────────────┐
           │ Type here...   │ ← Light blue tint background
           └─────────────────┘
```

---

## 11. Responsive Breakpoints

| Size | Layout | Sidebar | Features |
|------|--------|---------|----------|
| **Desktop (> 768px)** | Side-by-side | Always visible | Full features |
| **Tablet (768px-480px)** | Overlay | Auto-collapse | Touch-friendly |
| **Mobile (< 480px)** | Stacked | Overlay | Minimal buttons |

---

## 12. Animation Timings

```javascript
/* All smooth, responsive transitions */

Sidebar collapse:     0.2s ease
Modal fade-in:        0.15s ease
Hover effects:        0.15s ease
Button click:         instant (no delay)
Breadcrumb scroll:    natural (no animation)
```

---

## Testing Checklist

- [ ] Press **Ctrl+T** → Search modal appears centered
- [ ] Type in search → Results filter in real-time
- [ ] Press **Escape** → Modal closes
- [ ] Click **≡** button → Sidebar collapses with animation
- [ ] Click **≡** again → Sidebar expands
- [ ] Resize to < 768px → Sidebar auto-collapses
- [ ] Select engine → Dropdown works, persists
- [ ] Click breadcrumb → Navigates to parent tab
- [ ] Mobile (< 480px) → Buttons are touch-friendly

---

**Zed Browser: Minimal. Fast. Keyboard-First.** ⚡
